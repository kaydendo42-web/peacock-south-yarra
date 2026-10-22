import type { Booking, NewBooking } from '../data/types.ts'
import { checkBooking, sanitise } from '../data/rules.ts'
import { allocate, optionsFor } from '../data/allocate.ts'
import { VENUE_TZ, areas } from '../data/venue.ts'
import { sittingFor } from '../data/time.ts'

/** 11:30 am in Melbourne, whatever the server's clock thinks. */
const melbourneTime = new Intl.DateTimeFormat('en-AU', { timeZone: VENUE_TZ, hour: 'numeric', minute: '2-digit' })
import { venueDateKey } from '../data/time.ts'
import type { Config } from './config.ts'
import { notify } from './email.ts'
import { StoreConflict } from './store.ts'
import { canChange, changeableUntil, checkToken, manageSecret } from './manage.ts'

/**
 * The API, written against plain request/response shapes rather than against
 * Next's own — the route handler adapts a request into one of these and back,
 * and every rule below is testable without a server.
 *
 * Every rule that matters is applied here rather than in the browser: what a
 * guest may read, and whether a booking may stand. The client is free to check
 * the same things for a better experience, but nothing depends on it doing so.
 *
 * Guests only: the venue runs its diary from the Peregrine console, which reads
 * the database under its own sign-in. Nothing here hands out contact details.
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
  'id' | 'tableId' | 'tableIds' | 'startsAt' | 'durationMin' | 'partySize' | 'status'
>

function redact(b: Booking): PublicBooking {
  return {
    id: b.id,
    tableId: b.tableId,
    ...(b.tableIds ? { tableIds: b.tableIds } : {}),
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

export async function handle(req: ApiRequest, config: Config): Promise<ApiResponse> {
  const { store } = config

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
      return json(200, onDay.map(redact))
    }

    if (req.method === 'POST') {
      // Guests choose an area; the venue chooses the table. Whatever table a
      // client sends is ignored, and the sitting length is ours to set.
      const { tableId: _t, tableIds: _ts, ...fields } = sanitise((req.body ?? {}) as NewBooking)
      const area = areas.find((a) => a.id === fields.area)
      if (!area) return json(400, { error: 'Choose where you would like to sit.' })
      if (!fields.guestName || !fields.phone || !fields.email) {
        return json(400, { error: 'A name, a phone number and an email are required.' })
      }
      const party = Number(fields.partySize)
      const start = new Date(fields.startsAt)
      if (!Number.isInteger(party) || party < 1 || Number.isNaN(start.getTime())) {
        return json(400, { error: 'A party size and a start time are required.' })
      }

      // Allocate and write under the lock, or two guests can both take one table.
      const out = await store.exclusive(async () => {
        const all = await store.all()
        if (!optionsFor(area.id, party).length) {
          return json(409, {
            error: `${area.name} can't seat ${party} online. Call us and we'll sort something out.`,
            code: 'area-full',
          })
        }
        const seat = allocate(area.id, start, party, all)
        if (!seat) {
          return json(409, {
            error: `${area.name} is full at ${melbourneTime.format(start)}. Try another area or time.`,
            code: 'area-full',
          })
        }
        const input = {
          ...fields,
          area: area.id,
          partySize: party,
          durationMin: sittingFor(party),
          tableId: seat.tableIds[0],
          ...(seat.tableIds.length > 1 ? { tableIds: seat.tableIds } : {}),
        }
        const violation = checkBooking(input, all)
        if (violation) return json(409, { error: violation.message, code: violation.code })

        const booking: Booking = {
          ...input,
          id: newReference(new Set(all.map((b) => b.id))),
          // A guest cannot talk themselves into a seated or cancelled booking.
          status: 'confirmed',
        }
        try {
          await store.put(booking)
        } catch (e) {
          // The database's own double-booking guard: someone got there first.
          if (e instanceof StoreConflict) return json(409, { error: e.message, code: 'taken' })
          throw e
        }
        // The guest gets their own booking back in full; that is their own data.
        return json(201, booking)
      })

      // Outside the lock: a slow mail provider must not hold up other guests.
      if (out.status === 201) await notify(config.mailer, 'created', out.body as Booking, process.env)
      return out
    }

    return json(405, { error: 'Method not allowed.' })
  }

  // --- a guest's own booking, from the link in their email ----------------
  const own = req.path.match(/^\/bookings\/([A-Za-z0-9-]{3,64})(?:\/(change|cancel))?$/)
  if (own) return manage(req, config, own[1], own[2] as 'change' | 'cancel' | undefined)

  return json(404, { error: 'No such endpoint.' })
}

const notFound = () => json(404, { error: 'That booking link is not valid. Call us and we can help.' })
const tooLate = () =>
  json(409, {
    error: 'This booking can no longer be changed online. Call us and we will sort it out.',
    code: 'too-late',
  })

/**
 * Read, change or cancel one booking, for whoever holds its signed link. A bad
 * signature and a missing booking read the same, so the link can't be used to
 * test which references exist.
 */
async function manage(
  req: ApiRequest,
  config: Config,
  id: string,
  action: 'change' | 'cancel' | undefined,
): Promise<ApiResponse> {
  const { store } = config
  const secret = manageSecret(process.env)
  const body = (req.body ?? {}) as Record<string, unknown>
  const token = req.method === 'GET' ? req.query.t : body.t
  if (!checkToken(id, token, secret)) return notFound()

  if (!action && req.method === 'GET') {
    const booking = (await store.all()).find((b) => b.id === id)
    if (!booking) return notFound()
    return json(200, {
      booking,
      changeableUntil: changeableUntil(booking).toISOString(),
      canChange: canChange(booking),
    })
  }
  if (!action || req.method !== 'POST') return json(405, { error: 'Method not allowed.' })

  let previous: Booking | undefined
  const out = await store.exclusive(async () => {
    const all = await store.all()
    const booking = all.find((b) => b.id === id)
    if (!booking) return notFound()
    if (!canChange(booking)) return tooLate()
    previous = booking

    if (action === 'cancel') {
      const cancelled: Booking = { ...booking, status: 'cancelled' }
      await store.put(cancelled)
      return json(200, cancelled)
    }

    const area = areas.find((a) => a.id === body.area)
    if (!area) return json(400, { error: 'Choose where you would like to sit.' })
    const party = Number(body.partySize)
    const start = new Date(String(body.startsAt))
    if (!Number.isInteger(party) || party < 1 || Number.isNaN(start.getTime())) {
      return json(400, { error: 'A party size and a start time are required.' })
    }

    // Everyone else's bookings: the guest's own table is free for them to keep.
    const others = all.filter((b) => b.id !== id)
    if (!optionsFor(area.id, party).length) {
      return json(409, {
        error: `${area.name} can't seat ${party} online. Call us and we'll sort something out.`,
        code: 'area-full',
      })
    }
    const seat = allocate(area.id, start, party, others)
    if (!seat) {
      return json(409, {
        error: `${area.name} is full at ${melbourneTime.format(start)}. Try another area or time.`,
        code: 'area-full',
      })
    }
    const input = {
      area: area.id,
      startsAt: start.toISOString(),
      partySize: party,
      durationMin: sittingFor(party),
      tableId: seat.tableIds[0],
      // Always the full list, so moving off a joined set releases its other tables.
      tableIds: seat.tableIds,
    }
    const violation = checkBooking(input, others)
    if (violation) return json(409, { error: violation.message, code: violation.code })

    const changed: Booking = { ...booking, ...input }
    try {
      await store.put(changed)
    } catch (e) {
      if (e instanceof StoreConflict) return json(409, { error: e.message, code: 'taken' })
      throw e
    }
    return json(200, changed)
  })

  if (out.status === 200) {
    await notify(config.mailer, action === 'cancel' ? 'guest-cancelled' : 'changed', out.body as Booking, process.env, previous)
  }
  return out
}
