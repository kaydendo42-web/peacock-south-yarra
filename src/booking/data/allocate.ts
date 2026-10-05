import type { AreaId, Booking } from './types.ts'
import { bookingsFor, isSlotFree } from './availability.ts'
import { areas, combinations, tables } from './venue.ts'

/**
 * Guests choose an area; the venue chooses the table. This is the choice,
 * made the way a host makes it: the tightest fit first, so a pair doesn't take
 * a six-top, then Jenny's own priority from Resos, then one table before a
 * joined set.
 */

/** One way to seat a party: a single table, or tables pushed together. */
export type SeatingOption = { tableIds: string[]; capacity: number; priority: number }

/** Every way this area can seat this party, best first, ignoring the diary. */
export function optionsFor(area: AreaId, party: number): SeatingOption[] {
  const zones = areas.find((a) => a.id === area)?.zones ?? []
  const inArea = new Set(tables.filter((t) => zones.includes(t.zone)).map((t) => t.id))

  const singles = tables
    .filter((t) => inArea.has(t.id) && t.min <= party && party <= t.seats)
    .map((t) => ({ tableIds: [t.id], capacity: t.seats, priority: t.priority }))
  const joined = combinations
    .filter((c) => c.tables.every((id) => inArea.has(id)) && c.min <= party && party <= c.max)
    .map((c) => ({ tableIds: c.tables, capacity: c.max, priority: c.priority }))

  return [...singles, ...joined].sort(
    (a, b) =>
      a.capacity - party - (b.capacity - party) ||
      b.priority - a.priority ||
      a.tableIds.length - b.tableIds.length,
  )
}

/** The seating the venue would give this party in this area at this time, if any. */
export function allocate(area: AreaId, slot: Date, party: number, bookings: Booking[]): SeatingOption | null {
  return (
    optionsFor(area, party).find((o) =>
      o.tableIds.every((id) => isSlotFree(slot, party, bookingsFor(id, bookings))),
    ) ?? null
  )
}

export type AreaState = 'available' | 'full' | 'too-big'

/** How an area reads to a guest for one party at one time. */
export function areaStateAt(area: AreaId, slot: Date, party: number, bookings: Booking[]): AreaState {
  if (!optionsFor(area, party).length) return 'too-big'
  return allocate(area, slot, party, bookings) ? 'available' : 'full'
}
