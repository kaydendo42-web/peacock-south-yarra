import { hours } from '../../lib/site.ts'
import type { AreaId, DateKey, Table } from './types.ts'

/**
 * The Peacock, South Yarra — traced from Jenny's floor plan (sent 25 Sep 2026).
 *
 * Everything below is written in the drawing's own pixels and converted, so a
 * table can be checked against the drawing by eye: find its number on the plan,
 * read the pixel, compare. The drawing is 2000 × 933 px; the three "1770"
 * dimensions under the Main banquette span 160 px each, which puts the scale at
 * 11 mm a pixel.
 *
 * Orientation: venue x runs left to right across the drawing (Court Yard → Main
 * → Peacock → Deck). Venue y runs from the drawing's bottom edge up, so the
 * bottom of the drawing is the edge nearest the camera — the view is the plan
 * lying on a table, seen from its bottom edge. That keeps Jenny's left and
 * right where she drew them.
 */

/**
 * The venue's own timezone. A booking belongs to the day it falls on *here*,
 * not wherever a server happens to be running — on Vercel that is UTC, which
 * would file a 9am Melbourne sitting under the previous day.
 */
export const VENUE_TZ = 'Australia/Melbourne'

/** Metres per drawing pixel. */
export const PLAN_SCALE = 0.011
/** The drawing's left edge and the lines that bound the site top and bottom. */
const PLAN_X0 = 10
const PLAN_TOP = 50
const PLAN_BOTTOM = 890

/** Drawing pixel → venue metres. */
export const planX = (px: number) => +((px - PLAN_X0) * PLAN_SCALE).toFixed(3)
export const planY = (py: number) => +((PLAN_BOTTOM - py) * PLAN_SCALE).toFixed(3)
const pt = (px: number, py: number): [number, number] => [planX(px), planY(py)]
const len = (px: number) => +(px * PLAN_SCALE).toFixed(3)

export const room = {
  width: planX(1975),
  depth: +((PLAN_BOTTOM - PLAN_TOP) * PLAN_SCALE).toFixed(3),
  wallHeight: 3.0,
  wallThickness: 0.2,
} as const

/**
 * One riser, in scene metres. A real step is 150–180 mm; at the default zoom a
 * table is a few pixels tall, so the step is drawn about 2.6x real to read as a
 * step and not as a seam. Every level below is a whole number of these.
 */
export const RISER = 0.45

/**
 * Finished floor of each section. The journey the room should make legible
 * without reading a label: up the street stairs onto the Deck, one step up into
 * the house (Peacock, then Main on the same floor), one step down out to the
 * Court Yard, which sits back at the Deck's level.
 */
export const ZONE_ELEVATIONS = {
  deck: RISER,
  peacock: RISER * 2,
  main: RISER * 2,
  courtyard: RISER,
} as const

/** The timber seating platform in the Court Yard stands half a riser proud of it. */
export const PLATFORM_RISE = RISER / 2

/** The house floor, which Peacock and Main share. */
export const HOUSE_FLOOR = ZONE_ELEVATIONS.main

export type Zone = {
  id: string
  name: string
  /** Outline in venue metres, anticlockwise or clockwise — only membership is asked of it. */
  outline: [number, number][]
  /** Open to the sky: parapet, not walls. */
  open: boolean
  /** Floor height, metres. */
  floor: number
  /** Where Jenny wrote the section's name on the plan; the scene labels it there. */
  labelAt: [number, number]
}

/** The four sections Jenny named on the plan. */
export const zones: Zone[] = [
  {
    id: 'courtyard',
    name: 'Court Yard',
    outline: [pt(10, 50), pt(600, 50), pt(600, 405), pt(890, 860), pt(10, 860)],
    open: true,
    floor: ZONE_ELEVATIONS.courtyard,
    labelAt: pt(385, 525),
  },
  {
    id: 'main',
    name: 'Main',
    outline: [pt(600, 405), pt(1050, 405), pt(1050, 450), pt(1440, 450), pt(1440, 860), pt(890, 860)],
    open: false,
    floor: ZONE_ELEVATIONS.main,
    labelAt: pt(1128, 690),
  },
  {
    id: 'peacock',
    name: 'Peacock',
    outline: [pt(1310, 155), pt(1660, 155), pt(1660, 450), pt(1310, 450)],
    open: false,
    floor: ZONE_ELEVATIONS.peacock,
    labelAt: pt(1485, 380),
  },
  {
    id: 'deck',
    name: 'Deck',
    outline: [pt(1660, 60), pt(1970, 60), pt(1970, 700), pt(1890, 860), pt(1660, 860)],
    open: true,
    floor: ZONE_ELEVATIONS.deck,
    labelAt: pt(1850, 420),
  },
]

/**
 * Floor plates, each its own solid so its riser faces show. The first match
 * wins, so the Court Yard's timber platform comes before the Court Yard.
 * Anything on none of them is at grade — the site slab outside the fence.
 */
export const floors: { id: string; outline: [number, number][]; height: number; tone: 'stone' | 'timber' }[] = [
  {
    // The raised timber seating platform under the long tables.
    id: 'yard-platform',
    outline: [pt(368, 712), pt(702, 712), pt(702, 852), pt(368, 852)],
    height: ZONE_ELEVATIONS.courtyard + PLATFORM_RISE,
    tone: 'timber',
  },
  {
    id: 'house',
    outline: [pt(600, 155), pt(1660, 155), pt(1660, 860), pt(890, 860), pt(600, 405)],
    height: HOUSE_FLOOR,
    tone: 'stone',
  },
  {
    // The Deck, with the notch the street stairs come up through.
    id: 'deck',
    outline: [
      pt(1660, 60), pt(1970, 60), pt(1970, 445), pt(1780, 445), pt(1780, 525),
      pt(1970, 525), pt(1970, 700), pt(1890, 860), pt(1660, 860),
    ],
    height: ZONE_ELEVATIONS.deck,
    tone: 'stone',
  },
  {
    id: 'courtyard',
    outline: [pt(10, 50), pt(600, 50), pt(600, 405), pt(890, 860), pt(10, 860)],
    height: ZONE_ELEVATIONS.courtyard,
    tone: 'stone',
  },
]

/** The street stairs, down from the Deck to River St. */
export const stairs = {
  x0: planX(1780),
  x1: planX(1970),
  y0: planY(525),
  y1: planY(445),
  treads: 4,
} as const

/**
 * The single steps between levels, drawn where people actually cross: up from
 * the Deck through the side door into the house, and down through the first
 * and last of the glazed arches into the Court Yard. (The middle arch has L1
 * against it, so it is a window.) Each is a tread half a riser below the
 * higher floor, set against the wall on the lower side.
 */
export type Step = {
  id: string
  /** Centre, venue metres. */
  x: number
  y: number
  /** Along the wall, and out from it. */
  w: number
  d: number
  /** Top of the tread. */
  top: number
  /** Direction of the wall it sits against, venue metres (unnormalised). */
  along: [number, number]
}

function stepAt(id: string, from: [number, number], to: [number, number], f: number, out: number, w: number, top: number): Step {
  const [ax, ay] = pt(...from)
  const [bx, by] = pt(...to)
  const dx = bx - ax
  const dy = by - ay
  const l = Math.hypot(dx, dy)
  // Perpendicular, pointing to the side `out` says (+1 left of the run, −1 right).
  const nx = (-dy / l) * out
  const ny = (dx / l) * out
  const d = 0.36
  return {
    id,
    x: +(ax + dx * f + nx * (d / 2 + 0.12)).toFixed(3),
    y: +(ay + dy * f + ny * (d / 2 + 0.12)).toFixed(3),
    w,
    d,
    top,
    along: [dx, dy],
  }
}

export const steps: Step[] = [
  // Deck → house, at the side door. The door is 332 px down the house's deck wall.
  stepAt('deck-door', [1660, 155], [1660, 860], 332 / 705, 1, 0.9, ZONE_ELEVATIONS.deck + RISER / 2),
  // Main → Court Yard, outside the first and last glazed arches.
  stepAt('yard-arch-1', [600, 405], [890, 860], 150 / 539.6, -1, 1.05, ZONE_ELEVATIONS.courtyard + RISER / 2),
  stepAt('yard-arch-3', [600, 405], [890, 860], 390 / 539.6, -1, 1.05, ZONE_ELEVATIONS.courtyard + RISER / 2),
]

/**
 * Seats, minimums and priorities are Jenny's own, from her Resos setup
 * (docs/resos-tables.md); names are Resos's too, so her console reads the way
 * she is used to. The ids are the original plan labels and never change, so
 * bookings already made keep pointing at the right table.
 */
type TableSpec = {
  id: string
  label: string
  /** Most the table seats (Resos's max). */
  seats: number
  /** Fewest it is offered for (Resos's min). */
  min: number
  /** Resos booking priority, 1–10: the higher, the sooner it is offered. */
  priority: number
  shape: Table['shape']
  at: [number, number] // drawing px, centre
  /** Metres. `w` is along the table's long side; `rot: 90` stands it up the drawing. */
  w: number
  d?: number
  rot?: 0 | 90
  zone: string
}

const spec: TableSpec[] = [
  // --- Court Yard ------------------------------------------------------
  { id: 't4', label: '4', seats: 6, min: 1, priority: 7, shape: 'rect', at: [137, 127], w: 1.38, d: 0.5, rot: 90, zone: 'courtyard' },
  { id: 'tt1', label: 'Tree 2', seats: 3, min: 1, priority: 7, shape: 'rect', at: [335, 183], w: 0.6, d: 0.55, zone: 'courtyard' },
  { id: 't13', label: '13', seats: 4, min: 1, priority: 9, shape: 'diamond', at: [385, 297], w: 0.62, zone: 'courtyard' },
  { id: 't3', label: '3', seats: 3, min: 1, priority: 7, shape: 'rect', at: [57, 355], w: 0.6, d: 0.55, zone: 'courtyard' },
  { id: 't16', label: '16', seats: 2, min: 1, priority: 4, shape: 'rect', at: [554, 348], w: 0.62, d: 0.55, rot: 90, zone: 'courtyard' },
  { id: 't14', label: '14', seats: 2, min: 1, priority: 9, shape: 'rect', at: [416, 429], w: 0.62, d: 0.6, zone: 'courtyard' },
  { id: 't2', label: '2', seats: 3, min: 1, priority: 7, shape: 'rect', at: [232, 450], w: 0.6, d: 0.55, zone: 'courtyard' },
  { id: 't1', label: 'Peacock', seats: 2, min: 1, priority: 6, shape: 'round', at: [140, 618], w: 0.45, zone: 'courtyard' },
  { id: 'td4', label: 'Deck 5', seats: 2, min: 1, priority: 2, shape: 'diamond', at: [597, 611], w: 0.55, zone: 'courtyard' },
  { id: 'tl1', label: 'Lawn', seats: 2, min: 1, priority: 5, shape: 'diamond', at: [716, 620], w: 0.55, zone: 'courtyard' },
  // Six chairs drawn, and Resos seats it 1–6.
  { id: 'td1', label: 'Deck 1', seats: 6, min: 1, priority: 4, shape: 'rect', at: [463, 762], w: 1.82, d: 0.8, zone: 'courtyard' },
  { id: 'td3', label: 'Deck 3', seats: 4, min: 1, priority: 7, shape: 'rect', at: [662, 780], w: 1.3, d: 0.5, rot: 90, zone: 'courtyard' },

  // --- Main ------------------------------------------------------------
  { id: 't26', label: '26', seats: 3, min: 1, priority: 9, shape: 'diamond', at: [765, 510], w: 0.55, zone: 'main' },
  { id: 't25', label: '25', seats: 3, min: 1, priority: 10, shape: 'diamond', at: [825, 588], w: 0.55, zone: 'main' },
  { id: 't28', label: '28', seats: 4, min: 1, priority: 2, shape: 'rect', at: [1097, 566], w: 0.55, d: 0.5, zone: 'main' },
  { id: 't29', label: '29', seats: 2, min: 1, priority: 2, shape: 'rect', at: [1177, 610], w: 0.55, d: 0.5, zone: 'main' },
  { id: 't30', label: '30', seats: 2, min: 1, priority: 2, shape: 'rect', at: [1272, 610], w: 0.55, d: 0.5, zone: 'main' },
  { id: 't24', label: '24', seats: 2, min: 1, priority: 7, shape: 'rect', at: [955, 788], w: 0.5, d: 0.5, zone: 'main' },
  { id: 't23', label: '23', seats: 2, min: 1, priority: 7, shape: 'rect', at: [1032, 788], w: 0.5, d: 0.5, zone: 'main' },
  { id: 't22', label: '22', seats: 2, min: 1, priority: 7, shape: 'rect', at: [1110, 788], w: 0.5, d: 0.5, zone: 'main' },
  { id: 't21', label: '21', seats: 2, min: 1, priority: 7, shape: 'rect', at: [1187, 788], w: 0.5, d: 0.5, zone: 'main' },
  { id: 't20', label: '20', seats: 4, min: 1, priority: 7, shape: 'rect', at: [1307, 787], w: 1.0, d: 0.5, zone: 'main' },

  // --- Peacock ---------------------------------------------------------
  { id: 't6', label: '6', seats: 3, min: 1, priority: 8, shape: 'rect', at: [1392, 245], w: 1.5, d: 0.5, rot: 90, zone: 'peacock' },
  { id: 't5', label: '5', seats: 6, min: 1, priority: 8, shape: 'round', at: [1587, 250], w: 1.0, zone: 'peacock' },

  // --- Deck --------------------------------------------------------------
  { id: 't53', label: '53', seats: 4, min: 1, priority: 5, shape: 'rect', at: [1912, 150], w: 1.05, d: 0.5, zone: 'deck' },
  { id: 't32', label: '32', seats: 2, min: 1, priority: 5, shape: 'rect', at: [1748, 235], w: 0.9, d: 0.42, rot: 90, zone: 'deck' },
  { id: 't52', label: '52', seats: 2, min: 1, priority: 5, shape: 'rect', at: [1935, 300], w: 0.5, d: 0.5, zone: 'deck' },
  { id: 't31', label: '31', seats: 2, min: 1, priority: 5, shape: 'rect', at: [1748, 335], w: 0.9, d: 0.42, rot: 90, zone: 'deck' },
  { id: 't42', label: '42', seats: 4, min: 1, priority: 5, shape: 'rect', at: [1815, 335], w: 0.5, d: 0.5, zone: 'deck' },
  { id: 't41', label: '41', seats: 2, min: 1, priority: 5, shape: 'rect', at: [1830, 610], w: 1.05, d: 0.5, zone: 'deck' },
  { id: 't51', label: '51', seats: 5, min: 1, priority: 5, shape: 'diamond', at: [1875, 765], w: 0.5, zone: 'deck' },
]

/** Every bookable table, numbered as Jenny's team numbers them. */
export const tables: Table[] = spec.map((t) => ({
  id: t.id,
  label: t.label,
  seats: t.seats,
  min: t.min,
  priority: t.priority,
  shape: t.shape,
  x: planX(t.at[0]),
  y: planY(t.at[1]),
  rot: t.rot ?? 0,
  zone: t.zone,
  w: t.w,
  d: t.shape === 'rect' ? (t.d ?? t.w) : t.w,
}))

/**
 * What a guest chooses instead of a table: one of three areas, in Jenny's
 * words and her order. Inside is the Main room and the Peacock room together;
 * which of the two a party gets is the allocation's call, as it was in Resos.
 */
export type Area = { id: AreaId; name: string; blurb: string; zones: string[] }

export const areas: Area[] = [
  {
    id: 'deck',
    name: 'Front Deck',
    blurb: 'Outdoors and undercover, with lush greenery. Lovely rain or shine; not heated.',
    zones: ['deck'],
  },
  {
    id: 'inside',
    name: 'Inside',
    blurb: 'Indoor plants, wooden accents and warm natural light, across the Main and Peacock rooms.',
    zones: ['main', 'peacock'],
  },
  {
    id: 'courtyard',
    name: 'Courtyard',
    blurb: 'Plant-filled and open-air, with a covered, heated space in the cooler months.',
    zones: ['courtyard'],
  },
]

export const areaOfZone = (zone: string): AreaId | undefined => areas.find((a) => a.zones.includes(zone))?.id

/**
 * Tables Jenny pushes together for bigger groups, from her Resos setup. A
 * combination is offered when its party range fits and every table in it is
 * free for the whole sitting.
 */
export type Combination = { tables: string[]; min: number; max: number; priority: number }

const combo = (labels: string[], min: number, max: number): Combination => ({
  tables: labels.map((l) => {
    const t = tables.find((x) => x.label === l)
    if (!t) throw new Error(`combination names a table that is not on the plan: ${l}`)
    return t.id
  }),
  min,
  max,
  priority: 5,
})

export const combinations: Combination[] = [
  // Front Deck
  combo(['41', '51'], 2, 7),
  combo(['42', '52'], 2, 6),
  combo(['42', '52', '53'], 3, 10),
  // Courtyard
  combo(['13', '14'], 2, 6),
  combo(['2', '3'], 1, 5),
  combo(['3', '4'], 2, 7),
  combo(['2', '3', '4'], 3, 12),
  // Inside (Resos lists 23 + 24 twice, as 2–5 and 2–4; the wider one stands)
  combo(['20', '21'], 2, 6),
  combo(['20', '21', '22'], 3, 8),
  combo(['20', '21', '22', '23'], 4, 10),
  combo(['20', '21', '22', '23', '24'], 5, 14),
  combo(['23', '24'], 2, 5),
  combo(['23', '24', '25'], 3, 7),
  combo(['25', '26'], 2, 8),
]

/** Footprint of a table as it stands, in metres: `rot` applied, diamonds at 45°. */
export function sizeOf(t: Pick<Table, 'w' | 'd' | 'rot' | 'shape'>): { w: number; d: number } {
  if (t.shape === 'diamond') {
    const across = t.w * Math.SQRT2
    return { w: across, d: across }
  }
  const turned = Math.round(Math.abs(t.rot) / 90) % 2 === 1
  return turned ? { w: t.d, d: t.w } : { w: t.w, d: t.d }
}

/**
 * Non-bookable things with a footprint: the back of house, counters, benches.
 * Rectangles in venue metres, centred.
 */
export type Fixture = {
  id: string
  kind: 'room' | 'bathroom' | 'counter' | 'bench' | 'planter'
  label: string
  x: number
  y: number
  w: number
  d: number
  h: number
}

const box = (
  id: string,
  kind: Fixture['kind'],
  label: string,
  [x0, y0, x1, y1]: [number, number, number, number],
  h: number,
): Fixture => ({
  id,
  kind,
  label,
  x: +((planX(x0) + planX(x1)) / 2).toFixed(3),
  y: +((planY(y0) + planY(y1)) / 2).toFixed(3),
  w: len(x1 - x0),
  d: len(y1 - y0),
  h,
})

export const fixtures: Fixture[] = [
  box('kitchen', 'room', 'Kitchen', [600, 155, 900, 405], 2.8),
  box('storage', 'room', 'Storage', [900, 155, 1310, 300], 2.8),
  box('toilets', 'bathroom', 'Toilets', [1050, 300, 1310, 450], 2.4),
  box('waiters', 'counter', 'Waiters station', [905, 372, 1045, 430], 1.0),
  box('foh-display', 'counter', 'FOH', [1440, 585, 1500, 775], 1.05),
  box('foh-pass', 'counter', 'FOH', [1440, 530, 1610, 585], 1.05),
  box('foh-back', 'counter', 'FOH', [1610, 585, 1655, 855], 1.05),
  box('foh-till', 'counter', 'FOH', [1500, 810, 1610, 855], 1.05),
  box('main-planter', 'planter', 'Planter', [1130, 520, 1340, 572], 0.5),
  box('main-banquette', 'bench', 'Banquette', [910, 816, 1390, 852], 0.45),
  box('peacock-banquette', 'bench', 'Banquette', [1520, 172, 1645, 198], 0.45),
  box('peacock-bench', 'bench', 'Bench', [1335, 180, 1360, 315], 0.45),
  box('yard-store', 'room', 'Store', [258, 685, 322, 790], 1.6),
]

/**
 * Walls and parapets, as runs between two drawing points. `openings` are along
 * the run in metres from its first point.
 */
export type Wall = {
  id: string
  /** glass: a low sill and window posts, open at its doorways (`arches`). */
  kind: 'wall' | 'parapet' | 'glass'
  from: [number, number]
  to: [number, number]
  /** A point on the side the wall faces away from — decides which side is "out". */
  inside: [number, number]
  arches?: { at: number; width: number; height: number }[]
  slits?: number[]
}

const houseInside = pt(1200, 600)
const yardInside = pt(300, 450)
const deckInside = pt(1820, 400)

export const walls: Wall[] = [
  // --- the house -------------------------------------------------------
  {
    id: 'house-back', kind: 'wall', from: pt(600, 155), to: pt(1660, 155), inside: houseInside,
    slits: [len(820), len(950), len(1080)],
  },
  {
    id: 'house-deck', kind: 'wall', from: pt(1660, 155), to: pt(1660, 860), inside: houseInside,
    arches: [{ at: len(332), width: 0.72, height: 2.3 }],
    slits: [len(120), len(560)],
  },
  {
    id: 'house-front', kind: 'wall', from: pt(890, 860), to: pt(1660, 860), inside: houseInside,
    slits: [len(90), len(250), len(410)],
  },
  {
    // The glazed run between the Court Yard and Main, drawn on the diagonal.
    // Glass, so it is drawn as its sill and frame: the room behind it and the
    // steps down to the yard stay in view. Its two doorways carry the steps.
    id: 'house-glass', kind: 'glass', from: pt(600, 405), to: pt(890, 860), inside: houseInside,
    arches: [
      { at: len(150), width: 1.1, height: 2.4 },
      { at: len(390), width: 1.1, height: 2.4 },
    ],
  },
  { id: 'house-kitchen', kind: 'wall', from: pt(600, 155), to: pt(600, 405), inside: houseInside },

  // --- the Court Yard's fence line ------------------------------------
  { id: 'yard-west', kind: 'parapet', from: pt(10, 50), to: pt(10, 860), inside: yardInside },
  { id: 'yard-north', kind: 'parapet', from: pt(10, 50), to: pt(600, 50), inside: yardInside },
  { id: 'yard-kitchen', kind: 'parapet', from: pt(600, 50), to: pt(600, 155), inside: yardInside },
  { id: 'yard-south', kind: 'parapet', from: pt(10, 860), to: pt(890, 860), inside: yardInside },

  // --- the Deck's rail -------------------------------------------------
  { id: 'deck-north', kind: 'parapet', from: pt(1660, 60), to: pt(1970, 60), inside: deckInside },
  { id: 'deck-east-a', kind: 'parapet', from: pt(1970, 60), to: pt(1970, 445), inside: deckInside },
  { id: 'deck-east-b', kind: 'parapet', from: pt(1970, 525), to: pt(1970, 700), inside: deckInside },
  { id: 'deck-corner', kind: 'parapet', from: pt(1970, 700), to: pt(1890, 860), inside: deckInside },
  { id: 'deck-south', kind: 'parapet', from: pt(1660, 860), to: pt(1890, 860), inside: deckInside },
]

/**
 * The small things that make it hers: the plants she drew, the hedges along the
 * fence, the art on the walls. Decor only — nothing here takes a booking or
 * blocks one.
 */
export type Plant = {
  x: number
  y: number
  size: number
  /**
   * tree: trunk and two cones. fern: a cut-gem bush in a pot. pot: a small one.
   * tuft: three blades of grass, no pot. hanging: a basket on a line from the
   * beam, trailing below it.
   */
  kind: 'tree' | 'pot' | 'fern' | 'tuft' | 'hanging'
}
export type Hedge = { x: number; y: number; w: number; d: number }
export type Painting = {
  /** Centre of the canvas on the wall face, venue metres. */
  x: number
  y: number
  w: number
  h: number
  /** Which way the canvas faces, in venue axes. */
  facing: 'north' | 'south'
  palette: 'peacock' | 'pink' | 'mint'
  /** The wall this hangs on, so it hides with it. Omit for a free-standing block. */
  wall?: string
  floor: number
}

const plant = (px: number, py: number, size: number, kind: Plant['kind']): Plant => ({
  x: planX(px),
  y: planY(py),
  size,
  kind,
})

export const plants: Plant[] = [
  // --- Court Yard: the lushest part of the site --------------------------
  // The trees and pots Jenny drew.
  plant(362, 100, 0.55, 'tree'),
  plant(452, 110, 0.5, 'tree'),
  plant(520, 108, 0.45, 'tree'),
  plant(298, 338, 0.42, 'fern'),
  plant(535, 532, 0.75, 'tree'),
  plant(302, 622, 0.42, 'fern'),
  plant(790, 836, 0.42, 'fern'),
  // A second big tree on the concrete by the store.
  plant(120, 770, 0.8, 'tree'),
  // Grouped pots: by the lounge chairs, and by the store.
  plant(252, 548, 0.2, 'pot'),
  plant(270, 566, 0.26, 'fern'),
  plant(236, 572, 0.18, 'pot'),
  plant(228, 652, 0.22, 'pot'),
  plant(206, 664, 0.18, 'pot'),
  // Grass along the back fence, between the tables.
  ...[40, 78, 196, 236, 276, 560, 584].map((px) => plant(px, 68, 0.3, 'tuft')),
  ...[400, 470, 540, 610].map((py) => plant(46, py, 0.26, 'tuft')),

  // --- Main: small pots at the edges, the middle left clear -----------------
  plant(1046, 470, 0.2, 'pot'),
  plant(1424, 470, 0.22, 'fern'),
  plant(1418, 842, 0.2, 'pot'),

  // --- Peacock: the big one in the corner, three little pots by the door ----
  plant(1608, 405, 0.5, 'fern'),
  plant(1330, 385, 0.18, 'pot'),
  plant(1330, 410, 0.18, 'pot'),
  plant(1330, 435, 0.18, 'pot'),
  plant(1646, 170, 0.22, 'pot'),

  // FOH, at the end of the pass.
  plant(1446, 556, 0.26, 'pot'),

  // --- Deck -------------------------------------------------------------------
  // Planters along the rail.
  ...[210, 272, 335, 392, 582, 656, 730, 800].map((py) => plant(1778, py, 0.2, 'pot')),
  // Either side of the top of the street stairs.
  plant(1792, 432, 0.22, 'fern'),
  plant(1792, 540, 0.22, 'fern'),
  // Hanging baskets on veranda posts along the house's deck wall.
  ...[215, 395, 600, 770].map((py) => plant(1690, py, 0.2, 'hanging')),
]

/**
 * A planted wall: a tall green panel with foliage bulging from it, standing
 * just inside a boundary. `facing` is the side it looks into, venue axes, so
 * it can drop out of view when it would stand between the camera and the room.
 */
export type GreenWall = { x: number; y: number; w: number; d: number; h: number; facing: [number, number] }

const greenWall = (x0: number, y0: number, x1: number, y1: number, h: number, facing: [number, number]): GreenWall => ({
  x: +((planX(x0) + planX(x1)) / 2).toFixed(3),
  y: +((planY(y0) + planY(y1)) / 2).toFixed(3),
  w: len(x1 - x0),
  d: len(y1 - y0),
  h,
  facing,
})

/** Along the Court Yard's side fence and the back fence, the far sides from the default view. */
export const greenWalls: GreenWall[] = [
  greenWall(14, 60, 30, 655, 1.5, [1, 0]),
  greenWall(170, 54, 305, 66, 1.3, [0, -1]),
]

const hedge = (x0: number, y0: number, x1: number, y1: number): Hedge => ({
  x: +((planX(x0) + planX(x1)) / 2).toFixed(3),
  y: +((planY(y0) + planY(y1)) / 2).toFixed(3),
  w: len(x1 - x0),
  d: len(y1 - y0),
})

export const hedges: Hedge[] = [
  hedge(340, 862, 870, 882),
  hedge(328, 672, 346, 858),
  hedge(316, 60, 410, 150),
  hedge(592, 160, 600, 390),
]

export const paintings: Painting[] = [
  // Above the Peacock banquette: the one that gives the room its name.
  { x: planX(1582), y: planY(155) - 0.13, w: 1.0, h: 0.75, facing: 'south', palette: 'peacock', wall: 'house-back', floor: HOUSE_FLOOR },
  // On the toilet block, facing the Main tables.
  { x: planX(1120), y: planY(450) - 0.02, w: 0.55, h: 0.7, facing: 'south', palette: 'pink', floor: HOUSE_FLOOR },
  { x: planX(1235), y: planY(450) - 0.02, w: 0.55, h: 0.7, facing: 'south', palette: 'mint', floor: HOUSE_FLOOR },
  // Above the Main banquette's back, on the far side of the storage block.
  { x: planX(980), y: planY(300) - 0.02, w: 0.7, h: 0.5, facing: 'south', palette: 'mint', floor: HOUSE_FLOOR },
]

/** Is a point inside an outline? Even-odd rule. */
export function inside([x, y]: [number, number], outline: [number, number][]): boolean {
  let hit = false
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, yi] = outline[i]
    const [xj, yj] = outline[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit
  }
  return hit
}

/** Floor height under a point, in metres. */
export function floorAt(x: number, y: number): number {
  for (const f of floors) if (inside([x, y], f.outline)) return f.height
  return 0
}

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

/**
 * Minimum gap between two table footprints, and between a table and a fixture.
 * The plan is a real café, drawn tight: tables sit a chair's width apart, not
 * the 0.9 m a synthetic layout could afford, and pushed up against banquettes.
 * The audit checks what can be
 * wrong about a traced plan — overlaps and tables outside their section.
 */
export const MIN_CLEARANCE = 0.05

// ---------------------------------------------------------------------------
// Layout audit. Kept beside the data so the plan is checkable rather than
// asserted; called from the venue tests and safe to call at runtime.
// ---------------------------------------------------------------------------

type Rect = { x0: number; y0: number; x1: number; y1: number }

/** Axis-aligned footprint. Diamonds are measured across their points. */
export function footprint(t: Pick<Table, 'w' | 'd' | 'rot' | 'shape' | 'x' | 'y'>): Rect {
  const { w, d } = sizeOf(t)
  return { x0: t.x - w / 2, y0: t.y - d / 2, x1: t.x + w / 2, y1: t.y + d / 2 }
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
    if (r.x0 < 0 || r.y0 < 0 || r.x1 > room.width || r.y1 > room.depth) {
      problems.push(`${t.label} is off the site`)
    }
    const zone = zones.find((z) => z.id === t.zone)
    if (!zone) {
      problems.push(`${t.label} is in zone "${t.zone}", which does not exist`)
      continue
    }
    if (!inside([t.x, t.y], zone.outline)) {
      problems.push(`${t.label} is not inside ${zone.name}`)
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
