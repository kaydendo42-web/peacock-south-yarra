# The Peacock South Yarra

A café website by [Peregrine Partners](https://www.peregrinepartners.space).
Next.js 16, React 19, Tailwind CSS v4 and TypeScript.

## Current redesign
The 21 September 2026 design uses the structure and oversized typography of
the supplied Ferea Framer reference, adapted to The Peacock's forest green,
turquoise and pink identity, real café photography and original copy.
See [design direction](docs/research/PEACOCK_REDESIGN.md) and
[photo sources](docs/research/INSTAGRAM_ASSETS.md). Earlier Wix measurements
are retained as historical research, not the new layout specification.

The approved [second pass](docs/research/SECOND_PASS.md) adds an original coffee
hero, motion, real dog-regular photos and a photo-led Square menu. The homepage
has no menu teaser or story/place section. Motion supports reduced-motion
preferences and a manual pause for the hero/ribbon.

The approved [third pass](docs/research/THIRD_PASS.md) adds Henry to the review
board, replaces menu photo features with pausable café sketches, and gives Our
Place a distinct editorial layout with the supplied hanging-plant interior photo.

Pages: home, our place, searchable menu, bookings, and find us/contact. The
venue manages bookings in the Peregrine console, not on this site.
The old /cafe-menu route permanently redirects to /menu.

## Run locally
Use Node.js 24 (Node 22+ supports the TypeScript test scripts).

```bash
npm install
npm run dev -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000. Copy .env.example to .env.local only if a local
file does not already exist; do not overwrite existing credentials.

## Square menu
Paste Jenny's production token into SQUARE_ACCESS_TOKEN in .env.local.
This file is ignored by Git. Secrets are never exposed to the browser.

```bash
npm run square:check
npm test
```

With the local server running, `TEST_BASE_URL=http://127.0.0.1:3000 npm test`
also runs the page-level regressions. Without it, `npm test` runs the booking
rules, venue audit and store tests.

[Square setup](docs/SQUARE_SETUP.md) explains location selection, category
filtering, caching and permissions. Without a token the original transcribed
menu is shown with a confirmation note. Once connected, Square supplies
item names, grouped variations, descriptions, attached photos and AUD prices. Errors show an explicit
contact option instead of silently substituting old prices.

## Production verification
```bash
npm run build
```

If the local sandbox blocks Turbopack's worker port, use
`npm run build -- --webpack`; this performs the same production typecheck
and route generation with Next.js's alternate compiler.

## Content ownership
- src/lib/site.ts: name, address, phone, hours and navigation. The booking
  system's service hours derive from this, via `openingOn` in
  src/booking/data/venue.ts.
- src/lib/menu.ts: menu entry point, legacy menu, dietary legend and surcharges.
- src/lib/square-catalog.ts: read-only API and catalog transformation.
- src/components/structured-data.tsx: schema from the same site/menu sources.
- public/images: optimised client imagery.
- src/booking: the booking system — data and rules, the isometric scene and
  the guest flow.
- src/booking/data/venue.ts: the floor plan, the slot interval (15 minutes),
  sitting lengths and turnaround.
- src/app/booking.css: the booking system's stylesheet, scoped to `.pt-root`.
- docs/research: old measurements, redesign direction and asset provenance.

## Bookings and contact
`/book-a-table` runs PeregrineTable. A guest picks a party size, day and time
(every 15 minutes), then an **area** (Front Deck, Inside, Courtyard);
`allocate()` picks the table or joined set server-side. See
[booking system](docs/BOOKING_SYSTEM.md) and
[area booking](docs/area-booking-plan.md).

Service hours are derived from `hours` in `src/lib/site.ts`; the booking grid
and the footer cannot disagree about when the doors are open.

Bookings live in Peregrine's Supabase when `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY` and `PEREGRINE_VENUE_ID` are set (Upstash, then a
local JSON file, otherwise). The database's no-double-booking constraint is the
final word. The booking API is guests-only and never returns contact details.

The venue runs the day from the Peregrine console
(https://www.peregrinepartners.space/console/the-peacock), which requires a
password and an authenticator code. Booking alerts link to that day in the
console and are sent only when the venue has them switched on there. The old
`/owners` run sheet has been removed.

With no email provider configured, the contact page offers a direct email link.
Set the existing RESEND_API_KEY and CONTACT_FROM_EMAIL settings to enable
the enquiry form; verify sender-domain delivery before launch.

## Domain and hosting
Live at https://www.thepeacock.com.au since 7 October 2026 (moved off Wix).
DNS is in Cloudflare (DNS only), pointing at the Vercel project
`peacock-south-yarra`; the apex redirects to www. Registration stays with Jenny
at Crazy Domains. See [Cloudflare setup](docs/CLOUDFLARE_SETUP.md).

Merging to `main` deploys to production through the GitHub integration.
Square variables are server-only on Vercel.

## What's next
The console as an installable app for the venue's phone and tablet, Square QR
table ordering (plus ordering by table number from the website), an
order-online link, and drafted posts to Google, Instagram and Facebook.

Permanent legacy redirects remain: /general-1 → /menu,
/book-online → /book-a-table, /cafe-menu → /menu.
