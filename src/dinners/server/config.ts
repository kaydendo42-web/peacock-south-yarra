import { resendMailer } from '@/booking/server/email'
import type { DinnersConfig } from './api'
import { devPayments, squarePayments } from './square'
import { dinnerStoreFromEnv } from './store'

let cached: DinnersConfig | null = null

/**
 * Resolved once per instance. Without a Square token, production turns
 * ordering off (the menu still shows); development pretends every checkout
 * is paid so the flow can be clicked through.
 */
export function dinnersConfig(): DinnersConfig {
  if (cached) return cached
  const env = process.env
  cached = {
    store: dinnerStoreFromEnv(env),
    payments: squarePayments(env) ?? (env.NODE_ENV === 'production' ? null : devPayments()),
    mailer: resendMailer(env),
    env,
  }
  return cached
}
