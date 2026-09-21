import { cookies } from 'next/headers'
import { COOKIE, readSession } from './auth'
import { config } from './config'

/**
 * Is the browser making this request signed in as the owner?
 *
 * For server components, so an owner page decides whether to render before it
 * renders. The client-side guard the standalone build used could only redirect
 * after painting, which meant the console flashed up for anyone who asked for
 * it — and it trusted a value script could write.
 */
export async function ownerSignedIn(): Promise<boolean> {
  const jar = await cookies()
  return readSession(jar.get(COOKIE)?.value, config().sessionSecret) !== null
}
