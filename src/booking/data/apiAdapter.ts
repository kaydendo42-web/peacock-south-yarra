import type { Booking, DataAdapter, DateKey, NewBooking } from './types.ts'
import { tables } from './venue.ts'
import { BookingRejected } from './rules.ts'

/**
 * Talks to the server API. Nothing above `src/booking/data` knows how. The
 * guest side only: the venue's own view of the diary is the Peregrine console.
 */

/** The route handler in `src/app/api/booking/[...route]/route.ts`. */
const base = '/api/booking'

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    ...init,
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
}
