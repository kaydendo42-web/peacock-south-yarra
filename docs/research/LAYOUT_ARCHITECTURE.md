# Layout architecture — page by page

Section order top→bottom, as measured on the live site at 1440.

## `/` — home  (doc height 1692)
1. **Header** — logo left (190×27), nav centred (HOME · CAFE MENU · MENU · BOOKINGS · CONTACT), Instagram + Facebook round icons right. White, 120px tall.
2. **Hero slideshow** — full-bleed 1440×541, 5 slides, prev/next chevrons at the vertical centre, dot pagination bottom-centre. Auto-advancing.
3. **Title block** — "THE PEACOCK SOUTH YARRA" 44px teal centred at y=671, "BOOK A TABLE" teal button beneath at y=734 (220×44).
4. **About split** — left: "SOUTH YARRA BRUNCH CAFE" 26px `--teal-bright` at y=866, then four body paragraphs. Right: `peacock-sign` image 619×592 bleeding off the right edge.
5. **Instagram strip** — "thepeacock_southyarra" 30px teal centred at y=1418 above a feed row.
6. **Footer** — teal band from y=1498.

## `/cafe-menu`  (doc height 1000)
1. Header
2. Two stacked teal buttons centred — "MENU" (→ `/menu`) at y=176, "BOOK A TABLE" at y=257.
3. Full-bleed food photo 1440×400 at y=328.
4. Footer

## `/menu` (source `/general-1`, doc height 1000)
1. Header
2. Two menu board images side by side — food board 472×333, drinks board 433×306. **Both are ~842px-wide JPEGs; the menu is not indexable text on the live site.**
3. Footer

## `/book-a-table`  (doc height 1115)
1. Header
2. ResOS booking iframe, 512×708, centred, starting y=130. Four steps: People → Date → Time → Submit.
3. Footer

## `/contact-us`  (doc height 1797)
1. Header
2. Full-bleed shopfront photo 1440×1000 (visually cropped to ~340 tall in flow).
3. "CONTACT US" 57px teal centred at y=545.
4. Intro paragraph, 384px column, centred, with a "Google" link.
5. Contact form — Name / Email / Your Message, underline-only inputs, teal "Submit" button centred.
6. Google-review badge image 173×50 centred.
7. Google Map iframe, full-bleed 1440×350 at y=1253.
8. Footer

## `/book-online`  (doc height 1000)
Wix Bookings placeholder rendering "Nothing to book right now. Check back soon."
Dead page — not linked from the nav. Redirected to `/book-a-table` in the rebuild.

## Footer (every page)
Full-bleed teal band, centred column:
- `CAFE:  MONDAY - FRIDAY  7am - 3pm   |   SATURDAY - SUNDAY  8am - 3pm`
- `PUBLIC HOLIDAYS  8am - 3pm`
- `SOUTH YARRA'S BEST BRUNCH CAFE` — 20px Arial Black, letter-spacing 1px
- `68 RIVER STREET, SOUTH YARRA, VIC, 3141`
- `EMAIL hello@thepeacock.com.au   PHONE 03 85962342`
