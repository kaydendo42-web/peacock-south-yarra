import { createHmac, timingSafeEqual } from 'node:crypto'
import { at } from '../../booking/data/time.ts'
import { dinners, pickupLabel } from '../menu.ts'
import type { DinnerOrder } from './store.ts'

/**
 * Taking payment through Square's hosted checkout.
 *
 * Each dinner order becomes a Square order with a PICKUP fulfilment for the
 * collection morning, so it shows in Jenny's Square POS and Orders dashboard
 * like any online order, and a payment link the guest is sent to. Square
 * hosts the card form; no card details touch this site.
 *
 * Needs ORDERS_READ, ORDERS_WRITE and PAYMENTS_WRITE on the access token.
 * Refunds use PAYMENTS_WRITE too.
 */

export type Checkout = { linkId: string; url: string; squareOrderId: string }

export interface Payments {
  createCheckout(order: DinnerOrder, redirectUrl: string): Promise<Checkout>
  /** Whether Square has the order fully paid. */
  isPaid(squareOrderId: string, totalCents: number): Promise<boolean>
  /** Close a checkout so a lapsed hold can't be paid. Missing links are fine. */
  closeCheckout(linkId: string): Promise<void>
  /**
   * Refund an order's payment in full. Keyed on our order number, so asking
   * twice (a double click, a retry) refunds once. Returns Square's refund id.
   */
  refund(squareOrderId: string, totalCents: number, orderId: string): Promise<string>
}

const SQUARE_VERSION = '2026-09-16'

/** Square only takes E.164 phone numbers; an Australian mobile or landline becomes +61. */
export function e164(phone: string): string | undefined {
  const digits = phone.replace(/[^\d+]/g, '')
  if (/^\+\d{8,15}$/.test(digits)) return digits
  if (/^0\d{9}$/.test(digits)) return `+61${digits.slice(1)}`
  return undefined
}

export function squarePayments(env: NodeJS.ProcessEnv): Payments | null {
  const token = env.SQUARE_ACCESS_TOKEN
  const locationId = env.SQUARE_LOCATION_ID?.trim()
  if (!token || !locationId) return null
  const host =
    env.SQUARE_ENVIRONMENT === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com'

  const call = async <T,>(method: string, path: string, body?: unknown): Promise<T> => {
    const res = await fetch(`${host}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Square-Version': SQUARE_VERSION,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    })
    const out = (await res.json().catch(() => ({}))) as T & { errors?: { code: string; detail?: string }[] }
    if (!res.ok) {
      const first = out.errors?.[0]
      const error = new Error(`Square ${method} ${path} returned ${res.status}${first ? `: ${first.code} ${first.detail ?? ''}` : ''}`)
      ;(error as Error & { status?: number }).status = res.status
      throw error
    }
    return out
  }

  return {
    async createCheckout(order, redirectUrl) {
      const phone = e164(order.phone)
      const out = await call<{ payment_link: { id: string; url: string; order_id: string } }>(
        'POST',
        '/v2/online-checkout/payment-links',
        {
          // One link per order, however many times the request is retried.
          idempotency_key: `dinner-${order.id}`,
          order: {
            location_id: locationId,
            reference_id: order.id,
            source: { name: 'Website $5 dinners' },
            line_items: order.lines.map((l) => ({
              name: l.dishId.includes('+') ? l.dishName : `${l.dishName} (dinner)`,
              quantity: String(l.quantity),
              base_price_money: { amount: l.priceCents, currency: 'AUD' },
              note: `Pickup ${pickupLabel(order.pickupDate)}`,
            })),
            fulfillments: [
              {
                type: 'PICKUP',
                state: 'PROPOSED',
                pickup_details: {
                  recipient: {
                    display_name: order.guestName,
                    email_address: order.email,
                    ...(phone ? { phone_number: phone } : {}),
                  },
                  schedule_type: 'SCHEDULED',
                  pickup_at: at(order.pickupDate, dinners.pickup.from).toISOString(),
                  note: `$5 dinners ${order.id}. Collect ${dinners.pickup.label}. Phone ${order.phone}`,
                },
              },
            ],
          },
          checkout_options: {
            redirect_url: redirectUrl,
            allow_tipping: false,
            ask_for_shipping_address: false,
          },
          payment_note: `$5 dinners ${order.id}`,
        },
      )
      return { linkId: out.payment_link.id, url: out.payment_link.url, squareOrderId: out.payment_link.order_id }
    },

    async isPaid(squareOrderId, totalCents) {
      const { order } = await call<{
        order: {
          state: string
          tenders?: unknown[]
          total_money?: { amount: number }
          net_amount_due_money?: { amount: number }
        }
      }>('GET', `/v2/orders/${encodeURIComponent(squareOrderId)}`)
      if (order.state === 'CANCELED') return false
      const paid = (order.tenders?.length ?? 0) > 0 && (order.net_amount_due_money?.amount ?? 1) === 0
      return paid && (order.total_money?.amount ?? 0) >= totalCents
    },

    async closeCheckout(linkId) {
      try {
        await call('DELETE', `/v2/online-checkout/payment-links/${encodeURIComponent(linkId)}`)
      } catch (e) {
        if ((e as { status?: number }).status !== 404) throw e
      }
    },

    async refund(squareOrderId, totalCents, orderId) {
      const { order } = await call<{ order: { tenders?: { id: string; payment_id?: string }[] } }>(
        'GET',
        `/v2/orders/${encodeURIComponent(squareOrderId)}`,
      )
      const tender = order.tenders?.[0]
      if (!tender) throw new Error(`Square order ${squareOrderId} has no payment to refund`)
      const out = await call<{ refund: { id: string } }>('POST', '/v2/refunds', {
        idempotency_key: `dinner-refund-${orderId}`,
        payment_id: tender.payment_id ?? tender.id,
        amount_money: { amount: totalCents, currency: 'AUD' },
        reason: `$5 dinners ${orderId} cancelled online`,
      })
      return out.refund.id
    },
  }
}

/**
 * A stand-in for local development without a Square token: checkout goes
 * straight to the thank-you page and every order counts as paid. Never used
 * in production, where a missing token turns online ordering off instead.
 */
export function devPayments(): Payments {
  return {
    async createCheckout(order, redirectUrl) {
      return { linkId: `dev-${order.id}`, url: redirectUrl, squareOrderId: `dev-${order.id}` }
    },
    isPaid: async () => true,
    closeCheckout: async () => undefined,
    refund: async (_sq, _cents, orderId) => `dev-refund-${orderId}`,
  }
}

/**
 * Square signs each webhook with HMAC-SHA256 over the notification URL
 * followed by the raw body, using the subscription's signature key.
 */
export function verifyWebhook(rawBody: string, signature: string | undefined, url: string, key: string): boolean {
  if (!signature) return false
  const expected = createHmac('sha256', key).update(url + rawBody).digest()
  const given = Buffer.from(signature, 'base64')
  return given.length === expected.length && timingSafeEqual(given, expected)
}
