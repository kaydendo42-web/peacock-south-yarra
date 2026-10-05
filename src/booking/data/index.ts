import { apiAdapter } from './apiAdapter.ts'
import type { DataAdapter } from './types.ts'

/**
 * The single door to data. Components import from here and never reach for an
 * adapter directly, so swapping the backend is a one-line change.
 *
 * The standalone build shipped a localStorage adapter beside this one for its
 * demo. It is gone: on the live site the rules are enforced in
 * `src/booking/server` and guest contact details never sit in a browser. A second adapter
 * would just be a second answer to the same question.
 */
export const data: DataAdapter = apiAdapter

export const {
  listTables,
  listBookings,
  createBooking,
} = bind(data)

function bind(a: DataAdapter) {
  return {
    listTables: a.listTables.bind(a),
    listBookings: a.listBookings.bind(a),
    createBooking: a.createBooking.bind(a),
  }
}

export * from './types.ts'
export * from './availability.ts'
export * from './rules.ts'
export * from './time.ts'
export {
  MIDDAY,
  HOUSE_FLOOR,
  RISER,
  ZONE_ELEVATIONS,
  PLATFORM_RISE,
  steps,
  greenWalls,
  PLAN_SCALE,
  room,
  zones,
  floors,
  stairs,
  tables,
  fixtures,
  walls,
  plants,
  hedges,
  paintings,
  service,
  openingOn,
  sizeOf,
  footprint,
  floorAt,
  inside,
  planX,
  planY,
  auditVenue,
} from './venue.ts'
export type { Zone, Fixture, Wall, Plant, Hedge, Painting, Step, GreenWall } from './venue.ts'
