# The Peacock South Yarra

Client site migrated off Wix. Peregrine Partners is the agency; the venue is the client.

## Ground rules

- `src/lib/site.ts` holds the NAP, hours and nav. Never hardcode an address,
  phone number or opening hours anywhere else — NAP consistency is load-bearing
  for local SEO.
- `src/lib/menu.ts` is the menu. Editing prices means editing that file; the
  `Menu` JSON-LD and the rendered page both derive from it.
- Layout values came from measuring the live site (`docs/research/`). If you
  change a spacing or type value, check it against `DESIGN_TOKENS.md` first —
  the odd-looking numbers are deliberate.
- The site is light-only, matching the source. Don't add a dark palette.
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
- The floor plan is three equal zones across `room.depth`: verandah, inside,
  courtyard. `ZONE_DEPTH` is the divisor — don't write 5.2 anywhere. Moving a
  table or a fixture means re-running `npm test`: `auditVenue()` is the 0.9 m
  clearance rule and the suite calls it.
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
