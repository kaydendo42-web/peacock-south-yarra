import { randomBytes } from 'node:crypto'
import { storeFromEnv, type Store } from './store'

/**
 * Server configuration, resolved once per instance.
 *
 * Lives apart from `api.ts` so the route handler and the server components that
 * gate `/owners` read the same secret. Two copies would mean a cookie signed by
 * one and rejected by the other.
 */

export type Config = {
  store: Store
  passwordHash: string
  username: string
  sessionSecret: string
  secureCookies: boolean
}

/**
 * The owner credential the venue asked for: username `owner`, password
 * `password12345`. It ships as a scrypt hash rather than the password itself,
 * and `PEACOCK_OWNER_PASSWORD_HASH` overrides it — run `npm run hash-password`
 * and set that variable to change the password without touching this file.
 *
 * Worth being plain about: a password chosen for a handover demo is a password
 * anyone can guess. It gates the run sheet, which holds guests' names, phone
 * numbers and emails. Before the venue takes real bookings this wants replacing
 * with something only the owner knows.
 */
const DEMO_PASSWORD_HASH =
  'scrypt$16384$8$1$W1jzGxuyVl_XfX1XqIpx0Q$mHC38pG82mnhSl995sGuaXX16aHtGjJXxSNEqKPBhK4'

let cached: Config | null = null

export function config(): Config {
  if (cached) return cached

  const env = process.env
  const production = env.NODE_ENV === 'production' || env.VERCEL === '1'

  cached = {
    store: storeFromEnv(env),
    passwordHash: env.PEACOCK_OWNER_PASSWORD_HASH || DEMO_PASSWORD_HASH,
    username: env.PEACOCK_OWNER_USERNAME || 'owner',
    /**
     * A missing secret in production used to throw, which took the whole
     * booking API down with it — guests could not book because the owner could
     * not sign in. A random per-instance secret keeps everything working and
     * costs only session durability: the owner signs in again after a deploy or
     * when a request lands on a cold instance. Set PEACOCK_SESSION_SECRET to
     * make sessions survive both.
     */
    sessionSecret:
      env.PEACOCK_SESSION_SECRET ||
      (production ? randomBytes(32).toString('base64url') : 'dev-only-secret-not-for-production'),
    secureCookies: production,
  }

  return cached
}
