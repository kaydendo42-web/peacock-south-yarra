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

Pages: home, our place, searchable menu, bookings, and find us/contact.
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
also runs the three page-level regressions (16 tests total).

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
- src/lib/site.ts: name, address, phone, hours and navigation.
- src/lib/menu.ts: menu entry point, legacy menu, dietary legend and surcharges.
- src/lib/square-catalog.ts: read-only API and catalog transformation.
- src/components/structured-data.tsx: schema from the same site/menu sources.
- public/images: optimised client imagery.
- docs/research: old measurements, redesign direction and asset provenance.

## Bookings and contact
The existing booking integration has been removed at the user's request.
The booking route currently offers a phone contact. Jason owns the new system:
see [booking handoff](docs/BOOKING_HANDOFF.md).
With no email provider configured, the contact page offers a direct email link.
Set the existing RESEND_API_KEY and CONTACT_FROM_EMAIL settings to enable
the enquiry form; verify sender-domain delivery before launch.

## Domain and launch
The existing production website remains unchanged. See
[Cloudflare preparation](docs/CLOUDFLARE_SETUP.md). Recommended: keep Jenny's
registration and billing at Crazy Domains, use Cloudflare for DNS, and
connect the approved production deployment afterwards.

Square is connected to the user-selected The Peacock South Yarra location.
The Vercel project is `peacock-south-yarra`, with server-only production Square
variables and GitHub integration. The existing custom domain is not switched by
this deployment; keep DNS changes separate from publishing to Vercel.
Before launch: review the POS duplicates/internal entries noted in the Square guide,
confirm café hours/prices and
image permissions with Jenny, check bookings/contact, then deploy and update
DNS. Nothing in the local build changes domain registration or billing.

Permanent legacy redirects remain: /general-1 → /menu,
/book-online → /book-a-table, /cafe-menu → /menu.
