# Design tokens — thepeacock.com.au

Measured from the live Wix site via `getComputedStyle` at 1440 / 834 / 390.
Raw dumps: `docs/research/<page>/tokens.<bp>.json`.

## Colour

| Token | Value | Where it appears (measured) |
|---|---|---|
| `--teal` | `#18C1C0` `rgb(24,193,192)` | Active nav item, hero H1, "CONTACT US" H1, footer band, all buttons |
| `--teal-bright` | `#36D9D8` `rgb(54,217,216)` | "SOUTH YARRA BRUNCH CAFE" section heading only |
| `--ink` | `#000000` | Nav items, body copy on home |
| `--ink-soft` | `#2E2525` `rgb(46,37,37)` | Body copy on /contact-us |
| `--white` | `#FFFFFF` | Page ground, all footer text, button labels |

Page background is white throughout. There is no dark mode on the source site.
No shadows anywhere. Only radius in use is `50%` (the two round social icons).

## Type

The live site uses Wix-licensed faces. Those cannot ship with this repo, so each
is mapped to the closest free equivalent; **ratios, sizes and weights below are
the measured originals and are preserved exactly.**

| Role | Original face | Substitute | Size / line-height / weight |
|---|---|---|---|
| Nav items | Avenir LT 85 Heavy | Nunito Sans 800 | 14px / 41px / uppercase |
| Hero H1 | Arial (Wix fallback) | Arial, Helvetica | 44px / normal / 400 |
| Section heading | DIN Neuzeit Grotesk Bold | Oswald 600 | 26px / normal / 700 |
| Body copy | Brandon Grotesque Light | Jost 400 | 17px / 1.47 / 400 |
| Contact body | Avenir LT 35 Light | Nunito Sans 300 | 15px / 1.5 / 400 |
| Contact H1 | Arial | Arial, Helvetica | 57px / normal / 400 |
| Footer hours | Avenir LT 35 Light | Nunito Sans 400 | 14px / 19.6px |
| Footer strapline | Arial Black | Arial Black, Archivo Black | 20px / letter-spacing 1px |
| Footer phone | Avenir LT 35 Light | Nunito Sans 600 | 16px |
| Button label | Raleway | Raleway | 15px / 21px / 400 |
| Instagram handle | TT Lakes Medium | Oswald 400 | 30px |

## Spacing & layout

Source is a Wix absolute-position canvas on a 1440 stage, so there is no real
grid. These are the measured positions the rebuild reproduces as a flow layout:

| Measure | Value |
|---|---|
| Header height | 120px (logo 190×27 at y=31, x=50) |
| Nav baseline | y=28, items centred as a group around x≈700 |
| Hero band | 1440×541 full-bleed, starts y=120 |
| Content inset (home) | left edge x=131 |
| Split section | text column ~540px wide; image 619×592 bleeding to the right edge |
| Footer band | full-bleed teal, starts y=1498 on home |
| Contact hero | 1440×1000 full-bleed |
| Contact form column | 384px wide, centred |
| Google map | 1440×350 full-bleed |

## Breakpoints

The source site is **not** responsive — it serves a separate Wix mobile layout
keyed off user-agent and otherwise scales the 1440 canvas down, which clips
copy off the left edge below ~980px. The rebuild replaces this with real fluid
CSS at `640 / 768 / 1024 / 1280`.
