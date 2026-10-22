import { createHmac, timingSafeEqual } from 'node:crypto'
import { site } from '../../lib/site.ts'
import { manageSecret } from '../../booking/server/manage.ts'
import { cancelCutoffFor } from '../menu.ts'
import type { DinnerOrder } from './store.ts'

/**
 * Guests cancelling their own dinner order, for a full refund, up to 24 hours
 * before pickup. The same idea as a guest changing a table booking: the
 * receipt carries a link signed by this server, and the link is the key to
 * that one order. Same signing key, a different prefix, so a booking link
 * can't open an order or the other way round.
 */

export function dinnerToken(id: string, secret: string): string {
  return createHmac('sha256', secret).update(`dinner:${id}`).digest('base64url').slice(0, 32)
}

export function checkDinnerToken(id: string, token: unknown, env: NodeJS.ProcessEnv): boolean {
  const secret = manageSecret(env)
  if (!secret || typeof token !== 'string') return false
  const want = Buffer.from(dinnerToken(id, secret))
  const got = Buffer.from(token)
  return got.length === want.length && timingSafeEqual(got, want)
}

/** `?order=…&t=…` for the thanks page, or just the order when no key is configured. */
export function orderQuery(id: string, env: NodeJS.ProcessEnv): string {
  const secret = manageSecret(env)
  return `order=${encodeURIComponent(id)}${secret ? `&t=${dinnerToken(id, secret)}` : ''}`
}

/** The guest's link to their order, for the receipt. */
export function orderUrl(id: string, env: NodeJS.ProcessEnv): string {
  const origin = (env.SITE_URL || site.url).replace(/\/$/, '')
  return `${origin}/dinners/thanks?${orderQuery(id, env)}`
}

export function canCancel(o: Pick<DinnerOrder, 'status' | 'pickupDate'>, now = new Date()): boolean {
  return o.status === 'paid' && now < cancelCutoffFor(o.pickupDate)
}
