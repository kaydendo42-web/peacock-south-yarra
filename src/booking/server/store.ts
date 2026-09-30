import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Booking } from '@/booking/data/types'

/**
 * Where bookings actually live.
 *
 * One small interface, so swapping the store for Postgres or anything else is
 * a single implementation and nothing above it changes. Everything the API
 * enforces is above this line; the store only reads, writes and serialises.
 */
export interface Store {
  all(): Promise<Booking[]>
  /** Insert or overwrite one booking, by id. Never touches any other booking. */
  put(booking: Booking): Promise<void>
  /**
   * Run a read-check-write as one step. Two guests booking the same table in
   * the same second would otherwise both read a free table, both pass
   * `checkBooking`, and both be confirmed. Every write goes through here.
   */
  exclusive<T>(job: () => Promise<T>): Promise<T>
}

/** A promise chain: jobs queue behind each other instead of interleaving. */
function queue() {
  let tail: Promise<unknown> = Promise.resolve()
  return <T,>(job: () => Promise<T>): Promise<T> => {
    const next = tail.then(job, job)
    tail = next.catch(() => undefined)
    return next
  }
}

/**
 * Development store: one JSON file.
 *
 * Not for production on serverless — the filesystem there is ephemeral and each
 * instance gets its own, so writes would silently disappear. Set the KV
 * variables before this is in front of anyone.
 */
export function fileStore(file: string): Store {
  // Two chains: `exclusive` holds its lock across the reads and writes it
  // makes, so those can't wait on the same chain or they would wait forever.
  const io = queue()
  const lock = queue()

  const read = async (): Promise<Booking[]> => {
    try {
      return JSON.parse(await fs.readFile(file, 'utf8')) as Booking[]
    } catch {
      return []
    }
  }

  return {
    all: () => io(read),

    put: (booking) =>
      io(async () => {
        const all = await read()
        const i = all.findIndex((b) => b.id === booking.id)
        if (i === -1) all.push(booking)
        else all[i] = booking
        await fs.mkdir(path.dirname(file), { recursive: true })
        // Write beside, then rename: a crash mid-write can't truncate the diary.
        const tmp = `${file}.${process.pid}.tmp`
        await fs.writeFile(tmp, JSON.stringify(all, null, 2), 'utf8')
        await fs.rename(tmp, file)
      }),

    exclusive: (job) => lock(job),
  }
}

/** Deletes the lock only if we still hold it, so a slow writer can't free someone else's. */
const RELEASE =
  "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end"

const LOCK_TTL_MS = 10_000
const LOCK_WAIT_MS = 5_000

/**
 * Upstash Redis (Vercel Marketplace) over its REST API.
 *
 * One hash, one field per booking, keyed by reference — a write replaces that
 * booking and nothing else. Writers take a short lock (SET NX with an expiry,
 * so a crashed instance can't hold it forever) around their read-check-write.
 */
export function kvStore(url: string, token: string, prefix = 'peacock'): Store {
  const diary = `${prefix}:diary`
  const lockKey = `${prefix}:diary:lock`

  const call = async <T,>(command: unknown[]): Promise<T> => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      cache: 'no-store',
    })
    const out = (await res.json().catch(() => ({}))) as { result?: T; error?: string }
    if (!res.ok || out.error) {
      throw new Error(`store unavailable (${res.status}${out.error ? `: ${out.error}` : ''})`)
    }
    return out.result as T
  }

  return {
    async all() {
      const values = await call<string[]>(['HVALS', diary])
      return values.map((v) => JSON.parse(v) as Booking)
    },

    async put(booking) {
      await call(['HSET', diary, booking.id, JSON.stringify(booking)])
    },

    async exclusive(job) {
      const holder = crypto.randomUUID()
      const deadline = Date.now() + LOCK_WAIT_MS
      while ((await call<string | null>(['SET', lockKey, holder, 'NX', 'PX', LOCK_TTL_MS])) !== 'OK') {
        if (Date.now() > deadline) throw new Error('store busy: could not take the diary lock')
        await new Promise((r) => setTimeout(r, 50 + Math.random() * 100))
      }
      try {
        return await job()
      } finally {
        await call(['EVAL', RELEASE, 1, lockKey, holder]).catch(() => undefined)
      }
    },
  }
}

/**
 * A write the database itself refused because the table is already held for
 * that time. The API turns it into the same 409 a failed rule check gives.
 */
export class StoreConflict extends Error {
  constructor() {
    super('That table has just been booked for this time.')
    this.name = 'StoreConflict'
  }
}

type BookingRow = {
  id: string
  venue_id: string
  table_id: string
  starts_at: string
  ends_at: string
  duration_min: number
  party_size: number
  guest_name: string
  phone: string
  email: string
  notes: string | null
  status: Booking['status']
  source: string
}

/**
 * Supabase Postgres, shared with Peregrine, over PostgREST.
 *
 * The Peacock site writes as the service role (server-only, never in a
 * browser); Jenny reads and edits the same rows from the Peregrine console as a
 * signed-in member of the venue, through row-level security. One diary, two
 * doors.
 *
 * No lock is needed here. The `bookings_no_double_booking` exclusion
 * constraint in the Peregrine migration refuses a second live booking whose
 * window overlaps one already on that table, inside Postgres, whichever door
 * the write came through. `exclusive` is a plain call-through, and a refused
 * write surfaces as `StoreConflict`.
 */
export function supabaseStore(url: string, serviceKey: string, venueId: string, bufferMinutes: number): Store {
  const rest = `${url.replace(/\/$/, '')}/rest/v1/bookings`
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    'Content-Type': 'application/json',
  }

  const toRow = (b: Booking): BookingRow => ({
    id: b.id,
    venue_id: venueId,
    table_id: b.tableId,
    starts_at: b.startsAt,
    // The window the table is out of circulation, turnaround included — the
    // same span `bookingSpan()` checks, so the database and the rules agree.
    ends_at: new Date(new Date(b.startsAt).getTime() + (b.durationMin + bufferMinutes) * 60_000).toISOString(),
    duration_min: b.durationMin,
    party_size: b.partySize,
    guest_name: b.guestName,
    phone: b.phone,
    email: b.email,
    notes: b.notes ?? null,
    status: b.status,
    source: 'website',
  })

  const fromRow = (r: BookingRow): Booking => ({
    id: r.id,
    tableId: r.table_id,
    startsAt: new Date(r.starts_at).toISOString(),
    durationMin: r.duration_min,
    partySize: r.party_size,
    guestName: r.guest_name,
    phone: r.phone,
    email: r.email,
    ...(r.notes ? { notes: r.notes } : {}),
    status: r.status,
  })

  return {
    async all() {
      const res = await fetch(`${rest}?venue_id=eq.${encodeURIComponent(venueId)}&select=*&order=starts_at`, {
        headers,
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`store unavailable (${res.status})`)
      return ((await res.json()) as BookingRow[]).map(fromRow)
    },

    async put(booking) {
      const row = toRow(booking)
      // Update first: an edit keeps the venue and whatever source the booking
      // came in by (a phone booking Jenny took stays a phone booking).
      const { source: _source, venue_id: _venue, id: _id, ...changes } = row
      const patch = await fetch(
        `${rest}?id=eq.${encodeURIComponent(booking.id)}&venue_id=eq.${encodeURIComponent(venueId)}`,
        {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=representation' },
          body: JSON.stringify(changes),
          cache: 'no-store',
        },
      )
      await refuse(patch)
      if (((await patch.json()) as unknown[]).length > 0) return

      const insert = await fetch(rest, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(row),
        cache: 'no-store',
      })
      await refuse(insert)
    },

    exclusive: (job) => job(),
  }
}

/** Throw for a failed PostgREST call; a double booking gets its own error. */
async function refuse(res: Response): Promise<void> {
  if (res.ok) return
  const err = (await res.json().catch(() => ({}))) as { code?: string }
  // 23P01: exclusion_violation — the double-booking constraint.
  if (err.code === '23P01') throw new StoreConflict()
  throw new Error(`store unavailable (${res.status}${err.code ? `: ${err.code}` : ''})`)
}

/**
 * The Vercel Supabase integration prefixes its variables with whatever the
 * store was named when it was connected (BookingStorage_SUPABASE_URL, …).
 * Take the plain name if it is set, else any prefixed one, so connecting the
 * store is all it takes.
 */
export function fromEnv(env: NodeJS.ProcessEnv, name: string): string | undefined {
  if (env[name]) return env[name]
  const key = Object.keys(env).find(
    (k) => k.endsWith(`_${name}`) && !k.startsWith('NEXT_PUBLIC_') && env[k],
  )
  return key ? env[key] : undefined
}

/**
 * Which store this instance uses: Supabase when it is configured (the shared
 * diary Peregrine reads), then Upstash, then a JSON file for development.
 */
export function storeFromEnv(env: NodeJS.ProcessEnv, bufferMinutes = 15): Store {
  const supabaseUrl = fromEnv(env, 'SUPABASE_URL')
  const serviceKey = fromEnv(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const venueId = env.PEREGRINE_VENUE_ID
  if (supabaseUrl && serviceKey && venueId) return supabaseStore(supabaseUrl, serviceKey, venueId, bufferMinutes)

  const url = env.KV_REST_API_URL
  const token = env.KV_REST_API_TOKEN
  if (url && token) return kvStore(url, token)
  return fileStore(env.PEACOCK_STORE_FILE ?? path.join(process.cwd(), '.data', 'bookings.json'))
}
