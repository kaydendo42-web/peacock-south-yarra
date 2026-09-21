# Approved second pass — 21 September 2026

User approved the coffee-led homepage, dog-regulars section, photo menu, motion,
and removal of the existing booking implementation. The Square location explicitly
chosen by the user is The Peacock South Yarra, `L3RTDE91J511F`.

## Design and reference inspection

Reviewed `DESIGN_TOKENS.md` before editing. This intentionally continues the
approved redesign rather than the old Wix measurements. Palette unchanged:
paper #fff9ed, forest #244d3d, mint #8bd3c4, pink #efb8c4, pale green #e7edde.
Fira Sans Extra Condensed headings, Jost body. Desktop hero 78–145px, mobile
68–108px; existing container/gutters retained. Distinctive moment: an oversized
latte/croissant/toastie still life paired with a real-photo dog review panel.

Inspected https://fereacafe.framer.website/ and `/menu` in the browser, plus the
public script `script_main.P_0p0xJF.mjs` observed in the page. It uses Motion/Framer
components: rolling-text hover, 0.4s spring transitions, 0.6s eased hover rotation,
50px translated entrance variants with staggered 0/.1/.2/.3s delays. Reimplemented
the patterns independently with CSS, IntersectionObserver and requestAnimationFrame;
no template code, branded assets or tracking scripts copied.

Home: asymmetrical coffee hero → animated mint ribbon → four dog photo cards →
Instagram photographs → FAQ → existing footer. Removed homepage menu teaser and
story/place sections. About remains its own page. No invented breakfast deal or
customer testimonial added. Dog quotes are explicitly labelled as imagined.

Motion: staged hero entrance, restrained scroll translation/rotation, continuous
ribbon with pause control, rotating CTA arrows, rolling navigation labels,
staggered dog/photo reveal, photo/card hover. Reduced-motion styles disable all
new animated effects and show static ribbon text. Reveal content is visible
without JS and the hero image is prioritised. Booking reserved for Jason.

## Assets

`public/images/coffee-hero-v2.webp`: original AI-generated decorative artwork,
not an actual menu-product photograph. Built-in image generation was used.
Generated PNG retained at
`/Users/kaydendo/.codex/generated_images/01a0c362-e199-76f2-978a-450f1b2c33fb/exec-7dabfb93-6ea6-4058-966d-d5540629a39d.png`.
WebP retains alpha and is ~492KB before Next image optimisation.

Final generation prompt:

> Use case: ads-marketing. Create a premium photorealistic cutout composition for a playful Melbourne neighbourhood cafe website hero. Genuine transparent background with alpha, no rectangular backdrop, no text or logos. A large forest-green ceramic latte cup and matching saucer, tilted slightly in an appetizing three-quarter overhead perspective, showing beautiful white rosetta latte art. A golden flaky butter croissant to the lower left of the cup, and two triangular halves of a toasted cheese sandwich on small cream plate further behind at upper right. A graceful curling ribbon splash of caramel-brown coffee sweeping along the right edge and bottom, with scattered realistic roasted coffee beans, a few floating midair. Cup is the main focal point, approx half composition. Leave air between food objects and ribbon. Warm natural studio light, tactile ceramic and crisp pastry layers, editorial food advertising, polished but cozy, natural appetizing proportions. Entire objects contained in image with generous transparent outer margin. Square composition, no typography, no people, no café interior. Meant as decorative cafe-themed artwork, not a product listing.

`public/images/dog-*.webp`: user-supplied photos/screenshots, resized and compressed
only. Non-destructive CSS crops exclude Instagram chrome; original screenshots
are not repainted or altered. Names follow the user's identification: Mango &
friends, Peppa, Lochie & Hazel, Frankie. The fluffy white visitor remains unnamed.
Confirm repost permission for community-owned photography before public launch.

Menu photography uses the existing client Instagram photos of porridge, Benedict
and latte, with a seasonal-presentation notice. Prices resolve from Square, never
from the photo list. Square-attached photos appear on their corresponding products.
Only one current product has an attached Square image, but it depicts a person.
It is excluded by ID in `src/lib/menu.ts` pending owner correction. No unrelated stock dishes
are passed off as the café's food. Source references: `INSTAGRAM_ASSETS.md`.

Square image API: https://developer.squareup.com/reference/square/objects/CatalogImage
and https://developer.squareup.com/reference/square/objects/CatalogItem .
