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

## Verifying a change

```bash
npm run build     # typechecks as part of the build
npm run dev
```

Reference screenshots for visual comparison live in
`docs/research/<page>/design-references/`.
