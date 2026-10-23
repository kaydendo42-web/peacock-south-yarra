import { VENUE_TZ } from '../booking/data/venue.ts'
import { at, shiftDays, todayKey, venueDateKey } from '../booking/data/time.ts'
import type { DateKey } from '../booking/data/types.ts'

/**
 * $5 dinners: Jenny's pop-up of cooked dinners, ordered and paid online and
 * collected from the café the next day.
 *
 * Everything Jenny is likely to change lives in `dinners` below: the two-week
 * menu, the first Monday it runs from, the cap and the cut-off. From her PDF
 * of 22 Oct 2026. Imported with relative `.ts` paths so the Node test runner
 * can load it, the same as `src/booking/data/`.
 */

export type Diet = 'v' | 'gf' | 'df'

/** An extra a guest can add to each portion, e.g. parmesan for $1. */
export type AddOn = { id: string; name: string; priceCents: number }

export const parmesan: AddOn = { id: 'parmesan', name: 'Parmesan', priceCents: 100 }

export type Dish = {
  /** Stable across the rotation: `w1-mon-5`. Orders and the cap key on it. */
  id: string
  name: string
  priceCents: number
  diet: Diet[]
  addOn?: AddOn
}

type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri'

const dish = (week: number, day: Weekday, price: 5 | 10, name: string, diet: Diet[] = [], addOn?: AddOn): Dish => ({
  id: `w${week}-${day}-${price}`,
  name,
  priceCents: price * 100,
  diet,
  ...(addOn ? { addOn } : {}),
})

/** An order line for an add-on: `w1-wed-5+parmesan`. Never capped; it rides on its dish. */
export const addOnLineId = (dish: Dish) => `${dish.id}+${dish.addOn?.id}`

export const dinners = {
  /**
   * The Monday of Week 1. Weeks run 1 to 4 from here, then repeat if the
   * pop-up is extended. November 2026 is the trial month.
   */
  firstMonday: '2026-11-02' as DateKey,
  /** Last pickup date, or null to keep repeating the rotation. */
  lastDay: '2026-11-27' as DateKey | null,
  /**
   * Portions of each dish per day, by price. Sold out at this many. Never shown
   * to guests: Jenny doesn't want the numbers public.
   */
  portions: { 500: 50, 1000: 100 } as Record<number, number>,
  /** Most of one dish on one day a single order can take. */
  maxPerDish: 10,
  /** Orders for a day close at this time the evening before, venue time. */
  cutoff: '21:00',
  /**
   * How far ahead a dinner can be ordered. Long enough to cover the whole
   * month, so guests can order every week of the menu at once.
   */
  advanceDays: 42,
  pickup: { from: '07:00', until: '14:30', label: '7am – 2:30pm' },
  /** Days the pop-up is off (public holidays, closures). Melbourne Cup day. */
  closed: ['2026-11-03'] as DateKey[],
  /** Guests can cancel online, for a refund, until this long before pickup opens. */
  cancelHours: 24,
  /** How long a checkout holds its portions before they go back on sale. */
  holdMinutes: 20,
  /**
   * Jenny's November menu (PDF of 22 Oct 2026): four weeks from the first
   * Monday, a $5 and a $10 dish each weekday. "+P" dishes offer parmesan.
   */
  weeks: [
    {
      mon: [dish(1, 'mon', 5, 'Mac & cheese', ['v']), dish(1, 'mon', 10, 'Beef stew & mash potato', ['gf'])],
      tue: [], // Melbourne Cup: no dinners
      wed: [
        dish(1, 'wed', 5, 'Pesto pasta', ['v'], parmesan),
        dish(1, 'wed', 10, 'Vege chilli con carne & baked potato', ['v', 'gf', 'df']),
      ],
      thu: [
        dish(1, 'thu', 5, 'Mushroom & bacon pasta', [], parmesan),
        dish(1, 'thu', 10, 'Teriyaki chicken stir fry', ['df']),
      ],
      fri: [dish(1, 'fri', 5, 'Pasta arrabbiata', ['v', 'df'], parmesan), dish(1, 'fri', 10, 'Cottage pie', ['gf'])],
    },
    {
      mon: [
        dish(2, 'mon', 5, 'Sweet chilli mushroom pasta', ['v'], parmesan),
        dish(2, 'mon', 10, 'Teriyaki tofu & fried rice', ['v', 'df', 'gf']),
      ],
      tue: [dish(2, 'tue', 5, 'Spag bol', ['df'], parmesan), dish(2, 'tue', 10, 'Butter chicken & rice', ['gf'])],
      wed: [
        dish(2, 'wed', 5, 'Mushroom risotto', ['v', 'gf'], parmesan),
        dish(2, 'wed', 10, 'Marry me chicken pasta', [], parmesan),
      ],
      thu: [
        dish(2, 'thu', 5, 'Vodka pasta', ['v'], parmesan),
        dish(2, 'thu', 10, 'Beef chilli con carne & baked potato', ['gf', 'df']),
      ],
      fri: [
        dish(2, 'fri', 5, 'Pasta Napoli', ['v', 'df'], parmesan),
        dish(2, 'fri', 10, 'Honey sesame chicken & rice', ['gf', 'df']),
      ],
    },
    {
      mon: [
        dish(3, 'mon', 5, 'Creamy mushroom pasta', ['v'], parmesan),
        dish(3, 'mon', 10, 'Beef stew & mash', ['gf']),
      ],
      tue: [
        dish(3, 'tue', 5, 'Caramelised onion & chilli pasta', ['v']),
        dish(3, 'tue', 10, 'Green chicken curry & rice', ['gf', 'df']),
      ],
      wed: [dish(3, 'wed', 5, 'Mac & cheese', ['v']), dish(3, 'wed', 10, 'Lemon rice pilaf & garlic chicken')],
      thu: [
        dish(3, 'thu', 5, 'Tuna mornay'),
        dish(3, 'thu', 10, 'Garlic sesame chicken stir fry & rice', ['gf', 'df']),
      ],
      fri: [dish(3, 'fri', 5, 'Spag bol', ['df'], parmesan), dish(3, 'fri', 10, 'Creamy Tuscan chicken pasta')],
    },
    {
      mon: [
        dish(4, 'mon', 5, 'Pumpkin risotto', ['v'], parmesan),
        dish(4, 'mon', 10, 'Creamy garlic chicken pasta'),
      ],
      tue: [dish(4, 'tue', 5, 'Pesto pasta', ['v'], parmesan), dish(4, 'tue', 10, 'Butter chicken & rice', ['gf'])],
      wed: [
        dish(4, 'wed', 5, 'Chickpea & sweet potato curry & rice', ['v', 'gf']),
        dish(4, 'wed', 10, 'Marry me chicken pasta', [], parmesan),
      ],
      thu: [
        dish(4, 'thu', 5, 'Pasta alfredo', ['v'], parmesan),
        dish(4, 'thu', 10, 'Beef chilli con carne & baked potato', ['gf', 'df']),
      ],
      fri: [dish(4, 'fri', 5, 'Vodka pasta', ['v'], parmesan), dish(4, 'fri', 10, 'Beef stroganoff')],
    },
  ] satisfies Record<Weekday, Dish[]>[],
}

export const dietLabels: Record<Diet, string> = { v: 'Vegetarian', gf: 'Gluten free', df: 'Dairy free' }

const WEEKDAYS: (Weekday | null)[] = [null, 'mon', 'tue', 'wed', 'thu', 'fri', null]

/** Whole days from a to b, both 'YYYY-MM-DD'. Calendar arithmetic, so daylight saving can't shift it. */
function daysBetween(a: DateKey, b: DateKey): number {
  const utc = (k: DateKey) => {
    const [y, m, d] = k.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(b) - utc(a)) / 86_400_000)
}

function weekdayOf(key: DateKey): Weekday | null {
  const [y, m, d] = key.split('-').map(Number)
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
}

/** The two dishes for a pickup date, or none if the pop-up isn't running that day. */
export function dishesOn(key: DateKey): Dish[] {
  const day = weekdayOf(key)
  if (!day) return []
  const since = daysBetween(dinners.firstMonday, key)
  if (since < 0) return []
  if (dinners.lastDay && key > dinners.lastDay) return []
  if (dinners.closed.includes(key)) return []
  const week = dinners.weeks[Math.floor(since / 7) % dinners.weeks.length]
  return week[day]
}

/** Portions of a dish on sale each day. */
export function portionsOf(dish: Pick<Dish, 'priceCents'>): number {
  return dinners.portions[dish.priceCents] ?? 0
}

/** Every dish id the rotation can serve, for checking what a client sends. */
export function findDish(key: DateKey, dishId: string): Dish | undefined {
  return dishesOn(key).find((d) => d.id === dishId)
}

/** The moment orders for a pickup date close: 9pm the evening before, Melbourne time. */
export function cutoffFor(key: DateKey): Date {
  return at(shiftDays(key, -1), dinners.cutoff)
}

/** Whether a pickup date can still be ordered at `now`. */
export function isOrderable(key: DateKey, now = new Date()): boolean {
  if (!dishesOn(key).length) return false
  if (now >= cutoffFor(key)) return false
  return daysBetween(todayKey(now), key) <= dinners.advanceDays
}

/** The last moment a paid order can be cancelled online: 24 hours before pickup opens. */
export function cancelCutoffFor(key: DateKey): Date {
  return new Date(at(key, dinners.pickup.from).getTime() - dinners.cancelHours * 3_600_000)
}

/** Pickup dates open for ordering at `now`, soonest first. */
export function orderableDates(now = new Date()): DateKey[] {
  const today = todayKey(now)
  const out: DateKey[] = []
  for (let i = 1; i <= dinners.advanceDays; i++) {
    const key = shiftDays(today, i)
    if (isOrderable(key, now)) out.push(key)
  }
  return out
}

/** "Monday 26 October", for a pickup date. */
export function pickupLabel(key: DateKey): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: VENUE_TZ,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(at(key, '12:00'))
}

/** "$5" or "$12.50". */
export function money(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`
}

export { venueDateKey }
