# The Peacock South Yarra

The Peacock's website, rebuilt off Wix onto our own stack so we can run the
booking system, SEO and analytics ourselves.

Built and maintained by [Peregrine Partners](https://www.peregrinepartners.space).

- **Live (Wix, still authoritative):** https://www.thepeacock.com.au
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill it in before testing the contact
form; without a mail provider the form falls back to a mailto prompt rather
than dropping enquiries.

## Layout

```
src/app/            routes — /, /cafe-menu, /menu, /book-a-table, /contact-us
src/components/     header, footer, hero slideshow, contact form, JSON-LD
src/lib/site.ts     NAP, hours, navigation — the single source of truth
src/lib/menu.ts     the full menu as structured data
public/images/      web-ready assets
_assets_raw/        untouched originals pulled from Wix, kept for re-cropping
docs/research/      measurements and screenshots taken from the live site
scripts/            one-off asset pipeline
```

## How the rebuild was made

Every spacing, type and colour value was measured off the live site with
`getComputedStyle` at 1440 / 834 / 390 rather than eyeballed. The measurements,
the section-by-section layout, and the interaction notes are in
[`docs/research/`](docs/research). The home page reproduces the original within
8px of total height.

## Deliberate differences from the Wix site

Each of these fixes a defect in the source rather than reproducing it:

1. **One responsive layout.** Wix served a separate mobile site by user-agent and
   otherwise scaled its 1440px canvas down, clipping body copy off the left edge
   below ~980px.
2. **The booking CTA survives on mobile.** The Wix mobile layout dropped both the
   page title and the "Book a table" button, leaving no call to action above the fold.
3. **The menu is real text.** It was published as two ~842px JPEGs, so none of the
   food, drinks or prices were indexable. It is now structured data rendered as
   HTML, with `Menu` JSON-LD, and the original boards kept below as images.
4. **The Instagram link is visible.** The Wix feed widget occupied the slot but
   never painted anything.
5. **Full `CafeOrCoffeeShop` schema** — opening hours, geo, cuisine, price range,
   reservation URL. Wix emitted a bare `LocalBusiness` with none of it.
6. **Accessibility** — skip link, landmarks, form labels, visible focus rings,
   `aria-current` on the active nav item, and reduced-motion support.
7. **Fonts.** Avenir LT, Brandon Grotesque, DIN Neuzeit Grotesk and TT Lakes are
   Wix-licensed and cannot ship here. Each is mapped to its closest free
   equivalent; every measured size, weight and line-height is preserved. See
   [`docs/research/DESIGN_TOKENS.md`](docs/research/DESIGN_TOKENS.md).

## Redirects

`/general-1` → `/menu` and `/book-online` → `/book-a-table`, both permanent, so
the Wix URLs keep their link equity.

## Still to do

- Replace the ResOS booking iframe with our own booking system.
- Provision an email provider for the contact form.
- Point DNS at the new deployment once the client signs off.
