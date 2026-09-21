# The Peacock South Yarra — agent instructions

Client site for a South Yarra brunch cafe. Peregrine Partners is the agency;
the venue (Jenny) is the client. Kayden Do owns this repo; Jason owns bookings.

## Start here

1. Read `docs/superpowers/specs/2026-09-21-peacock-revamp-design.md` — the
   approved design. Decisions in it are settled; do not reopen them.
2. Work through `docs/superpowers/plans/2026-09-21-peacock-revamp.md` task by
   task, in order. Each task ends with a passing build and a commit.
3. Some tasks need credentials or data only Kayden has (Square token, Cloudflare
   dashboard, Google reviews, Instagram images). Do the code, leave the data
   modules empty, say so in the commit body, and continue. Never fabricate
   content.

## This is NOT the Next.js you know

Next.js here is 16.3.4. APIs, conventions and file structure differ from older
training data. Run `npm install`, then read the relevant guide in
`node_modules/next/dist/docs/` before writing any route, layout, image, font,
config or caching code. Heed deprecation notices. `middleware.ts` is `proxy.ts`
in 16. Never add `export const runtime = "edge"` — Cloudflare's adapter does
not support it.

## Ground rules

- `src/lib/site.ts` holds the NAP, hours and nav. Never write an address, phone
  number or opening hour anywhere else — NAP consistency is load-bearing for
  local SEO.
- The menu comes from Square (`src/lib/square/`). `src/lib/menu.ts` and
  `src/lib/menu.snapshot.json` are the fallback and must never be empty.
- All page copy lives in `src/lib/content/`. It is verbatim from the spec §6;
  do not reword it and do not invent facts about the venue.
- Design tokens are the eight colours and two fonts in `src/app/globals.css`
  `@theme` (spec §4). Teal buttons use cocoa text, never white. Light-only.
- Bookings: only `src/features/booking/` may know about Resos. Pages render
  `<BookingWidget />` and nothing else from that folder.
- Keep `docs/research/*` and `_assets_raw/*` untouched — they are the
  historical record of the Wix site.
- Commit messages: lower-case type prefix (`feat:`, `chore:`, `docs:`, `test:`),
  imperative, no emoji. Commit at the end of every task.

## Verifying a change

```bash
npm test          # vitest — pure logic (format, square mapper, turnstile)
npm run build     # typechecks
npm run preview   # OpenNext build + local Cloudflare Workers runtime
```

Reference screenshots of the Wix original live in
`docs/research/<page>/design-references/`; the design reference for the revamp
is https://fereacafe.framer.website (structure and type, not its brown palette).
