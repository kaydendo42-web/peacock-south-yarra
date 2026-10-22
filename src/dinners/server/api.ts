import type { ApiRequest, ApiResponse } from '../../booking/server/api.ts'
import type { Mailer } from '../../booking/server/email.ts'
import { shiftDays, todayKey, venueMinutes } from '../../booking/data/time.ts'
import { addOnLineId, cancelCutoffFor, cutoffFor, dinners, dishesOn, findDish, orderableDates, pickupLabel, portionsOf } from '../menu.ts'
import { canCancel, checkDinnerToken, orderQuery } from './cancel.ts'
import { cancelledNote, dinnersInbox, guestReceipt, pickupList } from './email.ts'
import type { Payments } from './square.ts'
import { verifyWebhook } from './square.ts'
import { soldKey, type DinnerLine, type DinnerOrder, type DinnerStore } from './store.ts'

/**
 * The $5 dinners API, in the same plain request/response shape as the booking
 * API so every rule is testable without a server.
 *
 *   GET  /availability        what's on, and portions left, for every open day
 *   POST /orders              hold portions and open a Square checkout
 *   GET  /orders/:id          an order's status; confirms payment with Square
 *   POST /orders/:id/cancel   the guest cancels, with their signed link; refunds
 *   POST /webhook             Square's payment notifications
 *   GET  /digest              the 9pm pickup list (Vercel cron)
 *
 * The cap is the database's to enforce (`reserve`); the dates, dishes and
 * quantities a guest may ask for are checked here.
 */

export type DinnersRequest = ApiRequest & {
  /** The site's own origin, for Square's redirect back. */
  origin: string
  /** The body exactly as sent; Square signs the bytes, not the parsed JSON. */
  rawBody?: string
}

export type DinnersConfig = {
  store: DinnerStore
  /** Null when Square isn't configured: the menu shows, ordering is off. */
  payments: Payments | null
  mailer: Mailer | null
  env: NodeJS.ProcessEnv
  now?: () => Date
}

const json = (status: number, body?: unknown): ApiResponse => ({ status, body })

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function newReference(): string {
  let out = ''
  for (const b of crypto.getRandomValues(new Uint8Array(8))) out += REF_ALPHABET[b % REF_ALPHABET.length]
  return `DN-${out}`
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

/**
 * What a guest sees of an order: no phone or email, and no other guest's
 * anything. With the signed link (`owner`), also whether they can cancel.
 */
function publicOrder(o: DinnerOrder, now: Date, owner = false) {
  return {
    id: o.id,
    status: o.status,
    pickupDate: o.pickupDate,
    pickupLabel: pickupLabel(o.pickupDate),
    pickupWindow: dinners.pickup.label,
    lines: o.lines,
    totalCents: o.totalCents,
    ...(o.squareRefundId ? { refunded: true } : {}),
    ...(owner
      ? { canCancel: canCancel(o, now), cancelUntil: cancelCutoffFor(o.pickupDate).toISOString() }
      : {}),
    // A guest who closed the tab mid-payment can pick up where they left off.
    ...(o.status === 'pending' && o.checkoutUrl && new Date(o.holdExpiresAt) > now
      ? { checkoutUrl: o.checkoutUrl }
      : {}),
  }
}

/**
 * Ask Square whether an order is paid and, if it is, mark it paid and send the
 * receipt. The status check inside `update` makes this safe to run from the
 * redirect and the webhook at once: only one of them sends the email.
 */
async function confirm(order: DinnerOrder, config: DinnersConfig): Promise<DinnerOrder> {
  if (order.status !== 'pending' && order.status !== 'expired') return order
  if (!order.squareOrderId || !config.payments) return order
  if (!(await config.payments.isPaid(order.squareOrderId, order.totalCents))) return order

  const now = (config.now ?? (() => new Date()))()
  const paid = { ...order, status: 'paid' as const, paidAt: now.toISOString() }
  if (!(await config.store.update(order.id, ['pending', 'expired'], { status: 'paid', paidAt: paid.paidAt }))) {
    return (await config.store.get(order.id)) ?? paid
  }
  if (order.status === 'expired') {
    // Paid after its hold ran out: the portions may have gone to someone else.
    console.warn(`Dinner order ${order.id} was paid after its hold lapsed; check ${order.pickupDate} isn't over the cap.`)
  }
  if (config.mailer) {
    await config.mailer
      .send(guestReceipt(paid, dinnersInbox(config.env), config.env))
      .catch((e) => console.error(`Dinner receipt (${order.id}) failed:`, e))
  }
  return paid
}

/**
 * Give lapsed holds' portions back for good: close each checkout so it can't
 * be paid late, unless Square says it already was.
 */
async function sweep(config: DinnersConfig, now: Date) {
  if (!config.payments) return
  for (const o of await config.store.lapsed(now)) {
    try {
      if (o.squareOrderId && (await config.payments.isPaid(o.squareOrderId, o.totalCents))) {
        await confirm(o, config)
        continue
      }
      if (o.squarePaymentLinkId) await config.payments.closeCheckout(o.squarePaymentLinkId)
      await config.store.update(o.id, ['pending'], { status: 'expired' })
    } catch (e) {
      console.error(`Could not close lapsed dinner order ${o.id}:`, e)
    }
  }
}

export async function handleDinners(req: DinnersRequest, config: DinnersConfig): Promise<ApiResponse> {
  const now = (config.now ?? (() => new Date()))()
  const { store } = config

  // --- what's on ---------------------------------------------------------
  if (req.path === '/availability' && req.method === 'GET') {
    await sweep(config, now)
    const dates = orderableDates(now)
    const sold = dates.length ? await store.sold(dates[0], dates[dates.length - 1], now) : new Map()
    return json(200, {
      ordering: config.payments !== null,
      pickup: dinners.pickup.label,
      maxPerDish: dinners.maxPerDish,
      days: dates.map((date) => ({
        date,
        label: pickupLabel(date),
        closesAt: cutoffFor(date).toISOString(),
        dishes: dishesOn(date).map((d) => ({
          ...d,
          // Never more than one order can take: how many Jenny makes stays hers.
          left: Math.min(Math.max(portionsOf(d) - (sold.get(soldKey(date, d.id)) ?? 0), 0), dinners.maxPerDish),
        })),
      })),
    })
  }

  // --- placing an order ----------------------------------------------------
  if (req.path === '/orders' && req.method === 'POST') {
    if (!config.payments) {
      return json(503, { error: 'Online ordering is not open yet. Call us to order.' })
    }
    const body = (req.body ?? {}) as Record<string, unknown>
    const date = text(body.date, 10)
    if (!orderableDates(now).includes(date)) {
      return json(409, {
        error: 'Orders for that day have closed. Orders close at 9pm the night before.',
        code: 'closed',
      })
    }

    const quantities = new Map<string, number>()
    for (const item of Array.isArray(body.items) ? body.items : []) {
      const { dishId, quantity } = (item ?? {}) as { dishId?: unknown; quantity?: unknown }
      if (typeof dishId !== 'string' || !Number.isInteger(quantity) || (quantity as number) < 0) {
        return json(400, { error: 'Something in your order was not right. Refresh and try again.' })
      }
      quantities.set(dishId, (quantities.get(dishId) ?? 0) + (quantity as number))
    }
    const lines: DinnerLine[] = []
    for (const [dishId, quantity] of quantities) {
      if (quantity === 0) continue
      const extra = dishId.match(/^(.+)\+([a-z]+)$/)
      if (extra) {
        // An add-on (parmesan): at most one per portion of its dish.
        const base = findDish(date, extra[1])
        if (!base?.addOn || base.addOn.id !== extra[2]) {
          return json(400, { error: 'That extra is not on for that day. Refresh and try again.' })
        }
        if (quantity > (quantities.get(base.id) ?? 0)) {
          return json(400, { error: `Add ${base.addOn.name.toLowerCase()} to at most one per ${base.name}.` })
        }
        lines.push({
          dishId,
          dishName: `${base.addOn.name} on ${base.name}`,
          priceCents: base.addOn.priceCents,
          quantity,
        })
        continue
      }
      const dish = findDish(date, dishId)
      if (!dish) return json(400, { error: 'That dish is not on for that day. Refresh and try again.' })
      if (quantity > dinners.maxPerDish) {
        return json(400, {
          error: `You can order up to ${dinners.maxPerDish} of each dish. For more, call us.`,
          code: 'too-many',
        })
      }
      lines.push({ dishId, dishName: dish.name, priceCents: dish.priceCents, quantity })
    }
    if (!lines.length) return json(400, { error: 'Choose at least one dinner.' })

    const guestName = text(body.name, 80)
    const phone = text(body.phone, 30)
    const email = text(body.email, 120)
    if (!guestName || !phone || !EMAIL.test(email)) {
      return json(400, { error: 'A name, a phone number and an email are required.' })
    }

    const order: DinnerOrder = {
      id: newReference(),
      pickupDate: date,
      guestName,
      phone,
      email,
      status: 'pending',
      totalCents: lines.reduce((sum, l) => sum + l.priceCents * l.quantity, 0),
      holdExpiresAt: new Date(now.getTime() + dinners.holdMinutes * 60_000).toISOString(),
      createdAt: now.toISOString(),
      lines,
    }

    // Add-ons aren't counted against anything: their dish's cap already limits them.
    const caps = Object.fromEntries(
      dishesOn(date).flatMap((d) => [
        [d.id, portionsOf(d)],
        ...(d.addOn ? [[addOnLineId(d), 1_000_000]] : []),
      ]),
    )
    const held = await store.reserve(order, caps, now)
    if (!held.ok) {
      const name = findDish(date, held.dishId)?.name ?? 'That dish'
      return json(409, {
        error: held.left
          ? `Only ${held.left} ${name} left for ${pickupLabel(date)}.`
          : `${name} has sold out for ${pickupLabel(date)}.`,
        code: 'sold-out',
        dishId: held.dishId,
        left: held.left,
      })
    }

    let checkout
    try {
      checkout = await config.payments.createCheckout(order, `${req.origin}/dinners/thanks?${orderQuery(order.id, config.env)}`)
    } catch (e) {
      console.error(`Square checkout for dinner order ${order.id} failed:`, e)
      // Give the portions straight back rather than holding them for nobody.
      await store.update(order.id, ['pending'], { status: 'cancelled' }).catch(() => undefined)
      return json(502, { error: `We couldn't open the payment page. Try again, or call us on the number below.` })
    }
    await store.update(order.id, ['pending'], {
      squareOrderId: checkout.squareOrderId,
      squarePaymentLinkId: checkout.linkId,
      checkoutUrl: checkout.url,
    })
    return json(201, { id: order.id, checkoutUrl: checkout.url })
  }

  // --- an order's status ----------------------------------------------------
  const one = req.path.match(/^\/orders\/(DN-[A-Z2-9]{8})$/)
  if (one && req.method === 'GET') {
    const order = await store.get(one[1])
    if (!order) return json(404, { error: 'No order with that number.' })
    const owner = checkDinnerToken(order.id, req.query.t, config.env)
    try {
      return json(200, publicOrder(await confirm(order, config), now, owner))
    } catch (e) {
      console.error(`Checking payment for ${order.id} failed:`, e)
      return json(200, publicOrder(order, now, owner))
    }
  }

  // --- the guest cancels ------------------------------------------------------
  const cancel = req.path.match(/^\/orders\/(DN-[A-Z2-9]{8})\/cancel$/)
  if (cancel && req.method === 'POST') {
    const token = ((req.body ?? {}) as { t?: unknown }).t
    const order = checkDinnerToken(cancel[1], token, config.env) ? await store.get(cancel[1]) : null
    if (!order) return json(404, { error: 'That link has expired or is not right. Call us to cancel.' })
    if (order.status === 'cancelled') return json(200, publicOrder(order, now, true))
    if (!canCancel(order, now)) {
      return json(409, {
        error: `Orders can be cancelled online up to ${dinners.cancelHours} hours before pickup. Call us and we'll see what we can do.`,
        code: 'too-late',
      })
    }
    if (!config.payments || !order.squareOrderId) {
      return json(503, { error: 'We couldn’t cancel online just now. Call us and we’ll refund you.' })
    }
    let refundId
    try {
      refundId = await config.payments.refund(order.squareOrderId, order.totalCents, order.id)
    } catch (e) {
      console.error(`Refund for dinner order ${order.id} failed:`, e)
      return json(502, { error: 'We couldn’t refund your card just now. Try again, or call us.' })
    }
    const patch = { status: 'cancelled' as const, cancelledAt: now.toISOString(), squareRefundId: refundId }
    if (await store.update(order.id, ['paid'], patch)) {
      const done = { ...order, ...patch }
      if (config.mailer) {
        await config.mailer
          .send(cancelledNote(done, dinnersInbox(config.env)))
          .catch((e) => console.error(`Dinner cancellation email (${order.id}) failed:`, e))
      }
      return json(200, publicOrder(done, now, true))
    }
    return json(200, publicOrder((await store.get(order.id)) ?? order, now, true))
  }

  // --- Square says a payment changed ----------------------------------------
  if (req.path === '/webhook' && req.method === 'POST') {
    const key = config.env.SQUARE_WEBHOOK_SIGNATURE_KEY
    const url = config.env.SQUARE_WEBHOOK_URL || `${req.origin}/api/dinners/webhook`
    if (!key || !verifyWebhook(req.rawBody ?? '', req.headers['x-square-hmacsha256-signature'], url, key)) {
      return json(401, { error: 'Bad signature.' })
    }
    const payment = (req.body as { data?: { object?: { payment?: { order_id?: string; status?: string } } } })?.data
      ?.object?.payment
    if (payment?.order_id && payment.status === 'COMPLETED') {
      const order = await store.bySquareOrder(payment.order_id)
      // Not one of ours (a café sale): nothing to do, and nothing to retry.
      if (order) await confirm(order, config)
    }
    return json(200, { ok: true })
  }

  // --- the 9pm pickup list ----------------------------------------------------
  if (req.path === '/digest' && req.method === 'GET') {
    const secret = config.env.CRON_SECRET
    if (!secret || req.headers.authorization !== `Bearer ${secret}`) return json(401, { error: 'Unauthorised.' })
    // Two crons cover daylight saving (10:05 and 11:05 UTC); only the one that
    // lands in Melbourne's 9pm hour sends.
    const minutes = venueMinutes(now)
    if (req.query.force !== '1' && (minutes < 21 * 60 || minutes >= 22 * 60)) {
      return json(200, { sent: false, reason: 'not 9pm in Melbourne' })
    }
    const tomorrow = req.query.date ?? shiftDays(todayKey(now), 1)
    if (!dishesOn(tomorrow).length) return json(200, { sent: false, reason: 'no dinners that day' })
    if (!config.mailer) return json(200, { sent: false, reason: 'email not configured' })
    const orders = await store.forDay(tomorrow)
    await config.mailer.send(pickupList(tomorrow, orders, dinnersInbox(config.env)))
    return json(200, { sent: true, date: tomorrow, orders: orders.length })
  }

  return json(404, { error: 'No such endpoint.' })
}
