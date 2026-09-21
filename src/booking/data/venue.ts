import { hours } from '../../lib/site.ts'
import type { DateKey, Table } from './types.ts'

/**
 * The Peacock, South Yarra — hand-authored floor plan.
 *
 * Origin is the inside face of the front door. x runs right along the front
 * wall, y runs into the room. All values are metres.
 *
 * Synthetic layout standing in for the surveyed one. Every table clears its
 * neighbours' edges by at least 0.9 m and sits at least 0.9 m off any wall;
 * `auditVenue()` at the bottom of this file is the check.
 */

/**
 * The venue's own timezone. A booking belongs to the day it falls on *here*,
 * not wherever a server happens to be running — on Vercel that is UTC, which
 * would file a 9am Melbourne sitting under the previous day.
 */
export const VENUE_TZ = 'Australia/Melbourne'

export const room = {
  width: 11.0, // x
  depth: 15.6, // y — divides into three equal 5.2 m zones
  wallHeight: 3.0,
  wallThickness: 0.22,
} as const

/**
 * The room is three equal slices across its depth: verandah at the street,
 * the enclosed room in the middle, courtyard at the back. 5.2 m each.
 *
 * `ZONE_DEPTH` is the divisor rather than a written-out number so the three
 * spans, the walls in `src/booking/scene/layout.ts` and the audit below can
 * never drift apart.
 */
export const ZONE_DEPTH = room.depth / 3

export type Zone = {
  id: string
  name: string
  /** [yStart, yEnd) in metres */
  span: [number, number]
  /** Open to the sky — no ceiling, low parapet instead of full walls. */
  open: boolean
}

export const zones: Zone[] = [
  { id: 'verandah', name: 'Front verandah', span: [0, ZONE_DEPTH], open: true },
  { id: 'inside', name: 'Inside', span: [ZONE_DEPTH, ZONE_DEPTH * 2], open: false },
  { id: 'courtyard', name: 'Courtyard', span: [ZONE_DEPTH * 2, room.depth], open: true },
]

/** Footprint of a table, in metres. Round tables use `w` as the diameter. */
export const tableSize = {
  2: { w: 0.72, d: 0.72 },
  4: { w: 1.2, d: 0.75 },
  6: { w: 1.8, d: 0.85 },
  8: { w: 2.4, d: 0.95 },
} as const

export function sizeOf(t: Pick<Table, 'seats'>) {
  return tableSize[t.seats as keyof typeof tableSize] ?? tableSize[4]
}

/**
 * Every table, laid out zone by zone.
 *
 * Two rows to a zone. A zone is 5.2 m deep and `auditVenue()` wants 0.9 m of
 * clearance off every wall including the partitions, which leaves 3.4 m —
 * enough for two rows of tables and the walkway between them, and not enough
 * for three. The rows are what the numbers below are: not an arbitrary
 * scatter, a pair of lines per zone with the fixtures cut out of them.
 */
export const tables: Table[] = [
  // --- Front verandah: the street row, then the sheltered row ----------
  { id: 'v1', label: 'V1', seats: 2, shape: 'round', x: 2.0, y: 1.6, rot: 0, zone: 'verandah' },
  { id: 'v2', label: 'V2', seats: 2, shape: 'round', x: 4.2, y: 1.6, rot: 0, zone: 'verandah' },
  { id: 'v3', label: 'V3', seats: 2, shape: 'round', x: 6.4, y: 1.6, rot: 0, zone: 'verandah' },
  { id: 'v4', label: 'V4', seats: 2, shape: 'round', x: 8.6, y: 1.6, rot: 0, zone: 'verandah' },
  { id: 'v5', label: 'V5', seats: 4, shape: 'rect', x: 2.4, y: 3.5, rot: 0, zone: 'verandah' },
  { id: 'v6', label: 'V6', seats: 4, shape: 'rect', x: 5.5, y: 3.5, rot: 0, zone: 'verandah' },
  { id: 'v7', label: 'V7', seats: 4, shape: 'rect', x: 8.6, y: 3.5, rot: 0, zone: 'verandah' },

  // --- Inside: the coffee corner takes the west end of the front row,
  //     the bathrooms take the middle of the south-east wall ------------
  { id: 'i1', label: 'I1', seats: 4, shape: 'rect', x: 5.1, y: 6.6, rot: 0, zone: 'inside' },
  { id: 'i2', label: 'I2', seats: 4, shape: 'rect', x: 8.1, y: 6.6, rot: 0, zone: 'inside' },
  { id: 'i3', label: 'I3', seats: 6, shape: 'rect', x: 3.0, y: 8.9, rot: 0, zone: 'inside' },
  { id: 'i4', label: 'I4', seats: 4, shape: 'rect', x: 5.6, y: 8.9, rot: 0, zone: 'inside' },
  { id: 'i5', label: 'I5', seats: 4, shape: 'rect', x: 8.0, y: 8.9, rot: 0, zone: 'inside' },

  // --- Courtyard: the long tables go at the back, in the sun -----------
  { id: 'c1', label: 'C1', seats: 4, shape: 'rect', x: 2.4, y: 11.9, rot: 0, zone: 'courtyard' },
  { id: 'c2', label: 'C2', seats: 4, shape: 'rect', x: 5.5, y: 11.9, rot: 0, zone: 'courtyard' },
  { id: 'c3', label: 'C3', seats: 4, shape: 'rect', x: 8.6, y: 11.9, rot: 0, zone: 'courtyard' },
  { id: 'c4', label: 'C4', seats: 8, shape: 'rect', x: 3.2, y: 14.0, rot: 0, zone: 'courtyard' },
  { id: 'c5', label: 'C5', seats: 6, shape: 'rect', x: 7.0, y: 14.0, rot: 0, zone: 'courtyard' },
  { id: 'c6', label: 'C6', seats: 2, shape: 'round', x: 9.6, y: 14.0, rot: 0, zone: 'courtyard' },
]

/**
 * Non-bookable fixtures, all of them inside the middle zone.
 *
 * The coffee station is an L tucked into the western corner — west as the
 * isometric view reads it, which is the corner where the x = 0 wall meets the
 * verandah partition. The bathrooms are a block against the middle of the
 * south-east wall, the x = `room.width` one.
 */
export type Fixture = {
  id: string
  kind: 'counter' | 'bathroom'
  label: string
  /** Centre of the footprint, in metres. */
  x: number
  y: number
  w: number
  d: number
  h: number
  /**
   * Counters only: the axis the brass rail runs along. It is fitted to the
   * face away from the wall the counter is against — a rail along y sits on
   * the +x face, a rail along x sits on the +y face.
   */
  rail?: 'x' | 'y'
}

export const fixtures: Fixture[] = [
  // The long leg, against the x = 0 wall: grinders, machine, pass.
  { id: 'coffee-machine', kind: 'counter', label: 'Coffee', x: 0.55, y: 6.85, w: 1.1, d: 3.0, h: 1.05, rail: 'y' },
  // The short leg, turning the corner along the verandah partition: the till.
  { id: 'coffee-till', kind: 'counter', label: 'Counter', x: 2.3, y: 5.9, w: 2.4, d: 1.1, h: 1.05, rail: 'x' },
  { id: 'bathrooms', kind: 'bathroom', label: 'Bathrooms', x: 10.35, y: 7.8, w: 1.3, d: 2.4, h: 2.1 },
]

/**
 * The venue opens once a day and stays open — there is no lunch/dinner split at
 * a café that shuts at three. Times come from `hours` in `src/lib/site.ts`,
 * which is the only place the venue's hours are allowed to live, so the booking
 * grid and the footer can never disagree about when the doors are open.
 *
 * Public holidays are not modelled: `hours.publicHolidays` carries a display
 * string and no open/close pair, so a holiday books as its weekday would. The
 * owner can cancel from the run sheet in the meantime.
 */
export function openingOn(key: DateKey): [string, string] {
  const [y, m, d] = key.split('-').map(Number)
  const weekday = new Date(y, m - 1, d).getDay()
  const day = weekday === 0 || weekday === 6 ? hours.weekend : hours.weekdays
  return [day.open, day.close]
}

/** Where the morning stops being breakfast and starts being lunch. Display only. */
export const MIDDAY = '11:00'

export const service = {
  slotMinutes: 30,
  // A café turn, not a restaurant's. large = party of 5+.
  sittingMinutes: { small: 75, large: 90 },
  bufferMinutes: 15,
} as const

export const MIN_CLEARANCE = 0.9

// ---------------------------------------------------------------------------
// Layout audit. Kept beside the data so the clearance rule is checkable rather
// than asserted; called from the venue tests and safe to call at runtime.
// ---------------------------------------------------------------------------

type Rect = { x0: number; y0: number; x1: number; y1: number }

/** Axis-aligned footprint. Rotation is 90°-snapped, so this stays exact. */
export function footprint(t: Pick<Table, 'seats' | 'rot' | 'x' | 'y'>): Rect {
  const { w, d } = sizeOf(t)
  const turned = Math.round(Math.abs(t.rot) / 90) % 2 === 1
  const hw = (turned ? d : w) / 2
  const hd = (turned ? w : d) / 2
  return { x0: t.x - hw, y0: t.y - hd, x1: t.x + hw, y1: t.y + hd }
}

function gap(a: Rect, b: Rect): number {
  const dx = Math.max(a.x0 - b.x1, b.x0 - a.x1, 0)
  const dy = Math.max(a.y0 - b.y1, b.y0 - a.y1, 0)
  if (dx === 0 && dy === 0) return -1 // overlapping
  return Math.hypot(dx, dy)
}

export function auditVenue(): string[] {
  const problems: string[] = []
  const rects = tables.map((t) => ({ t, r: footprint(t) }))

  for (const { t, r } of rects) {
    const wall = Math.min(r.x0, room.width - r.x1, r.y0, room.depth - r.y1)
    if (wall < MIN_CLEARANCE - 1e-9) {
      problems.push(`${t.label} is ${wall.toFixed(2)} m from a wall (min ${MIN_CLEARANCE})`)
    }

    /**
     * And from the partitions either side of its own zone. The two dividers
     * are walls with a door in them, not lines on a drawing, so a table has to
     * clear them the way it clears the outside of the building — which is what
     * makes each 5.2 m zone two rows deep and not three.
     */
    const zone = zones.find((z) => z.id === t.zone)
    if (!zone) {
      problems.push(`${t.label} is in zone "${t.zone}", which does not exist`)
      continue
    }
    const partition = Math.min(r.y0 - zone.span[0], zone.span[1] - r.y1)
    if (partition < MIN_CLEARANCE - 1e-9) {
      problems.push(
        `${t.label} is ${partition.toFixed(2)} m from the edge of ${zone.name} (min ${MIN_CLEARANCE})`,
      )
    }
  }

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const g = gap(rects[i].r, rects[j].r)
      if (g < MIN_CLEARANCE - 1e-9) {
        problems.push(
          `${rects[i].t.label}–${rects[j].t.label} clear by ${g.toFixed(2)} m (min ${MIN_CLEARANCE})`,
        )
      }
    }
  }

  for (const f of fixtures) {
    const fr: Rect = { x0: f.x - f.w / 2, y0: f.y - f.d / 2, x1: f.x + f.w / 2, y1: f.y + f.d / 2 }
    for (const { t, r } of rects) {
      const g = gap(fr, r)
      if (g < MIN_CLEARANCE - 1e-9) {
        problems.push(`${t.label}–${f.label} clear by ${g.toFixed(2)} m (min ${MIN_CLEARANCE})`)
      }
    }
  }

  return problems
}
