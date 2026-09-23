import type { Booking, NewBooking } from '@/booking/data/types'
import { checkBooking, sanitise } from '@/booking/data/rules'
import { venueDateKey } from '@/booking/data/time'
import {
  COOKIE,
  clearAttempts,
  clearedCookie,
  issueSession,
  readCookie,
  readSession,
  recordAttempt,
  sessionCookie,
  tooManyAttempts,
  verifyPassword,
} from './auth'
import type { Config } from './config'
import { notify } from './email'

/**
 * The API, written against plain request/response shapes rather than against
 * Next's own — the route handler adapts a request into one of these and back,
 * and every rule below is testable without a server.
 *
 * Every rule that matters is applied here rather than in the browser: who may
 * read contact details, whether a booking may stand, and how long a session
 * lasts. The client is free to check the same things for a better experience,
 * but nothing depends on it doing so.
 */

export type ApiRequest = {
  method: string
  path: string
  query: Record<string, string>
  headers: Record<string, string | undefined>
  body: unknown
  ip: string
}

export type ApiResponse = {
  status: number
  body?: unknown
  headers?: Record<string, string>
}

const json = (status: number, body?: unknown, headers?: Record<string, string>): ApiResponse => ({
  status,
  body,
  headers,
})

/** What a guest is allowed to see: enough to compute availability, and no more. */
type PublicBooking = Pick<
  Booking,
  'id' | 'tableId' | 'startsAt' | 'durationMin' | 'partySize' | 'status'
>

function redact(b: Booking): PublicBooking {
  return {
    id: b.id,
    tableId: b.tableId,
    startsAt: b.startsAt,
    durationMin: b.durationMin,
    partySize: b.partySize,
    status: b.status,
  }
}

const REF_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function newReference(existing: Set<string>): string {
  for (let attempt = 0; attempt < 20; attempt++) {
    const bytes = crypto.getRandomValues(new Uint8Array(6))
    let out = ''
    for (const b of bytes) out += REF_ALPHABET[b % REF_ALPHABET.length]
    const ref = `PK-${out}`
    if (!existing.has(ref)) return ref
  }
  throw new Error('could not allocate a reference')
}

export function isOwner(req: ApiRequest, config: Config): boolean {
  const token = readCookie(req.headers.cookie, COOKIE)
  return readSession(token, config.sessionSecret) !== null
}

export async function handle(req: ApiRequest, config: Config): Promise<ApiResponse> {
  const { store } = config

  // --- session ---------------------------------------------------------
  if (req.path === '/session') {
    if (req.method === 'GET') {
      return isOwner(req, config) ? json(200, { role: 'owner' }) : json(401, { error: 'Not signed in.' })
    }

    if (req.method === 'DELETE') {
      return json(204, undefined, { 'Set-Cookie': clearedCookie(config.secureCookies) })
    }

    if (req.method === 'POST') {
      if (tooManyAttempts(req.ip)) {
        return json(429, { error: 'Too many attempts. Try again later.' })
      }

      const { username, password } = (req.body ?? {}) as Record<string, unknown>
      const okUser = typeof username === 'string' && username.trim() === config.username
      const okPass = typeof password === 'string' && verifyPassword(password, config.passwordHash)

      if (!okUser || !okPass) {
        recordAttempt(req.ip)
        // One message for both, so this can't be used to enumerate usernames.
        return json(401, { error: 'Those details did not match.' })
      }

      clearAttempts(req.ip)
      return json(200, { role: 'owner' }, {
        'Set-Cookie': sessionCookie(issueSession(config.sessionSecret), config.secureCookies),
      })
    }

    return json(405, { error: 'Method not allowed.' })
  }

  // --- bookings --------------------------------------------------------
  if (req.path === '/bookings') {
    if (req.method === 'GET') {
      const date = req.query.date
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return json(400, { error: 'A date in YYYY-MM-DD form is required.' })
      }
      const all = await store.all()
      const onDay = all
        .filter((b) => venueDateKey(new Date(b.startsAt)) === date)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

      // Contact details are for the venue, not for whoever loads the page.
      return json(200, isOwner(req, config) ? onDay : onDay.map(redact))
    }

    if (req.method === 'POST') {
      const input = sanitise((req.body ?? {}) as NewBooking)
      if (!input.guestName || !input.phone || !input.email) {
        return json(400, { error: 'A name, a phone number and an email are required.' })
      }

      // Check and write under the lock, or two guests can both take one table.
      const out = await store.exclusive(async () => {
        const all = await store.all()
        const violation = checkBooking(input, all)
        if (violation) return json(409, { error: violation.message, code: violation.code })

        const booking: Booking = {
          ...input,
          id: newReference(new Set(all.map((b) => b.id))),
          // A guest cannot talk themselves into a seated or cancelled booking.
          status: 'confirmed',
        }
        await store.put(booking)
        // The guest gets their own booking back in full; that is their own data.
        return json(201, booking)
      })

      // Outside the lock: a slow mail provider must not hold up other guests.
      if (out.status === 201) await notify(config.mailer, 'created', out.body as Booking, process.env)
      return out
    }

    return json(405, { error: 'Method not allowed.' })
  }

  const match = req.path.match(/^\/bookings\/([A-Za-z0-9-]+)$/)
  if (match) {
    if (!isOwner(req, config)) return json(401, { error: 'Not signed in.' })
    if (req.method !== 'PATCH') return json(405, { error: 'Method not allowed.' })

    const id = match[1]
    const patch = sanitise((req.body ?? {}) as Partial<Booking>)

    let wasCancelled = false
    const out = await store.exclusive(async () => {
      const all = await store.all()
      const current = all.find((b) => b.id === id)
      if (!current) return json(404, { error: 'No such booking.' })

      const next: Booking = { ...current, ...patch, id: current.id }
      wasCancelled = current.status === 'cancelled'

      if (next.status === 'confirmed' || next.status === 'seated') {
        const violation = checkBooking(next, all, id)
        if (violation) return json(409, { error: violation.message, code: violation.code })
      }

      await store.put(next)
      return json(200, next)
    })

    // Tell the guest when the venue cancels; not on seated or no-show.
    const saved = out.body as Booking
    if (out.status === 200 && saved.status === 'cancelled' && !wasCancelled) {
      await notify(config.mailer, 'cancelled', saved, process.env)
    }
    return out
  }

  return json(404, { error: 'No such endpoint.' })
}
