import type { Booking, DataAdapter, DateKey, NewBooking, Session } from './types.ts'
import { tables } from './venue.ts'
import { BookingRejected } from './rules.ts'

/**
 * Talks to the server API. Nothing above `src/booking/data` knows how.
 *
 * The session lives in an HttpOnly cookie the browser attaches itself — this
 * module never sees a token, which is the point. `currentUser()` is therefore a
 * cached answer to a question only the server can settle. The owner pages do
 * not rely on it — they are gated on the server, where the cookie can actually
 * be verified — so `refreshUser()` is only for a caller that wants to ask.
 */

/** The route handler in `src/app/api/booking/[...route]/route.ts`. */
const base = '/api/booking'

let session: Session | null = null

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  })

  if (res.status === 204) return undefined as T

  const body = await res.json().catch(() => null)

  if (!res.ok) {
    const message = (body as { error?: string } | null)?.error ?? `Request failed (${res.status})`
    // 409 is the server refusing on a booking rule, which callers already handle.
    if (res.status === 409) {
      throw new BookingRejected({
        code: ((body as { code?: string } | null)?.code ?? 'bad-field') as never,
        message,
      })
    }
    throw new Error(message)
  }

  return body as T
}

/** Ask the server whether this browser is signed in. Cheap; call it on boot. */
export async function refreshUser(): Promise<Session | null> {
  try {
    await call<{ role: 'owner' }>('/session')
    session = { role: 'owner', since: new Date().toISOString() }
  } catch {
    session = null
  }
  return session
}

export const apiAdapter: DataAdapter = {
  async listTables() {
    // The floor plan is fixed geometry, not data — it ships with the app.
    return tables
  },

  listBookings(date: DateKey) {
    return call<Booking[]>(`/bookings?date=${encodeURIComponent(date)}`)
  },

  createBooking(input: NewBooking) {
    return call<Booking>('/bookings', { method: 'POST', body: JSON.stringify(input) })
  },

  updateBooking(id: string, patch: Partial<Booking>) {
    return call<Booking>(`/bookings/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
  },

  cancelBooking(id: string) {
    return this.updateBooking(id, { status: 'cancelled' })
  },

  async signIn(username: string, password: string) {
    try {
      await call<{ role: 'owner' }>('/session', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      session = { role: 'owner', since: new Date().toISOString() }
      return session
    } catch {
      session = null
      return null
    }
  },

  async signOut() {
    await call<void>('/session', { method: 'DELETE' }).catch(() => undefined)
    session = null
  },

  currentUser() {
    return session
  },
}
