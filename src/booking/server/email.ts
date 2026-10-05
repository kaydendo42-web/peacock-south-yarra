import { site } from '../../lib/site.ts'
import type { Booking } from '../data/types.ts'
import { VENUE_TZ, tables } from '../data/venue.ts'
import { fromEnv } from './store.ts'

/**
 * Booking emails: a confirmation to the guest and an alert to the venue when a
 * booking is made, and a note to the guest when the venue cancels.
 *
 * Imported with relative `.ts` paths so the Node test runner can load it
 * without the `@/` alias, the same as `src/booking/data/`.
 */

export type Message = {
  to: string
  subject: string
  text: string
  html: string
  replyTo?: string
}

export interface Mailer {
  send(message: Message): Promise<void>
}

export type BookingEvent = 'created' | 'cancelled'

/**
 * Resend over its REST API. Null when unconfigured, so a missing key means
 * "no emails" rather than a failed booking.
 */
export function resendMailer(env: NodeJS.ProcessEnv): Mailer | null {
  const apiKey = env.RESEND_API_KEY
  const from = env.BOOKING_FROM_EMAIL || env.CONTACT_FROM_EMAIL
  if (!apiKey || !from) return null

  return {
    async send({ to, subject, text, html, replyTo }) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to: [to], subject, text, html, reply_to: replyTo }),
      })
      if (!res.ok) throw new Error(`Resend returned ${res.status}: ${await res.text()}`)
    },
  }
}

/** Where venue alerts go and where guests' replies land. */
export function venueInbox(env: NodeJS.ProcessEnv): string {
  return env.BOOKING_NOTIFY_EMAIL || env.CONTACT_TO_EMAIL || site.email
}

/**
 * Jenny's diary: the Peregrine console. The venue alert links straight to the
 * day the guest booked.
 */
export function consoleUrl(env: NodeJS.ProcessEnv): string {
  return (env.PEREGRINE_CONSOLE_URL || 'https://www.peregrinepartners.space/console/the-peacock').replace(/\/$/, '')
}

export type AlertSettings = { on: boolean; to: string }

/**
 * Whether the venue wants an email for each online booking, and where, as set
 * in the console's Settings. Read with the service key at send time, so a
 * change there applies to the very next booking.
 *
 * Fails open to the configured inbox: if the setting can't be read, an alert
 * Jenny didn't want is a smaller harm than a booking she never hears about.
 */
export async function alertSettings(env: NodeJS.ProcessEnv, fetcher: typeof fetch = fetch): Promise<AlertSettings> {
  const fallback = { on: true, to: venueInbox(env) }
  const url = fromEnv(env, 'SUPABASE_URL')
  const key = fromEnv(env, 'SUPABASE_SERVICE_ROLE_KEY')
  const venue = env.PEREGRINE_VENUE_ID
  if (!url || !key || !venue) return fallback
  try {
    const res = await fetcher(
      `${url}/rest/v1/venues?id=eq.${encodeURIComponent(venue)}&select=notify_bookings,notify_email`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!res.ok) return fallback
    const [row] = (await res.json()) as { notify_bookings?: boolean; notify_email?: string | null }[]
    if (!row) return fallback
    return { on: row.notify_bookings !== false, to: row.notify_email?.trim() || fallback.to }
  } catch {
    return fallback
  }
}

// --- formatting -----------------------------------------------------------

/** Server clocks run in UTC; a 9am booking must still read 9:00 am. */
const dayFormat = new Intl.DateTimeFormat('en-AU', {
  timeZone: VENUE_TZ,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
const timeFormat = new Intl.DateTimeFormat('en-AU', {
  timeZone: VENUE_TZ,
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export const whenLabel = (startsAt: string) => {
  const d = new Date(startsAt)
  return `${dayFormat.format(d)} at ${timeFormat.format(d).replace(/\s/g, ' ')}`
}

const tableLabel = (id: string) => tables.find((t) => t.id === id)?.label ?? id

/** YYYY-MM-DD in Melbourne, for the console's ?date= link. */
const dateKey = (startsAt: string) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: VENUE_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    new Date(startsAt),
  )

const people = (n: number) => `${n} ${n === 1 ? 'person' : 'people'}`

const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Guest-supplied text never reaches a subject line with a newline in it. */
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim()

/** One plain layout for all three emails: a heading, label/value rows, a footer. */
function render(heading: string, intro: string, rows: [string, string][], outro: string) {
  const text = [
    heading,
    '',
    intro,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    outro,
    '',
    `${site.name} · ${site.street}, ${site.suburb} ${site.state} ${site.postcode} · ${site.phone}`,
  ].join('\n')

  const html = `<!doctype html><html><body style="margin:0;background:#fff9ed;font-family:Helvetica,Arial,sans-serif;color:#334e42">
<div style="max-width:520px;margin:0 auto;padding:32px 24px">
<h1 style="font-size:22px;color:#244d3d;margin:0 0 12px">${escape(heading)}</h1>
<p style="font-size:15px;line-height:1.5;margin:0 0 20px">${escape(intro)}</p>
<table style="border-collapse:collapse;width:100%;font-size:15px">
${rows
  .map(
    ([k, v]) =>
      `<tr><td style="padding:8px 12px 8px 0;border-top:1px solid #244d3d22;color:#58695d;white-space:nowrap;vertical-align:top">${escape(k)}</td><td style="padding:8px 0;border-top:1px solid #244d3d22;color:#244d3d;font-weight:600">${escape(v)}</td></tr>`,
  )
  .join('\n')}
</table>
<p style="font-size:15px;line-height:1.5;margin:20px 0 0">${escape(outro)}</p>
<p style="font-size:12px;color:#58695d;margin:28px 0 0">${escape(site.name)} · ${escape(`${site.street}, ${site.suburb} ${site.state} ${site.postcode}`)} · ${escape(site.phone)}</p>
</div></body></html>`

  return { text, html }
}

// --- the three emails ------------------------------------------------------

export function guestConfirmation(b: Booking, inbox: string): Message {
  const rows: [string, string][] = [
    ['Reference', b.id],
    ['When', whenLabel(b.startsAt)],
    ['Table for', people(b.partySize)],
    ['Table', tableLabel(b.tableId)],
  ]
  if (b.notes) rows.push(['Your note', b.notes])

  return {
    to: b.email,
    replyTo: inbox,
    subject: `Your table at ${site.shortName}: ${whenLabel(b.startsAt)}`,
    ...render(
      `See you soon, ${oneLine(b.guestName)}`,
      `Your table at ${site.name} is booked.`,
      rows,
      `Need to change or cancel? Reply to this email or call us on ${site.bookingPhone} and mention your reference.`,
    ),
  }
}

export function venueAlert(b: Booking, console: string, inbox: string): Message {
  const rows: [string, string][] = [
    ['When', whenLabel(b.startsAt)],
    ['Party', people(b.partySize)],
    ['Table', tableLabel(b.tableId)],
    ['Name', b.guestName],
    ['Phone', b.phone],
    ['Email', b.email],
    ['Reference', b.id],
  ]
  if (b.notes) rows.push(['Notes', b.notes])

  return {
    to: inbox,
    replyTo: b.email,
    subject: `New booking: ${oneLine(b.guestName)}, ${people(b.partySize)}, ${whenLabel(b.startsAt)}`,
    ...render(
      'New booking',
      'A guest just booked online.',
      rows,
      `See the day in your console: ${console}/list?date=${dateKey(b.startsAt)}`,
    ),
  }
}

export function guestCancellation(b: Booking, inbox: string): Message {
  return {
    to: b.email,
    replyTo: inbox,
    subject: `Your booking at ${site.shortName} is cancelled`,
    ...render(
      `Booking cancelled`,
      `Hi ${oneLine(b.guestName)}, your booking at ${site.name} has been cancelled.`,
      [
        ['Reference', b.id],
        ['Was for', whenLabel(b.startsAt)],
      ],
      `If this is a surprise, reply to this email or call us on ${site.bookingPhone}.`,
    ),
  }
}

export function messagesFor(
  event: BookingEvent,
  b: Booking,
  env: NodeJS.ProcessEnv,
  alerts: AlertSettings = { on: true, to: venueInbox(env) },
): Message[] {
  const inbox = venueInbox(env)
  if (event === 'created') {
    // The guest's confirmation always goes; the venue's alert only if she wants it.
    const guest = guestConfirmation(b, inbox)
    return alerts.on ? [guest, venueAlert(b, consoleUrl(env), alerts.to)] : [guest]
  }
  return [guestCancellation(b, inbox)]
}

/**
 * Send and never throw. The booking is already saved by the time this runs;
 * an email outage must not turn a confirmed booking into an error screen.
 */
export async function notify(mailer: Mailer | null, event: BookingEvent, b: Booking, env: NodeJS.ProcessEnv) {
  if (!mailer) return
  const alerts = event === 'created' ? await alertSettings(env) : undefined
  const results = await Promise.allSettled(messagesFor(event, b, env, alerts).map((m) => mailer.send(m)))
  for (const r of results) {
    if (r.status === 'rejected') console.error(`Booking email (${event}, ${b.id}) failed:`, r.reason)
  }
}
