# Local verification — second pass, 21 September 2026

Historical second-pass record. The later approved changes and release checks
are documented in [THIRD_PASS.md](research/THIRD_PASS.md).

## Build and data

- Production compilation, TypeScript and all routes pass with
  `npm run build -- --webpack`. The alternate compiler is used because the
  first-pass Turbopack build hit a sandbox worker-port restriction.
- `npm test`: 13 passing tests. Includes exact AUD cents/location overrides,
  exclusions, missing/zero/variable prices, sold-out variations, multi-location
  selection, pagination/failures, safe image mapping and reviewed image exclusion,
  and grouping sizes by catalog ID without merging unrelated products.
- Live Square connection succeeds for the user-selected South Yarra location:
  8 categories / 228 variations. Regular/large latte $5.00/$5.80 verified in UI.
- Catalog photo visually inspected: incorrect person photo on toastie excluded
  in the website only. No Square data mutation.
- `.env.local` ignored by Git; access token remains server-side.
- `git diff --check` passed. Changed source formatted with Prettier.

## Browser checks

- Home, menu and booking checked at actual 320, 834 and 1440px viewports:
  no horizontal document overflow, exactly one H1 each.
- Additional 390px mobile screenshot and interactions checked. A clipped hero
  label at 320px was caught by element bounds (despite no document overflow)
  and its small-screen type size corrected.
- Mobile navigation opens; Escape closes it. Menu filters/search work, unmatched
  search shows empty state, reset restores Everything.
- Multiple latte sizes stay under one item with exact independent prices.
- Photo features disappear during filtered/search views so their category anchors
  cannot point to hidden sections.
- Menu JSON-LD parses alongside BreadcrumbList and CafeOrCoffeeShop; both menu
  UI and schema derive from the same live source.
- Hero dog link scrolls to regulars. All four photos load and the Instagram UI
  is cropped out. Original images retained; quotes explicitly identified as imagined.
- Pause motion updates aria-pressed and pauses the marquee. Reduced-motion CSS
  reviewed (not browser-emulated); it removes new effects and uses static ribbon text.
- Booking route has no iframe. Masthead/call fallback has clear spacing.
- Development server restarts after config formatting briefly interrupted a test;
  a fresh tab connected successfully and responsive checks were rerun.

## Before a public launch

Review the POS catalog issues in SQUARE_SETUP.md with Jenny, confirm photo rights
and current surcharge/hours details, and complete Jason's booking implementation.
Email delivery, public deployment, DNS changes and GitHub push were not performed.
No real reservation/order/payment submitted. Local development server remains on
http://127.0.0.1:3000.
