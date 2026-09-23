# The Peacock South Yarra — website revamp design

> **Superseded, 23 September 2026.** Hosting moved back to Vercel (project
> `peacock-south-yarra`), and Jason's PeregrineTable booking system replaced
> Resos (`docs/BOOKING_SYSTEM.md`). Cloudflare Workers, OpenNext, Resos and
> the plan's task list no longer apply. `CLAUDE.md` holds the current rules.
> Kept for the record.

Date: 2026-09-21
Author: Peregrine Partners (Kayden Do, with Claude)
Implementer: Codex (see `docs/superpowers/plans/2026-09-21-peacock-revamp.md`)
Status: approved by Kayden 2026-09-21

## 1. Context

The Peacock is a brunch cafe at 68 River Street, South Yarra VIC 3141, owned by
Jenny. Her live site is on Wix (https://www.thepeacock.com.au). This repo already
contains a faithful 1:1 Next.js 16 migration of that Wix site (commit `8e79c26`)
with structured menu data, JSON-LD, a Resend-backed contact form, Wix URL
redirects, and all original assets.

This project turns that 1:1 migration into a **redesign** in the style of the
Ferea Framer template (https://fereacafe.framer.website — Kayden owns the
licence; Framer cannot export code, so it is a design reference only), then
deploys it to **Cloudflare Workers** and cuts DNS over from Wix.

Jenny's wider stack (Ordermentum, Fresho, Resos, Xero, Spotify, Square) and her
ops wishes (stock keeper, offers dashboard, loyalty, Kpay surcharging) are
**out of scope**. This is the marketing website only.

### Decisions already made (do not re-litigate)

| Decision | Choice |
|---|---|
| Scope | Marketing website only. |
| Palette | Hybrid: Ferea's cream/sand/brown base (her interior is homey), Peacock teal `#18C1C0` as the accent (her signage). |
| Sitemap | Ferea-style long-scroll Home (contains About), Menu, Book a Table, Contact. |
| Booking | Resos iframe stays live at launch, wrapped in a defined slot that Jason replaces later. |
| Menu source | Square Catalog API, synced at build/ISR time, with the existing `src/lib/menu.ts` as fallback. |
| Extras | Curated Google reviews (static) and curated Instagram grid (static). No blog, no newsletter, no online ordering, no gift-card integration. |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare`. DNS moves to Cloudflare. Domain registration stays at Crazy Domains. |
| Analytics | Cloudflare Web Analytics only. |

## 2. Goals and non-goals

Goals
- A site that looks like it was designed for The Peacock, not exported from Wix.
- Menu that is always current without a developer: Square is the source of truth.
- Zero-downtime move off Wix; email on `hello@thepeacock.com.au` keeps working.
- Clean handover surface for Jason's booking system.
- Lighthouse ≥ 90 across the board on mobile for `/` and `/menu`.

Non-goals
- A CMS. Copy, reviews, Instagram tiles and specials live in code.
- Dark mode.
- Any ops tooling (stock, loyalty, dashboards).
- Replacing Resos.

## 3. Approach

Section rebuild on the existing repo. Keep:

- `src/lib/site.ts` (NAP, hours, nav — still the single source of truth)
- `src/lib/menu.ts` (becomes the Square fallback snapshot; the `MenuBoard` /
  `MenuSection` / `MenuItem` types are the contract for the Square mapper)
- `src/components/structured-data.tsx`, `src/lib/mail.ts`,
  `src/app/contact-us/actions.ts` (extended with Turnstile)
- `next.config.ts` redirects, `robots.ts`, `sitemap.ts`
- `public/images/*`, `_assets_raw/*`, `scripts/optimize-assets.mjs`
- `docs/research/*` (historical record of the Wix site)

Replace:

- `src/app/globals.css` tokens and fonts
- `src/app/layout.tsx` fonts and shell
- `src/components/site-header.tsx`, `site-footer.tsx`, `ui.tsx`, `hero-slideshow.tsx`
- Every `page.tsx` body
- `src/app/cafe-menu/` (deleted; 301 to `/menu`)

Add:

- `src/components/ui/*`, `src/components/sections/*`
- `src/lib/square/*`, `src/lib/content/*` (copy, reviews, instagram, faq)
- `src/features/booking/*`
- `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars.example`
- `docs/ops/*` (DNS export, cutover runbook)
- `AGENTS.md` for Codex (mirrors and updates `CLAUDE.md`)

## 4. Design system

### 4.1 Colour tokens (`@theme` in `globals.css`)

| Token | Hex | Use |
|---|---|---|
| `--color-cream` | `#F5F1E9` | Page ground |
| `--color-sand` | `#E9E0D2` | Section cards, alternating bands, chips |
| `--color-cocoa` | `#5C3D2E` | Headings, body ink, dark bands (about, reviews) |
| `--color-cocoa-soft` | `#8A6A57` | Secondary text, captions |
| `--color-teal` | `#18C1C0` | Brand accent: primary buttons, pills, active nav, links, focus ring |
| `--color-teal-deep` | `#0F8F8E` | Hover / pressed |
| `--color-sun` | `#F2B84B` | Sticker and offer highlights only |
| `--color-white` | `#FFFFFF` | Card surfaces on dark bands, button text |

Contrast requirements: cocoa on cream ≥ 7:1 (passes); white on teal is 2.4:1 —
**teal buttons use cocoa text** (`#5C3D2E` on `#18C1C0` ≈ 5.0:1), not white.
White text only on cocoa bands.

Remove `--color-ink`, `--color-ink-soft`, `--color-teal-bright`, `--color-teal-dark`.

### 4.2 Type

Both via `next/font/google`, `display: "swap"`.

| Role | Face | Weight | Size | Notes |
|---|---|---|---|---|
| Display (h1/h2/h3, hero words, section titles) | Fira Sans Extra Condensed | 900 | h1 `clamp(64px, 12vw, 176px)`; h2 `clamp(44px, 7vw, 104px)`; h3 `clamp(32px, 4vw, 56px)` | Uppercase, `line-height: 0.9`, `letter-spacing: -0.01em` |
| Body | Akshar | 400 | 18px mobile / 20px desktop, `line-height: 1.5` | |
| Body strong / card titles | Akshar | 600–700 | 20–28px | |
| Nav, pills, buttons, eyebrow | Akshar | 600 | 15–16px | Uppercase, `letter-spacing: 0.04em` |
| Menu item name | Akshar | 700 | 18px | Uppercase |
| Menu price | Fira Sans Extra Condensed | 900 | 20px | |

Token names: `--font-display`, `--font-body`. Delete Nunito Sans, Jost, Oswald,
Raleway, Archivo Black and the Arial-based `--font-sans` / `--font-strapline`.

### 4.3 Shape and spacing

- Section cards: `border-radius: 40px` desktop / `28px` mobile, inset from the
  viewport by the page gutter (`24px` mobile, `48px` tablet, `max(64px, calc((100vw - 1440px)/2 + 64px))` desktop). Content max width 1440.
- Pills (eyebrows like `ABOUT US`, `OUR MENU`): `border-radius: 999px`, sand or
  teal fill, 12px 20px padding, slight `rotate(-3deg)`.
- Buttons: pill, 52px tall, teal fill with cocoa text; secondary = cocoa outline
  on cream. Trailing circular arrow icon on primary.
- Photo cards: `border-radius: 32px`, `object-fit: cover`.
- Vertical rhythm: sections separated by `clamp(64px, 10vw, 140px)`.
- Page gutter and radii are CSS custom properties so they change in one place.

### 4.4 Decorative language

- Tilted teal "tag" block behind the second hero line (`rotate(-4deg)`), cocoa text.
- Two or three sticker SVGs (coffee cup, dog bone, monstera leaf) drawn as inline
  SVG with a white "sticker" stroke and soft shadow. Stored in
  `src/components/ui/stickers.tsx`. Decorative: `aria-hidden`.
- Circular rotating "SCROLL · DISCOVER MORE ·" badge with a down arrow in the
  About band (`<svg><textPath>`, CSS `rotate` animation, 20s linear infinite).
- Scroll reveal: `Reveal` wrapper using `IntersectionObserver` that adds a
  class; CSS handles the 24px fade-up over 600ms. Single component, no library.
- Gentle float (`translateY ±8px`, 6s ease-in-out infinite) on stickers only.

All motion is disabled by the existing `prefers-reduced-motion` rule in
`globals.css`, which stays.

### 4.5 Logo

`public/images/logo.png` (teal wordmark, 190×27) is retained in the header and
footer. It is legible on cream. No new logo work.

## 5. Sitemap and navigation

| Route | Title | Notes |
|---|---|---|
| `/` | Home | Long-scroll; contains the About content |
| `/menu` | Menu | Square-fed |
| `/book-a-table` | Book a Table | Resos in the `BookingWidget` slot |
| `/contact-us` | Contact | Form + details + map |

Redirects (all 301, in `next.config.ts`): `/general-1 → /menu`,
`/book-online → /book-a-table`, `/cafe-menu → /menu`.

`nav` in `site.ts` becomes:

```ts
export const nav = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/book-a-table", label: "Book a Table" },
  { href: "/contact-us", label: "Contact" },
] as const;
```

Header: sticky, cream with `backdrop-filter: blur(12px)` and 1px cocoa/10 hairline
once scrolled. Left: logo. Centre (desktop): nav links, active in teal with
`aria-current="page"`. Right: Instagram icon + primary pill "Book a table".
Mobile: hamburger → full-screen cream drawer with the four links at display
size, socials, hours, and the Book pill. Existing a11y behaviour
(`aria-expanded`, `aria-controls`, body scroll lock, close on route change,
skip link) is kept.

Footer: cocoa band, cream text. Four columns on desktop, stacked on mobile:
(1) logo + `site.strapline` ("South Yarra's best brunch cafe"), (2) nav, (3) hours from `hours`, (4) NAP
from `site` with `tel:` / `mailto:` links and Instagram/Facebook. Bottom row:
`© {year} The Peacock South Yarra` · "Site by Peregrine Partners" linking to
https://www.peregrinepartners.space · Back to top.

## 6. Page specifications

All copy below is final unless Jenny changes it. Facts are limited to what the
Wix site, the menu boards and Jenny's brief state. Nothing else is to be
invented; if a section needs a fact that is not here, leave it out.

### 6.1 Home

Sections in order. Component names are the files under
`src/components/sections/home/`.

1. **`Hero`** — Cream. Left: pill sticker "SOUTH YARRA · EST. IN A 1930s HOUSE"
   (rotated), h1 line one `GOOD MORNING`, line two `SOUTH YARRA` inside the tilted
   teal tag block. Sticker doodles: coffee cup near the h1, dog bone lower-right.
   Below: eyebrow "OUR STORY", paragraph:

   > A beautifully renovated 1930s weatherboard house in the heart of South
   > Yarra, filled with plants and cosy corners. Brunch all day, coffee by St Ali,
   > and a courtyard where your dog is as welcome as you are.

   Buttons: primary "Book a table" → `/book-a-table`; secondary "See the menu" →
   `/menu`. Static chip under the buttons built from `hours`:
   "Mon–Fri 7am–3pm · Sat–Sun 8am–3pm". No "open now" logic.
   Right: large rounded photo card `hero-2.jpg` (french toast) with a smaller
   overlapping rounded card `hero-4.jpg` bottom-left. Mobile: photo card first,
   full width, then text.

2. **`About`** — Cocoa rounded band. Pill "ABOUT US". h2 `MORE THAN BRUNCH` /
   `IT'S YOUR LOCAL`. Centred photo card `hero-3.jpg` (interior). Paragraph:

   > Whether you're meeting friends for a coffee or settling in over brunch, the
   > menu caters to everyone, with a great range of vegetarian and vegan options.
   > Grab a spot on the front deck, the rear courtyard or inside among the plants.

   Rotating scroll badge below.

3. **`MenuHighlights`** — Cream. Pill "OUR MENU". h2 `WHAT WE'RE KNOWN FOR`.
   Horizontal scroll-snap row of `MenuCard`s (6 items, see §7.5 featured list).
   Card: photo (if any), name, dietary tags, price, "See it on the menu" link to
   `/menu#<section-id>`. Dot indicators on mobile. Link "View the full menu".

4. **`Values`** — Sand rounded band. Three `ValueCard`s (photo top, sand text
   panel bottom, sticker-style title over the photo):
   - "ALL DAY, EVERY DAY" — "The whole menu runs from open to close. Hotcakes at
     2pm is a perfectly reasonable decision." Photo `hero-5.jpg`.
   - "ST ALI COFFEE & CEREMONIAL MATCHA" — "Orthodox by St Ali on the machine,
     and ceremonial-grade matcha from Shizuoka, Japan." Photo `cafe-menu-hero.jpg`.
   - "FURBABIES WELCOME" — "Dogs are welcome on the front deck and in the rear
     courtyard. Shout them a housemade peanut butter doggo biscuit." Photo
     `hero-1.jpg`.

5. **`OurPlace`** — Cream. Pill "OUR PLACE". h2 `WHERE GOOD` / `MORNINGS BEGIN`.
   Three rounded photos: `shopfront.jpg`, `hero-3.jpg`, `peacock-sign.jpg`.
   Caption row: `site.addressLine` in title case, "Get directions" link to
   Google Maps (`site.googleMapsQuery`).

6. **`Specials`** — Sand rounded band, two columns. Left: photo card
   `hero-2.jpg`. Right: pill "THIS WEEK", h2 `THE REGULARS' TRICKS`, then a list
   of `menuSpecials` from `menu.ts` rendered as three rows (sun-coloured number
   badge, title, detail). Button "Book a table".

7. **`Reviews`** — Cocoa rounded band. Pill "REVIEWS". h2 `HEAR FROM` /
   `THE LOCALS`. Sticker doodles either side. Horizontal scroll of
   `ReviewCard`s from `src/lib/content/reviews.ts`: five stars, quote, name,
   "Google review". Link "Read more on Google" → `site.googleReview`.

8. **`InstagramGrid`** — Cream. h2 `@THEPEACOCK_SOUTHYARRA` as a link. Six
   square tiles from `src/lib/content/instagram.ts` (local images in
   `public/images/instagram/`), each linking to the post URL, 3×2 desktop, 2×3
   mobile.

9. **`Faq`** — Sand rounded band. Pill "FAQ". h2 `GOOD TO KNOW`. Accordion
   (native `<details>`/`<summary>` styled, one open at a time via a small client
   component). Content from `src/lib/content/faq.ts`:
   - "Do you take bookings?" — "Yes — book online for up to ten people. For
     groups larger than ten, call us on 03 8596 2342."
   - "Can I bring my dog?" — "Absolutely. Dogs are welcome on the front deck and
     in the rear courtyard, and there's a housemade peanut butter doggo biscuit
     with their name on it."
   - "Do you have vegetarian, vegan or gluten-free options?" — "Plenty. The menu
     marks vegetarian (V), vegan (VG), gluten-free (GF) and dairy-free (DF)
     dishes and options, and nuts (N)."
   - "Is there a surcharge?" — "A 10% surcharge applies on weekends and 15% on
     public holidays."
   - "Can we split the bill?" — "Sorry — we're unable to split bills on
     weekends or during busy periods."
   - "Do you sell gift cards?" — "Yes. Prepaid coffee cards are available at the
     counter and make an easy gift."
   Below: "Something else? Get in touch" → `/contact-us`.

10. **`CtaBand`** — Teal rounded band, cocoa text. h2 `COME FIND` /
    `YOUR NEW LOCAL`. Line: `hours` summary. Button (cocoa fill, cream text)
    "Book a table".

`WebSiteSchema` stays on the page. Page metadata title stays
"Best Brunch Cafe in South Yarra | The Peacock South Yarra"; description is
rewritten to drop "cocktails & tapas nights" (unverified):
"A plant-filled 1930s weatherboard house in South Yarra serving all-day brunch,
St Ali coffee and ceremonial matcha. Dog-friendly deck and courtyard. Book a table."

### 6.2 Menu (`/menu`)

- Header: pill "MENU", h1 `ALL DAY` / `EVERY DAY`, intro (existing copy: "Served
  all day, every day. Coffee is Orthodox by St Ali and our matcha is ceremonial
  grade from Shizuoka, Japan."), primary button "Book a table".
- `MenuNav`: sticky chip row under the site header listing every section
  (`food` sections then `drinks` sections). Chips are anchor links; the active
  chip is teal (IntersectionObserver). Horizontally scrollable on mobile.
- `MenuBoardView` ×2 (All Day Menu, Drinks): board title as h2, sections as h3
  with optional subtitle, items as `MenuRow` (name · tags · dotted leader ·
  price · description · note). Sections two columns on ≥1024px.
- `SpecialsStrip`: same three `menuSpecials`, compact.
- Legend + footnotes from `dietaryLegend` and `menuFootnotes`.
- The "printed boards" image section is removed.
- `MenuSchema` stays and is fed the same data the page renders.
- Data comes from `getMenu()` (§7). `export const revalidate = 3600`.

### 6.3 Book a Table (`/book-a-table`)

- Pill "BOOKINGS", h1 `SAVE` / `YOUR SPOT`.
- Two columns on desktop: left, sand rounded card containing `<BookingWidget />`
  (§8); right, "Before you book" list:
  - Groups over ten: call `site.phone`.
  - Bottomless mimosas need a 1.5-hour sitting and start from 10am.
  - 10% surcharge on weekends, 15% on public holidays.
  - Hours from `hours`.
- `BreadcrumbSchema` stays.

### 6.4 Contact (`/contact-us`)

- Rounded photo card `shopfront.jpg` full width.
- Pill "CONTACT", h1 `SAY HELLO`.
- Two columns: left `ContactForm` (name, email, message, Turnstile, submit);
  right details card — address (title case) with "Get directions", phone,
  email, hours, Instagram/Facebook, and the Google review CTA using the
  existing `google-review.png` button.
- Map iframe below, inside a rounded card.
- Success state: sand card with cocoa text. Error and mailto fallback
  behaviour unchanged.

## 7. Square Catalog sync

### 7.1 Shape

```
src/lib/square/
  client.ts      fetch wrapper (base URL, auth, Square-Version, pagination)
  catalog.ts     getMenu(): Promise<{ food: MenuBoard; drinks: MenuBoard; source: "square" | "snapshot" }>
  menu-map.ts    Square category name → { board: "food" | "drinks"; title: string; order: number; subtitle?: string }
  featured.ts    string[] of Square item names for the home carousel
  types.ts       minimal Square catalog types used here
scripts/
  square-dump.mjs      dump raw catalog to docs/research/square/catalog-YYYY-MM-DD.json
  square-snapshot.mjs  regenerate src/lib/menu.snapshot.ts from Square
```

### 7.2 Environment

- `SQUARE_ACCESS_TOKEN` — production token (secret).
- `SQUARE_LOCATION_ID` — the River Street location (secret-ish; treat as secret).
- `SQUARE_API_VERSION` — optional override; default pinned in `client.ts`.

### 7.3 Fetch

`GET https://connect.squareup.com/v2/catalog/list?types=ITEM,CATEGORY,IMAGE&cursor=…`,
paging until no cursor is returned. Codex verifies the exact endpoint and current `Square-Version` against
https://developer.squareup.com/reference/square/catalog-api/list-catalog before
coding; if `SearchCatalogItems` proves simpler for filtering by location it
may be used instead. The contract is `getMenu()`'s return type, not the endpoint.

### 7.4 Mapping rules

1. Discard items where `is_deleted`, `item_data.is_archived`, or the item is not
   present at `SQUARE_LOCATION_ID` (`present_at_all_locations` or
   `present_at_location_ids` includes it).
2. Category: use `item_data.categories[0]` (or `reporting_category` if that is
   what the dump shows). Look the category name up in `menu-map.ts`; items whose
   category is not mapped are dropped. This is the allowlist that keeps retail,
   gift cards and modifiers off the menu.
3. Name: `item_data.name`, trimmed. Dietary tags: if the dump shows a custom
   attribute (e.g. `dietary`), use it; otherwise parse a trailing bracketed
   suffix like `(V, GF/o)` from the name and strip it. The chosen rule is
   recorded in `menu-map.ts` as a comment after discovery.
4. Description: `item_data.description_plaintext ?? item_data.description`.
5. Price: variations' `price_money.amount` (cents). One variation → `"12.5"`
   formatting (no trailing `.0`; `"7.5"`, `"12"`). Two variations named
   Small/Large (or Regular/Large) → `"5.0 / 6.0"` style is **not** used; instead
   the `MenuItem` gets `price` = lowest and `note` = "Small 5 · Large 6". More
   than two → `price` = lowest with `note` = "from". Variation with no price →
   omit price.
6. Ordering: by `menu-map.ts` `order`, then Square `ordinal` if present, then
   name.
7. Image: if an `IMAGE` object is linked via `item_data.image_ids[0]`, use its
   `image_data.url`; add `connect.squareup.com` / `square-catalog-*` hosts to
   `images.remotePatterns` after seeing the real host in the dump. Otherwise fall
   back to `public/images/menu/<slug>.jpg` if that file exists, else no image.

### 7.5 Featured items

`featured.ts` lists six Square item names, matched case-insensitively after
tag-stripping: Blueberry Honeycomb Hotcakes, The Peacock, Chilli Crab Scramble,
Truffle Mushrooms, Peacock Dirty Chai, Coconut Cloud Matcha Latte. If a name is
not found the card is skipped (never blank).

### 7.6 Fallback and caching

- Missing env or any error → return the snapshot from `src/lib/menu.ts`
  (`foodMenu`, `drinksMenu`) with `source: "snapshot"` and `console.error` the
  reason once. The page renders identically; a `<!-- menu: snapshot -->` HTML
  comment is emitted so it is visible in a page-source check.
- `/` and `/menu` are ISR pages with `revalidate = 3600`. On Cloudflare this
  requires the R2 incremental cache and the DO queue (§10). No on-demand
  revalidation, so no tag cache.
- `getMenu()` is wrapped in React `cache()` so `/menu` and `MenuSchema` share
  one fetch per render.

### 7.7 Discovery first

Before writing `menu-map.ts`, Codex runs `scripts/square-dump.mjs` with real
credentials, commits the dump under `docs/research/square/`, and writes
`docs/research/square/MAPPING.md`: a table of every Square category and item
count, which ones map to which menu section, which are dropped, and every
mismatch against `menu.ts` (renamed items, price differences, missing items).
Kayden reviews that file before the mapper is finalised. If Square's catalog
is not organised well enough to drive the menu, the fallback snapshot ships
and Kayden raises it with Jenny — the site never blocks on Square.

## 8. Booking handover contract (for Jason)

```
src/features/booking/
  README.md          the contract below
  BookingWidget.tsx  server component; reads NEXT_PUBLIC_BOOKING_PROVIDER
  ResosEmbed.tsx     the current iframe, unchanged behaviour
  NativeBooking.tsx  stub: sand card, "Online bookings are getting an upgrade. Call us on {phone}." + tel link
```

- `NEXT_PUBLIC_BOOKING_PROVIDER` ∈ `resos` (default) | `native`. Unknown → `resos`.
- `/book-a-table/page.tsx` renders `<BookingWidget />` only; it must not import
  `ResosEmbed` directly.
- The slot is `width: 100%; min-height: 708px` on desktop, full-width on mobile;
  the widget owns everything inside it.
- README carries forward everything in `docs/BOOKING_MIGRATION.md` (that file
  is deleted): the four-step flow (People 1–10 + More, Date, Time, Submit with
  name/phone/email/notes), hours, groups > 10 via phone, bottomless mimosas =
  1.5-hour sitting from 10am, surcharges disclosed at booking, Resos kept in
  parallel during cutover, open decisions on storage (Cloudflare D1 is the
  default suggestion now that hosting is Cloudflare), confirmation email (Resend
  is already wired) and SMS (undecided).

## 9. Contact form

- Keep the Server Action, validation, honeypot, Resend adapter and mailto fallback.
- Add Cloudflare Turnstile: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` renders the widget
  (explicit render via the Turnstile script, `theme: "light"`), the action
  verifies `cf-turnstile-response` against
  `https://challenges.cloudflare.com/turnstile/v0/siteverify` with
  `TURNSTILE_SECRET_KEY`. If the site key is absent the widget is not rendered
  and verification is skipped (local dev). Use Cloudflare's documented test
  keys in preview.
- Resend sending domain `thepeacock.com.au` must be verified; the DNS records
  are added in Cloudflare during cutover (§11). Until then `CONTACT_FROM_EMAIL`
  may use Resend's onboarding sender for testing only.

## 10. Cloudflare deployment

### 10.1 Packages and files

- `npm i @opennextjs/cloudflare@latest` and `npm i -D wrangler@latest`.
- `wrangler.jsonc`:
  - `name: "peacock-south-yarra"`, `main: ".open-next/worker.js"`
  - `compatibility_date`: the date Codex runs the task (≥ 2024-12-30)
  - `compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"]`
  - `assets: { directory: ".open-next/assets", binding: "ASSETS" }`
  - `services: [{ binding: "WORKER_SELF_REFERENCE", service: "peacock-south-yarra" }]`
  - `r2_buckets: [{ binding: "NEXT_INC_CACHE_R2_BUCKET", bucket_name: "peacock-inc-cache" }]`
  - `durable_objects.bindings: [{ name: "NEXT_CACHE_DO_QUEUE", class_name: "DOQueueHandler" }]` with `migrations: [{ tag: "v1", new_sqlite_classes: ["DOQueueHandler"] }]`
  - `images: { binding: "IMAGES" }`
  - `routes: [{ pattern: "www.thepeacock.com.au", custom_domain: true }, { pattern: "thepeacock.com.au", custom_domain: true }]` — added only at cutover, after the zone is active.
  - `vars`: `NEXTJS_ENV: "production"`, `NEXT_PUBLIC_BOOKING_PROVIDER: "resos"`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- `open-next.config.ts`: `defineCloudflareConfig({ incrementalCache: r2IncrementalCache, queue: doQueue })`.
- `next.config.ts`: keep redirects; add `initOpenNextCloudflareForDev()` at the end; `images.remotePatterns` for Square image host if used.
- `package.json` scripts: `preview`, `deploy`, `upload`, `cf-typegen` per OpenNext docs. `build` stays `next build`.
- `.dev.vars.example` (committed) listing every var; `.dev.vars` and `.open-next` gitignored. `.env.example` updated to the same list.
- No `export const runtime = "edge"` anywhere.

### 10.2 Secrets

Set in the Cloudflare dashboard (or `wrangler secret put`): `SQUARE_ACCESS_TOKEN`,
`SQUARE_LOCATION_ID`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`. Never committed.

### 10.3 Images

Use the `IMAGES` binding. Image Transformations must be enabled on the
`thepeacock.com.au` zone once it exists. `images.unoptimized` is never set.
Before cutover, previews run on `*.workers.dev`; if the binding cannot
transform there, previews serve originals and that is acceptable. If the
binding errors outright, Codex switches to the custom `/cdn-cgi/image/` loader
from the OpenNext docs and records which path was taken in `docs/ops/DEPLOY.md`.

### 10.4 CI

Cloudflare **Workers Builds** connected to the GitHub repo:
build command `npx opennextjs-cloudflare build`, deploy command
`npx opennextjs-cloudflare deploy`, production branch `main`, preview
deployments for other branches. No GitHub Actions and no secrets in GitHub.

### 10.5 Redirect and analytics

- Cloudflare Redirect Rule: `thepeacock.com.au/*` → `https://www.thepeacock.com.au/$1` 301 (canonical stays `www`, matching `site.url` and all existing indexing).
- Cloudflare Web Analytics enabled on the zone (automatic injection). No GA, no cookies, no consent banner needed.

## 11. DNS, email and SEO cutover

Runbook lives at `docs/ops/CUTOVER.md`; Codex writes it, Kayden executes it.

1. **Audit** — log in to Crazy Domains, export every DNS record for
   `thepeacock.com.au` to `docs/ops/dns-before.md` (screenshots plus a text
   table). Identify MX, SPF/DKIM/DMARC TXT, any verification TXT, and the Wix
   A/CNAME records. Determine where `hello@thepeacock.com.au` is hosted (MX
   target tells you: Google, Microsoft, Wix/Zoho, or the registrar).
2. **Add zone to Cloudflare** (free plan). Verify the imported records match the
   export exactly, especially MX and TXT. Set proxy status "DNS only" on MX-related
   hosts and anything that is not the website.
3. **Nameservers** — change at Crazy Domains to Cloudflare's pair. Registration
   stays at Crazy Domains. Wait for "Active" (up to 48h). Do not remove Wix
   records yet: the Wix site keeps serving during propagation.
4. **Go live** — add the two custom-domain routes to `wrangler.jsonc`, deploy,
   delete the Wix A/CNAME records, add the apex redirect rule, add Resend's
   DNS records, enable Image Transformations and Web Analytics on the zone.
5. **Email check** — send to and from `hello@` and confirm both directions.
   If the mailbox turns out to be Google Workspace sold through Wix, transfer
   the Workspace subscription to direct Google billing **before** step 7.
6. **Search** — Google Search Console: verify the Cloudflare property (DNS TXT),
   submit `https://www.thepeacock.com.au/sitemap.xml`, check the three
   redirects return 301 with `curl -I`.
7. **Decommission** — after 14 days with no issues, cancel the Wix premium plan.

`sitemap.ts` drops `/cafe-menu`.

## 12. Verification

Every task in the implementation plan ends with a check; the release gate is:

- `npm run build` clean; `npm run preview` serves all four routes locally in
  the Workers runtime.
- Lighthouse mobile on `/` and `/menu`: Performance, Accessibility, Best
  Practices, SEO all ≥ 90.
- axe (browser extension or `@axe-core/cli`) reports no violations on any route.
- Screenshots at 390, 834 and 1440 for each route saved to
  `docs/research/revamp/` and eyeballed against the Ferea reference.
- `curl -I` on `/general-1`, `/book-online`, `/cafe-menu` → 301 to the right place.
- Google Rich Results test passes for `/` and `/menu` JSON-LD.
- Square fallback: run preview with `SQUARE_ACCESS_TOKEN` unset → menu renders
  from snapshot with the HTML comment present.
- Contact form end-to-end in preview with Turnstile test keys and a real Resend
  key to a Peregrine inbox.
- `prefers-reduced-motion: reduce` emulated → no movement anywhere.
- Keyboard-only pass: skip link, nav, drawer, accordion, form, Book buttons.

## 13. Inputs required (not in the repo yet)

| Input | Owner | Needed by |
|---|---|---|
| Square production access token + location ID (Jenny creates an app at developer.squareup.com or adds Kayden to her Square team) | Kayden / Jenny | Square discovery task |
| Six real Google reviews (text, reviewer first name, month/year) | Kayden | Reviews section |
| Six to nine Instagram images at ≥1080px with post URLs | Kayden | Instagram section |
| Dish photos for any featured item Square has no image for | Kayden / Jenny | Menu highlights |
| Crazy Domains login, Cloudflare account, Resend account, Turnstile site/secret keys | Kayden | Deployment and cutover |
| Jenny's sign-off on the copy in §6 | Kayden | Before launch |
| Confirmation of where `hello@` mail is hosted | Kayden (from the DNS audit) | Cutover step 1 |

Until reviews and Instagram images arrive, `reviews.ts` and `instagram.ts`
export empty arrays and their sections render nothing (the components return
`null` on empty input) — no lorem ipsum, no stock reviews.

## 14. Out of scope, explicitly

Blog, newsletter, online ordering, gift-card checkout, live Instagram/Google
APIs, CMS, dark mode, replacing Resos, any of Jenny's ops tooling, Cloudflare
Registrar transfer, changing the phone/email/address.
