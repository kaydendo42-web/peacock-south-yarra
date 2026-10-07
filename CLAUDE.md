# The Peacock South Yarra

Client site migrated off Wix. Peregrine Partners is the agency; the venue is the client.

## Ground rules

- `src/lib/site.ts` holds the NAP, hours and nav. Never hardcode an address,
  phone number or opening hours anywhere else — NAP consistency is load-bearing
  for local SEO.
- `src/lib/menu.ts` feeds the `Menu` JSON-LD; the page itself shows Jenny's
  menu images. A reprint means new images and the matching prices here.
- Layout values came from measuring the live site (`docs/research/`). If you
  change a spacing or type value, check it against `DESIGN_TOKENS.md` first —
  the odd-looking numbers are deliberate.
- The site is light-only, matching the source. Don't add a dark palette.
- Arrow glyphs in copy (`↗`, `↘`, `←`) are followed by U+FE0E, the text
  presentation selector. Jost has no arrows, so without it iOS falls back to
  Apple Color Emoji and draws a blue tile. Keep it on any arrow you add.
- Wix-licensed fonts cannot ship here. The substitutes are wired through
  `@theme` in `globals.css`.
- `src/booking/` is the booking system, ported from the standalone build in
  `peregrinetable/` (a separate repo, ignored here — nothing imports it).
  Its stylesheet is scoped under `.pt-root` and its class names (`.btn`,
  `.panel`, `.field`, `.label`) are deliberately not the site's; keep it that
  way. Its palette lives in two files that have to be edited together: the
  token block at the top of `src/app/booking.css` and
  `src/booking/scene/palette.ts`. `docs/BOOKING_SYSTEM.md` has the rest,
  including what is still owed before it holds real bookings.
- The booking system's service hours derive from `hours` in `site.ts` through
  `openingOn()`. Never give it its own opening times.
- Guests book by **area** (Front Deck, Inside, Courtyard), never by table:
  `allocate()` in `src/booking/data/allocate.ts` picks the table or joined set
  server-side. Table names, seat ranges, priorities and combinations are
  Jenny's Resos setup (`docs/resos-tables.md`); table ids are the original
  plan labels and never change.
- The floor plan is traced from Jenny's drawing (Court Yard, Main, Peacock,
  Deck; 31 tables). `src/booking/data/venue.ts` writes every
  position in the drawing's pixels through `planX`/`planY` (11 mm a pixel), so
  a table can be checked against the drawing by eye. Moving, adding or
  renumbering a table means re-running `npm test` (`auditVenue()`: no overlaps,
  every table inside its section) and `npm run peregrine:seed` to update
  Peregrine's copy of the floor.
- Bookings live in Peregrine's Supabase when `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY` and `PEREGRINE_VENUE_ID` are set (Upstash, then a
  JSON file, otherwise). The service key is server-only. The database's
  `booking_tables_no_double_booking` constraint (one row per table a live
  booking holds, kept by trigger) is the final word on double booking. A
  booking's `table_ids` is sent only for joined sets.
- The menu page shows Jenny's printed menus as images
  (`public/images/menu-food.jpg`, `menu-drinks.jpg`, opened full size), plus
  food photos. `src/lib/menu.ts` is the typed copy behind the Menu schema; keep
  its prices in step when she reprints. `docs/menu-price-check.md` lists where
  Square disagrees.
- Compass words under `src/booking/` mean the isometric view, not a survey:
  screen-right is world (+x, −z), so west is the left corner of the diamond and
  the south-east wall is the lower-right face.
- The room is orthographic and unlit by design. No PerspectiveCamera, no
  lit materials, no lights, no box-shadow, no backdrop-filter, no radius
  above 3px — anywhere under `src/booking/`.

## Verifying a change

```bash
npm run build     # typechecks as part of the build
npm test          # includes the booking rules
npm run dev
```

Reference screenshots for visual comparison live in
`docs/research/<page>/design-references/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
