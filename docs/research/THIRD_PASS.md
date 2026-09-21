# Third pass — 21 September 2026

Approved by the user before implementation. Existing forest, mint, paper and
pink tokens and Fira/Jost typography retained after reviewing DESIGN_TOKENS.md.

- Henry joins the dog review board with the supplied bulldog photograph and
  an explicitly imagined quote. Five cards use a centred three/two arrangement
  on desktop, two columns on tablet and one on phones.
- The menu's three promotional photo cards are removed. Original SVG sketches
  (dog, plant, coffee, croissant) surround the heading. Animation is decorative,
  ignored by assistive technology, manually pausable and disabled for reduced motion.
  Live Square dishes, search, category navigation and independent size prices remain.
- Our Place uses the supplied hanging-plant interior photo, a tall asymmetric
  photo-and-headline composition and a two-column story. Find Us is unchanged.

## Asset provenance

`dog-henry.webp`: user-supplied Instagram screenshot ending `26ace987-0f85-46be-be76-42b5e3ac8a51.png`.
Resized/compressed only; presentation crops out Instagram UI with CSS.
`peacock-interior.webp`: user-supplied photograph ending `beadef4d-f195-46b5-8f84-2a439b7ee9c5.png`.
Resized/compressed only. New drawings are original inline SVGs; no downloaded art.

## Verification

`TEST_BASE_URL=http://127.0.0.1:3000 npm test`: 16 passed (13 catalog/display
tests plus 3 real-page regressions). The page tests first failed against the
prior design, then passed after implementation. They can also target deployment
URLs; without TEST_BASE_URL the three page checks are skipped.

`npm run build -- --webpack`: production compilation and TypeScript passed.
Browser checks at 320, 834 and 1440px: home, menu and about have one H1 and no
horizontal document overflow. Additional 390px screenshots reviewed; adjusted
menu sketch spacing to avoid intro copy. Pause control sets aria-pressed and
pauses all four animated SVGs. Menu search tested with latte. Henry and interior
photos visually inspected. Reduced-motion rules inspected, not browser-emulated.

## Release boundaries

Vercel project: `kaydendo42-webs-projects/peacock-south-yarra`, connected to the
requested GitHub repository. Square variables scoped to production; token is
sensitive and server-only. Environment files excluded from Git and deployment
uploads. No Square catalog mutations, domain transfer, DNS or billing changes.
Bookings remain Jason's handoff; contact uses the existing direct-email fallback.
Existing POS data caveats remain in SQUARE_SETUP.md.
