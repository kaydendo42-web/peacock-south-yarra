# Interaction patterns

## Header
- Nav items are plain text; the item for the current page is `--teal`, the rest black.
- No scrolled/sticky state on the source site — the header scrolls away.
- Social icons are 25×25 circular PNGs, no hover transition.

## Hero slideshow
- 5 slides, auto-advance, crossfade.
- Prev/next chevrons: thin white outline, vertically centred, ~40px inset from each edge.
- Dot pagination bottom-centre; active dot filled white, inactive outlined.

## Buttons
- Solid `--teal` fill, white 15px Raleway label, square corners, no radius.
- No measurable hover transition on the source (Wix defaults to a slight opacity shift).

## Forms (`/contact-us`)
- Underline-only inputs: 1px bottom border in `--teal`, transparent field.
- Placeholder text sits in `--teal`, not grey.
- Submit is a standard teal button, centred.

## Mobile (real Wix mobile layout, iPhone UA)
- Header collapses to: wordmark left, social icons, hamburger right.
- Hero keeps the slideshow and gains a scroll-to-top arrow button bottom-left.
- **The "THE PEACOCK SOUTH YARRA" title and the "BOOK A TABLE" CTA are dropped entirely**, so mobile has no booking call to action above the fold.
- The footer drops the "SOUTH YARRA'S BEST BRUNCH CAFE" strapline.
- The Instagram strip is dropped.

## Deviations taken in the rebuild
These are deliberate, and each is a fix for a defect in the source:
1. One responsive layout instead of two divergent Wix layouts.
2. The BOOK A TABLE CTA is kept on mobile.
3. The menu is real HTML text, not a pair of 842px JPEGs.
4. Focus-visible rings and proper landmarks/labels throughout.
