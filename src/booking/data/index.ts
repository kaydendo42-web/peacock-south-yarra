import { apiAdapter, refreshUser } from './apiAdapter.ts'
import type { DataAdapter } from './types.ts'

/**
 * The single door to data. Components import from here and never reach for an
 * adapter directly, so swapping the backend is a one-line change.
 *
 * The standalone build shipped a localStorage adapter beside this one for its
 * demo. It is gone: on the live site the rules are enforced in
 * `src/booking/server`, guest contact details never sit in a browser, and the
 * owner password exists only as a hash in the environment. A second adapter
 * would just be a second answer to the same question.
 */
export const data: DataAdapter = apiAdapter

/**
 * Restore the session on boot. Only the server can answer this, because the
 * cookie carrying it is deliberately unreadable from script.
 */
export async function restoreSession(): Promise<void> {
  await refreshUser()
}

export const {
  listTables,
  listBookings,
  createBooking,
  updateBooking,
  cancelBooking,
  signIn,
  signOut,
  currentUser,
} = bind(data)

function bind(a: DataAdapter) {
  return {
    listTables: a.listTables.bind(a),
    listBookings: a.listBookings.bind(a),
    createBooking: a.createBooking.bind(a),
    updateBooking: a.updateBooking.bind(a),
    cancelBooking: a.cancelBooking.bind(a),
    signIn: a.signIn.bind(a),
    signOut: a.signOut.bind(a),
    currentUser: a.currentUser.bind(a),
  }
}

export * from './types.ts'
export * from './availability.ts'
export * from './rules.ts'
export * from './time.ts'
export {
  MIDDAY,
  ZONE_DEPTH,
  room,
  zones,
  tables,
  fixtures,
  service,
  openingOn,
  sizeOf,
  footprint,
  auditVenue,
} from './venue.ts'
export type { Zone, Fixture } from './venue.ts'
