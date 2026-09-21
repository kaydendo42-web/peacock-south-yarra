# Peacock redesign — 21 September 2026

Historical first-pass notes. The approved second-pass changes in `SECOND_PASS.md`
supersede the home triptych/story/menu teaser and the ResOS booking implementation.

Re-skin of https://fereacafe.framer.website/about using The Peacock's identity,
original copy, existing client photos and the client's Instagram photography.
Reviewed DESIGN_TOKENS.md before changing spacing/type. This requested redesign
intentionally supersedes the Wix layout; NAP/menu single sources remain intact.

## Reference observations
Desktop at reported 1280px: Fira Sans Extra Condensed 900, hero 200/180px,
secondary 120/108px, section titles 72/64.8px. Body Akshar 20/24 and 24/28px.
Oversized centred titles, angled labels, pill outlines, thin header rule,
large photo-led sections, FAQ disclosures and closing CTA.
Browser viewport overrides did not change the reference's measured viewport.
Mobile sizes here are explicit adaptations, not claimed measurements.

## Client direction
Instagram has cream/forest/pink illustrated promotions, turquoise coffee cards,
St. ALi coffee, lots of plants and a weatherboard exterior.
Palette: paper #fff9ed, forest #244d3d, turquoise #8bd3c4, pink #efb8c4,
pale green #e7edde, body #334e42, muted #58695d. Light-only.
Fonts: freely licensed Fira Sans Extra Condensed 900 and Jost 400/500/600.
Hero 64–160px/.88, sections 48–88px/.95, body 18/28px, utility 12/18px.
Container 1320px, gutters 24–48px, section rhythm 64–112px.
Signature: angled turquoise headline label with a real café photo triptych.
No invented testimonials, awards, opening dates, team members or statistics.

## Section specifications
Header: 88px desktop, 76px mobile. Logo, nav, outlined booking CTA.
Home hero: centred location eyebrow; large two-line title with rotated second line;
intro and CTA; photos in 1:1.7:1 columns, 340px height (mobile 220px, two columns).
Story: equal columns with storefront photograph, 72px heading, description and link.
Menu teaser: three photo cards with food/drinks deep links; single column mobile.
Instagram: four square linked client photos, two columns mobile.
FAQ: intro and native disclosures, 1:1.5 grid; mobile stacked.
Footer: visit CTA, address/hours/contact/navigation, oversized wordmark.
About: masthead, story split, three factual value sections, FAQ.
Menu: searchable and filterable server-rendered menu with AUD prices.
Booking: preserve working ResOS, provide direct booking and phone alternatives.
Contact: hours/address/directions; email form only when configured.

## Data and interaction
Menu data and JSON-LD share one resolved source through src/lib/menu.ts.
Read-only Square catalog with server-only token, paging, location selection,
price overrides and category filter. No token: existing transcribed menu labelled.
Configured API failure: no stale-price fallback; show contact/retry path.
Hover motion is subtle, reduced motion respected, focus visible.
Domain work is advice only; launch locally, public deployment not requested.
