# Connect Jenny's Square menu

The website only reads Square catalog and location data. It does not take payments,
create orders or modify Jenny's Square account.

1. Open the ignored .env.local in this project's root.
2. Paste the production access token after SQUARE_ACCESS_TOKEN= and save.
   Use the token belonging to Jenny's Square account. Never paste it into chat,
   source files, a NEXT_PUBLIC_ variable or a browser form on this website.
3. Keep SQUARE_ENVIRONMENT=production for real prices.
4. If the account has multiple active AUD locations, set SQUARE_LOCATION_ID.
5. Run npm run square:check. It reports categories and item counts, never the token.
6. Optionally use the reported category IDs in SQUARE_MENU_CATEGORY_IDS, separated
   by commas, to include only public café menu categories.
7. Restart the local server after editing environment variables if it does not
   reload them automatically. Refresh /menu.

For scoped OAuth access: ITEMS_READ and MERCHANT_PROFILE_READ are required.
A personal production access token has broader account access; keep it private.
On hosting, set these values as server environment secrets, then redeploy.

## Behaviour
- No token: existing transcribed menu, clearly labelled as awaiting confirmation.
- Connected: Square category/item/variation prices rendered on the server.
- Reads all catalog pages; selects the sole active AUD location or the explicit ID.
- Applies location price overrides; excludes deleted, archived, unavailable,
  wrong-location and non-AUD variations. Variable prices have no invented amount.
- Multiple sizes are grouped under the same Square item, with each exact price
  visible. Distinct catalog IDs are never silently merged. Category names classify food vs drinks.
  Review the classification and category allowlist with Jenny before publishing.
- Square catalog reads are cached for five minutes in Next.js. On expiry the
  framework may serve the cached response while refreshing in the background.
- A request that fails without a usable cache shows a call-us state.
- Page and Menu JSON-LD use the same resolved data through src/lib/menu.ts.
- Paid modifiers are not expanded; this is a display menu, not online ordering.
- Existing weekend/holiday surcharges remain in src/lib/menu.ts; confirm with Jenny.

## Verified connection — 21 September 2026

The user selected **The Peacock South Yarra**, location `L3RTDE91J511F`.
The ignored local environment is configured accordingly. Live check passed:
8 categories, 228 variations, AUD. Porridge $19.90, Benedict $27.90, regular latte
$5.00 and large latte $5.80 are examples retrieved from this location.

IMAGE objects are read with ITEM and CATEGORY. Only the observed Square image CDN
is allowed through Next image optimisation. One item currently has a linked photo
(Cheese & Tomato toastie), but visual inspection found it was a person, not food.
That image ID is excluded centrally in `src/lib/menu.ts`; the live Square account
was not modified. Add correctly assigned actual dish photos to Square to extend
the menu automatically. The photo-feature strip uses existing client photography.

### Owner review before public launch

The website preserves the current catalog rather than guessing which entries
are historical or changing prices. Review these in Square with Jenny:

- `CABINENT` and `Cabinent /Kitchen` contain duplicate toasties and differing prices.
- `NANCY FOOD`, `JIM TOASTIE`, `$5 Hotcake` and other internal-looking entries.
- Mimosa's Bottomless Mimosa variation is $0.00; separate Bottomless Mimosas is $49.00.
- Chai has differing prices across categories and a variation named `6.80` with no
  fixed amount. Some Magic sizes are variable-priced.
- Aperol Spritz is classified under Tea; duplicate China Sencha entries.

Recommend a dedicated website category allowlist agreed with Jenny. Do not
silently delete POS items or assume zero means unavailable. No Square account
data was changed; this integration is read-only.

Official API references:
https://developer.squareup.com/reference/square/catalog-api/list-catalog
https://developer.squareup.com/reference/square/locations-api/list-locations
https://developer.squareup.com/reference/square/objects/ItemVariationLocationOverrides
