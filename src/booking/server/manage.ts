import { createHmac, timingSafeEqual } from 'node:crypto'
import { site } from '../../lib/site.ts'
import type { Booking } from '../data/types.ts'
import { fromEnv } from './store.ts'

/**
 * Guests changing or cancelling their own booking.
 *
 * The confirmation email carries a link with the booking's reference and a
 * signature over it. Only this server can make the signature, so the link is
 * the guest's key to that one booking and nothing else; there is no account
 * and no password. Changes close a little before the booking, after which the
 * guest calls the café as before.
 */

/** How long before a booking the guest can still change or cancel it online. */
export const CHANGE_CUTOFF_MINUTES = 120

/**
 * The signing key: its own secret if one is set, otherwise derived from the
 * service key the server already holds, so the feature works without new
 * configuration. Rotating either invalidates links already sent.
 */
export function manageSecret(env: NodeJS.ProcessEnv): string | undefined {
  if (env.BOOKING_MANAGE_SECRET) return env.BOOKING_MANAGE_SECRET
  const base = fromEnv(env, 'SUPABASE_SERVICE_ROLE_KEY') || env.PEACOCK_SESSION_SECRET
  return base ? createHmac('sha256', base).update('peacock:manage-booking').digest('base64url') : undefined
}

export function manageToken(id: string, secret: string): string {
  return createHmac('sha256', secret).update(`booking:${id}`).digest('base64url').slice(0, 32)
}

export function checkToken(id: string, token: unknown, secret: string | undefined): boolean {
  if (!secret || typeof token !== 'string') return false
  const want = Buffer.from(manageToken(id, secret))
  const got = Buffer.from(token)
  return got.length === want.length && timingSafeEqual(got, want)
}

/** The guest's link, or undefined when no key is configured (the email then says to call). */
export function manageUrl(id: string, env: NodeJS.ProcessEnv): string | undefined {
  const secret = manageSecret(env)
  if (!secret) return undefined
  const origin = (env.SITE_URL || site.url).replace(/\/$/, '')
  return `${origin}/book-a-table/manage?ref=${encodeURIComponent(id)}&t=${manageToken(id, secret)}`
}

/** The last moment this booking can be changed online. */
export function changeableUntil(b: Pick<Booking, 'startsAt'>): Date {
  return new Date(new Date(b.startsAt).getTime() - CHANGE_CUTOFF_MINUTES * 60_000)
}

export function canChange(b: Pick<Booking, 'startsAt' | 'status'>, now = new Date()): boolean {
  return b.status === 'confirmed' && now < changeableUntil(b)
}
