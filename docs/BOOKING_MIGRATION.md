# Booking migration

## Where it stands

`/book-a-table` embeds ResOS at `https://the-peacock-south-yarra.resos.com/booking`
in a 512×708 iframe. The migration keeps that iframe so nothing breaks for the
venue while the site moves off Wix. Replacing it is the next milestone.

## The flow to reproduce

ResOS runs four steps, and the replacement should match it so staff and regulars
recognise it:

1. **People** — a grid of 1–10 with a "More" disclosure beyond that
2. **Date**
3. **Time**
4. **Submit** — name, phone, email, notes

## Constraints from the venue

- Trading 7am–3pm Monday to Friday, 8am–3pm weekends and public holidays.
- Groups over ten currently go through the phone; the page already says so.
- Bottomless mimosas need a 1.5 hour sitting and start from 10am, so that
  booking type has to reserve a longer slot.
- Weekend and public-holiday surcharges (10% / 15%) should be disclosed at
  booking, not at the table.

## Open decisions

- Where bookings are stored, and which Marketplace database backs it.
- Confirmation email and SMS provider.
- Whether the venue keeps ResOS running in parallel during a cutover window.
- Whether this plugs into Peregrine's **006 Bookings** agent, and what the
  handover contract between the two looks like.
