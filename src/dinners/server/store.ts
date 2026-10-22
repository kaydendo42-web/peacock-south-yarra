import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { DateKey } from '../../booking/data/types.ts'
import { fromEnv, profileHeaders } from '../../booking/server/store.ts'

/**
 * Where dinner orders live: `thepeacock.dinner_orders` in Peregrine's Supabase
 * (migration `20261022000000_dinner_orders.sql` in the console repo), or a
 * JSON file in development. The cap is enforced inside `reserve`, which the
 * database runs under a per-day lock, so two guests can't both buy the last
 * portion.
 */

export type DinnerStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'collected'

export type DinnerLine = {
  dishId: string
  dishName: string
  priceCents: number
  quantity: number
}

export type DinnerOrder = {
  id: string
  pickupDate: DateKey
  guestName: string
  phone: string
  email: string
  status: DinnerStatus
  totalCents: number
  holdExpiresAt: string
  squareOrderId?: string
  squarePaymentLinkId?: string
  checkoutUrl?: string
  paidAt?: string
  /** Set when the guest cancelled online and was refunded. */
  cancelledAt?: string
  squareRefundId?: string
  createdAt: string
  lines: DinnerLine[]
}

/** dishId → portions on sale that day. */
export type Caps = Record<string, number>

export type Reservation = { ok: true } | { ok: false; dishId: string; left: number }

/** `${date}|${dishId}` → portions taken. */
export type Sold = Map<string, number>
export const soldKey = (date: DateKey, dishId: string) => `${date}|${dishId}`

export interface DinnerStore {
  sold(from: DateKey, to: DateKey, now?: Date): Promise<Sold>
  /** Insert the order if every dish has room under its cap; otherwise insert nothing. */
  reserve(order: DinnerOrder, caps: Caps, now?: Date): Promise<Reservation>
  get(id: string): Promise<DinnerOrder | null>
  bySquareOrder(squareOrderId: string): Promise<DinnerOrder | null>
  /** Paid and collected orders for a pickup day. */
  forDay(date: DateKey): Promise<DinnerOrder[]>
  /** Pending orders whose hold ran out, for closing their checkout links. */
  lapsed(now?: Date): Promise<DinnerOrder[]>
  /**
   * Change an order, but only while its status is one of `from`. Returns
   * whether it changed, so a paid order is confirmed (and emailed) once even
   * when the redirect and Square's webhook arrive together.
   */
  update(id: string, from: DinnerStatus[], patch: Partial<DinnerOrder>): Promise<boolean>
}

/** Whether an order's portions count against the cap at `now`. */
export const holdsPortions = (o: DinnerOrder, now: Date) =>
  o.status === 'paid' || o.status === 'collected' || (o.status === 'pending' && new Date(o.holdExpiresAt) > now)

// --- development: one JSON file ---------------------------------------------

export function fileStore(file: string): DinnerStore {
  let tail: Promise<unknown> = Promise.resolve()
  const locked = <T,>(job: () => Promise<T>): Promise<T> => {
    const next = tail.then(job, job)
    tail = next.catch(() => undefined)
    return next
  }
  const read = async (): Promise<DinnerOrder[]> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as DinnerOrder[]
    } catch {
      return []
    }
  }
  const write = async (all: DinnerOrder[]) => {
    await fs.mkdir(path.dirname(file), { recursive: true })
    const tmp = `${file}.${process.pid}.tmp`
    await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8')
    await fs.rename(tmp, file)
  }
  const tally = (all: DinnerOrder[], now: Date, keep: (o: DinnerOrder) => boolean) => {
    const sold: Sold = new Map()
    for (const o of all) {
      if (!keep(o) || !holdsPortions(o, now)) continue
      for (const l of o.lines) {
        const k = soldKey(o.pickupDate, l.dishId)
        sold.set(k, (sold.get(k) ?? 0) + l.quantity)
      }
    }
    return sold
  }

  return {
    sold: (from, to, now = new Date()) =>
      locked(async () => tally(await read(), now, (o) => o.pickupDate >= from && o.pickupDate <= to)),

    reserve: (order, caps, now = new Date()) =>
      locked(async () => {
        const all = await read()
        const sold = tally(all, now, (o) => o.pickupDate === order.pickupDate)
        for (const l of order.lines) {
          const taken = sold.get(soldKey(order.pickupDate, l.dishId)) ?? 0
          const cap = caps[l.dishId] ?? 0
          if (taken + l.quantity > cap) return { ok: false, dishId: l.dishId, left: Math.max(cap - taken, 0) }
        }
        all.push(order)
        await write(all)
        return { ok: true }
      }),

    get: async (id) => (await locked(read)).find((o) => o.id === id) ?? null,

    bySquareOrder: async (sq) => (await locked(read)).find((o) => o.squareOrderId === sq) ?? null,

    forDay: async (date) =>
      (await locked(read)).filter((o) => o.pickupDate === date && (o.status === 'paid' || o.status === 'collected')),

    lapsed: async (now = new Date()) =>
      (await locked(read)).filter((o) => o.status === 'pending' && new Date(o.holdExpiresAt) <= now),

    update: (id, from, patch) =>
      locked(async () => {
        const all = await read()
        const i = all.findIndex((o) => o.id === id)
        if (i === -1 || !from.includes(all[i].status)) return false
        all[i] = { ...all[i], ...patch, id, lines: all[i].lines }
        await write(all)
        return true
      }),
  }
}

// --- production: Supabase over PostgREST --------------------------------------

type OrderRow = {
  id: string
  venue_id: string
  pickup_date: string
  guest_name: string
  phone: string
  email: string
  status: DinnerStatus
  total_cents: number
  hold_expires_at: string
  square_order_id: string | null
  square_payment_link_id: string | null
  checkout_url: string | null
  paid_at: string | null
  cancelled_at: string | null
  square_refund_id: string | null
  created_at: string
  dinner_order_lines?: { dish_id: string; dish_name: string; price_cents: number; quantity: number }[]
}

const fromRow = (r: OrderRow): DinnerOrder => ({
  id: r.id,
  pickupDate: r.pickup_date,
  guestName: r.guest_name,
  phone: r.phone,
  email: r.email,
  status: r.status,
  totalCents: r.total_cents,
  holdExpiresAt: new Date(r.hold_expires_at).toISOString(),
  ...(r.square_order_id ? { squareOrderId: r.square_order_id } : {}),
  ...(r.square_payment_link_id ? { squarePaymentLinkId: r.square_payment_link_id } : {}),
  ...(r.checkout_url ? { checkoutUrl: r.checkout_url } : {}),
  ...(r.paid_at ? { paidAt: new Date(r.paid_at).toISOString() } : {}),
  ...(r.cancelled_at ? { cancelledAt: new Date(r.cancelled_at).toISOString() } : {}),
  ...(r.square_refund_id ? { squareRefundId: r.square_refund_id } : {}),
  createdAt: new Date(r.created_at).toISOString(),
  lines: (r.dinner_order_lines ?? []).map((l) => ({
    dishId: l.dish_id,
    dishName: l.dish_name,
    priceCents: l.price_cents,
    quantity: l.quantity,
  })),
})

/** The columns `update` may set, camelCase to snake_case. */
const patchColumns: Partial<Record<keyof DinnerOrder, keyof OrderRow>> = {
  status: 'status',
  squareOrderId: 'square_order_id',
  squarePaymentLinkId: 'square_payment_link_id',
  checkoutUrl: 'checkout_url',
  paidAt: 'paid_at',
  cancelledAt: 'cancelled_at',
  squareRefundId: 'square_refund_id',
}

export function supabaseDinnerStore(url: string, serviceKey: string, venueId: string): DinnerStore {
  const base = `${url.replace(/\/$/, '')}/rest/v1`
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
    ...profileHeaders,
  }
  const venue = `venue_id=eq.${encodeURIComponent(venueId)}`
  const select = 'select=*,dinner_order_lines(dish_id,dish_name,price_cents,quantity)'

  const call = async <T,>(pathAndQuery: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`${base}${pathAndQuery}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
      cache: 'no-store',
    })
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { code?: string }
      throw new Error(`dinner store unavailable (${res.status}${err.code ? `: ${err.code}` : ''})`)
    }
    return (await res.json()) as T
  }
  const orders = (query: string) =>
    call<OrderRow[]>(`/dinner_orders?${venue}&${select}&${query}`).then((rows) => rows.map(fromRow))

  return {
    async sold(from, to) {
      // `now()` in the database decides which holds have lapsed.
      const rows = await call<{ pickup_date: string; dish_id: string; sold: number }[]>('/rpc/dinner_sold', {
        method: 'POST',
        body: JSON.stringify({ p_venue: venueId, p_from: from, p_to: to }),
      })
      return new Map(rows.map((r) => [soldKey(r.pickup_date, r.dish_id), Number(r.sold)]))
    },

    async reserve(order, caps) {
      const out = await call<{ ok: boolean; dish_id?: string; left?: number }>('/rpc/reserve_dinner_order', {
        method: 'POST',
        body: JSON.stringify({
          p_order: {
            id: order.id,
            venue_id: venueId,
            pickup_date: order.pickupDate,
            guest_name: order.guestName,
            phone: order.phone,
            email: order.email,
            total_cents: order.totalCents,
            hold_expires_at: order.holdExpiresAt,
          },
          p_lines: order.lines.map((l) => ({
            dish_id: l.dishId,
            dish_name: l.dishName,
            price_cents: l.priceCents,
            quantity: l.quantity,
            cap: caps[l.dishId] ?? 0,
          })),
          // Superseded by each line's cap; kept so the function's signature holds.
          p_cap: 0,
        }),
      })
      return out.ok ? { ok: true } : { ok: false, dishId: out.dish_id ?? '', left: out.left ?? 0 }
    },

    get: async (id) => (await orders(`id=eq.${encodeURIComponent(id)}`))[0] ?? null,

    bySquareOrder: async (sq) => (await orders(`square_order_id=eq.${encodeURIComponent(sq)}`))[0] ?? null,

    forDay: (date) => orders(`pickup_date=eq.${date}&status=in.(paid,collected)&order=created_at`),

    lapsed: (now = new Date()) =>
      orders(`status=eq.pending&hold_expires_at=lte.${encodeURIComponent(now.toISOString())}&limit=50`),

    async update(id, from, patch) {
      const body: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(patch)) {
        const column = patchColumns[k as keyof DinnerOrder]
        if (column) body[column] = v
      }
      const rows = await call<unknown[]>(
        `/dinner_orders?id=eq.${encodeURIComponent(id)}&${venue}&status=in.(${from.join(',')})`,
        { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(body) },
      )
      return rows.length > 0
    },
  }
}

/** Supabase when configured (the same variables as the booking diary), else a JSON file. */
export function dinnerStoreFromEnv(env: NodeJS.ProcessEnv): DinnerStore {
  const url = fromEnv(env, 'SUPABASE_URL')
  const key = fromEnv(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const venueId = env.PEREGRINE_VENUE_ID
  if (url && key && venueId) return supabaseDinnerStore(url, key, venueId)
  return fileStore(env.PEACOCK_DINNERS_FILE ?? path.join(process.cwd(), '.data', 'dinners.json'))
}
