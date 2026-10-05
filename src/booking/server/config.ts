import { resendMailer, type Mailer } from './email'
import { storeFromEnv, type Store } from './store'
import { service } from '@/booking/data/venue'

/**
 * Server configuration, resolved once per instance.
 *
 * Lives apart from `api.ts` so the rules there stay testable with any store
 * and mailer a test hands them.
 */

export type Config = {
  store: Store
  /** Null until RESEND_API_KEY and a from-address are set; bookings still work. */
  mailer: Mailer | null
}

let cached: Config | null = null

export function config(): Config {
  if (cached) return cached

  const env = process.env
  cached = {
    store: storeFromEnv(env, service.bufferMinutes),
    mailer: resendMailer(env),
  }

  return cached
}
