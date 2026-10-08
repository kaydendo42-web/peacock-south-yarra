import { MIDDAY, VENUE_TZ, openingOn, service } from './venue.ts'
import type { DateKey } from './types.ts'

/** Venue-local time helpers. Everything the app shows is venue-local. */

const pad = (n: number) => String(n).padStart(2, '0')

export function dateKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const venueDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: VENUE_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Which of the venue's days an instant falls on, regardless of where the code
 * is running. The browser's own clock is usually the same thing for a guest
 * standing in Melbourne; a server in UTC is not, which is why anything that
 * files or filters by date has to use this rather than `dateKey`.
 */
export function venueDateKey(d: Date): DateKey {
  return venueDay.format(d)
}

export function todayKey(now = new Date()): DateKey {
  return venueDateKey(now)
}

const venueClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: VENUE_TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/**
 * Minutes past venue-local midnight, wherever this is running.
 *
 * Used by the service rules and by `at()` to turn a venue-local wall clock
 * into an instant without relying on the browser's or server's time zone.
 */
export function venueMinutes(d: Date): number {
  const [h, m] = venueClock.format(d).split(':').map(Number)
  return h * 60 + m
}

/** 'HH:MM' as minutes past midnight. */
export function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** 'YYYY-MM-DD' + 'HH:MM' in Melbourne → an instant, including daylight saving. */
export function at(key: DateKey, hhmm: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  const [h, min] = hhmm.split(':').map(Number)
  const wallClock = Date.UTC(y, m - 1, d, h, min)
  let instant = wallClock
  // Correct the UTC guess by the difference from Melbourne's clock. A second
  // pass handles the offset changing between the guess and the actual instant
  // on a daylight-saving transition day. Service starts after those changes.
  for (let pass = 0; pass < 2; pass++) {
    const guess = new Date(instant)
    const [gy, gm, gd] = venueDateKey(guess).split('-').map(Number)
    const venueWallClock = Date.UTC(gy, gm - 1, gd, 0, venueMinutes(guess))
    instant += wallClock - venueWallClock
  }
  return new Date(instant)
}

export function addMinutes(d: Date, min: number): Date {
  return new Date(d.getTime() + min * 60_000)
}

export function timeLabel(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d
  return venueClock.format(date)
}

export function dateLabel(key: DateKey): string {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function shiftDays(key: DateKey, days: number): DateKey {
  const [y, m, d] = key.split('-').map(Number)
  return dateKey(new Date(y, m - 1, d + days))
}

/**
 * The two halves of the day.
 *
 * These are headings, not gates. The venue is open continuously, so a sitting
 * that starts at 10:30 and runs into the afternoon is perfectly bookable — the
 * only window a sitting has to fit inside is `serviceWindow`. Splitting the
 * grid into periods the way a restaurant does would refuse that booking for no
 * reason anyone standing in the room could explain.
 */
export type Period = 'morning' | 'midday'

export const periods: Period[] = ['morning', 'midday']

export const periodNames: Record<Period, string> = {
  morning: 'Breakfast',
  midday: 'Brunch & lunch',
}

/** The one continuous window the doors are open on a date. */
export function serviceWindow(key: DateKey): [Date, Date] {
  const [open, close] = openingOn(key)
  return [at(key, open), at(key, close)]
}

/** Which half of the day a moment sits in, or null if the venue is shut. */
export function periodOf(when: Date): Period | null {
  const key = venueDateKey(when)
  const [open, close] = serviceWindow(key)
  if (when < open || when >= close) return null
  return when < at(key, MIDDAY) ? 'morning' : 'midday'
}

/** Every start time on the slot grid between opening and closing. */
export function allSlots(key: DateKey): Date[] {
  const [open, close] = serviceWindow(key)
  const out: Date[] = []
  for (let t = open; t < close; t = addMinutes(t, service.slotMinutes)) out.push(t)
  return out
}

/** Every bookable start time in one half of the day. */
export function slotsIn(key: DateKey, period: Period): Date[] {
  return allSlots(key).filter((slot) => periodOf(slot) === period)
}

/** Sitting length for a party. Large = 5 or more. */
export function sittingFor(partySize: number): number {
  return partySize >= 5 ? service.sittingMinutes.large : service.sittingMinutes.small
}

/** The window a booking actually occupies: sitting plus turnaround buffer. */
export function occupancyMinutes(partySize: number): number {
  return sittingFor(partySize) + service.bufferMinutes
}
