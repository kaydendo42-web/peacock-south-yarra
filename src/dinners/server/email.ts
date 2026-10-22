import { site } from '../../lib/site.ts'
import { oneLine, render, venueInbox, type Message } from '../../booking/server/email.ts'
import { cancelCutoffFor, dinners, money, pickupLabel } from '../menu.ts'
import { orderUrl } from './cancel.ts'
import type { DinnerOrder } from './store.ts'

/**
 * Dinner emails: a receipt to the guest once Square has their payment, a
 * note when they cancel, and the next day's pickup list to the café when
 * orders close at 9pm.
 */

/** Where the 9pm list goes: its own address if set, else the bookings inbox. */
export function dinnersInbox(env: NodeJS.ProcessEnv): string {
  return env.DINNERS_NOTIFY_EMAIL || venueInbox(env)
}

const lineLabel = (l: DinnerOrder['lines'][number]) => `${l.quantity} × ${l.dishName}`

/** "Sunday 1 November, 7am", the last moment to cancel online. */
const cancelLabel = (o: DinnerOrder) =>
  new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  })
    .format(cancelCutoffFor(o.pickupDate))
    .replace(':00', '')
    .replace(/\s*(am|pm)/i, '$1')

export function guestReceipt(o: DinnerOrder, inbox: string, env: NodeJS.ProcessEnv): Message {
  const rows: [string, string][] = [
    ['Order', o.id],
    ['Collect', `${pickupLabel(o.pickupDate)}, ${dinners.pickup.label}`],
    ...o.lines.map((l): [string, string] => [lineLabel(l), money(l.priceCents * l.quantity)]),
    ['Paid', money(o.totalCents)],
  ]
  return {
    to: o.email,
    replyTo: inbox,
    subject: `Your dinners from ${site.shortName}: ${pickupLabel(o.pickupDate)}`,
    ...render(
      `Thanks, ${oneLine(o.guestName)}`,
      `Your dinners are paid for. Collect them from the counter at ${site.street}.`,
      rows,
      `They come fully cooked: reheat and enjoy. Change of plans? Cancel for a full refund until ${cancelLabel(o)}: ${orderUrl(o.id, env)}. Questions? Reply to this email or call us on ${site.phone} and mention your order number.`,
    ),
  }
}

export function cancelledNote(o: DinnerOrder, inbox: string): Message {
  return {
    to: o.email,
    replyTo: inbox,
    subject: `Cancelled: your dinners for ${pickupLabel(o.pickupDate)}`,
    ...render(
      `Your order is cancelled`,
      `We’ve refunded ${money(o.totalCents)} to your card. It can take a few business days to show.`,
      [
        ['Order', o.id],
        ...o.lines.map((l): [string, string] => [lineLabel(l), money(l.priceCents * l.quantity)]),
        ['Refunded', money(o.totalCents)],
      ],
      `Hungry after all? Order again at ${site.url.replace(/\/$/, '')}/dinners.`,
    ),
  }
}

/** Tomorrow's orders, dish totals first, then who is collecting what. */
export function pickupList(date: string, orders: DinnerOrder[], inbox: string): Message {
  const totals = new Map<string, number>()
  for (const o of orders) for (const l of o.lines) totals.set(l.dishName, (totals.get(l.dishName) ?? 0) + l.quantity)

  const rows: [string, string][] = [
    ...[...totals].map(([dish, n]): [string, string] => [dish, `${n}`]),
    ...orders.map((o): [string, string] => [
      `${o.guestName} (${o.id})`,
      `${o.lines.map(lineLabel).join(', ')} · ${o.phone}`,
    ]),
  ]
  // Add-on lines (`…+parmesan`) are listed but aren't portions.
  const portions = orders
    .flatMap((o) => o.lines)
    .filter((l) => !l.dishId.includes('+'))
    .reduce((n, l) => n + l.quantity, 0)

  return {
    to: inbox,
    subject: `Dinners for ${pickupLabel(date)}: ${portions} portion${portions === 1 ? '' : 's'}, ${orders.length} order${orders.length === 1 ? '' : 's'}`,
    ...render(
      `Dinners for ${pickupLabel(date)}`,
      orders.length
        ? `Orders are closed. ${portions} portions to have ready for collection, ${dinners.pickup.label}.`
        : 'Orders are closed. Nobody ordered dinners for this day.',
      rows,
      'Every order here is paid. They also show in Square under Orders.',
    ),
  }
}
