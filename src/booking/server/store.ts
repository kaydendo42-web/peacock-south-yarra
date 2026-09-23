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

export function storeFromEnv(env: NodeJS.ProcessEnv): Store {
  const url = env.KV_REST_API_URL
  const token = env.KV_REST_API_TOKEN
  if (url && token) return kvStore(url, token)
  return fileStore(env.PEACOCK_STORE_FILE ?? path.join(process.cwd(), '.data', 'bookings.json'))
}
