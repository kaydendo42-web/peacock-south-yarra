# Phase 2: Jenny's requests (12 Oct 2026)

From her messages after the booking system went live.

| # | Request | Where | Size |
| --- | --- | --- | --- |
| 1 | Booking times every 15 min | Site (`service.slotMinutes`) | Done: branch `booking/15-min-slots` |
| 2 | Stay logged in on the Android device | Console | Small, but needs a diagnosis first |
| 3 | Order-online page from Square on the website | Site | Small |
| 4 | Post to Google from the dashboard | Console | Medium + Google approval wait |
| 5 | Generate social posts in the dashboard | Console | Medium-large |

The console already steps times in 15s (`step={900}`, scrub `step={15}`), so #1
only touched the guest grid.

---

## 2. Staying logged in

The console needs password **and** an authenticator code (aal2) for every new
session (`proxy.ts`). Losing the session on a shared Android device means
staff need Jenny's phone for the code, which is the real pain.

A Supabase session should already last: `@supabase/ssr` writes its cookies
with a 400-day max-age, and the refresh token doesn't expire unless the
project sets a time-box or inactivity timeout (Pro-only settings). So
something on the device or the project is ending it.

**Step 1: diagnose (30 min).**
- `auth.sessions` for her user: how often new sessions are created, their
  `user_agent`, `not_after`. Tells us whether it's the device dropping cookies
  or the session being ended server-side.
- Ask Jenny: Chrome or another browser? Incognito? Battery/"clear data"
  cleaner apps? Does it happen daily or randomly?

**Step 2: fix (half a day).**
- Make the console an installable web app (manifest + icons, `display:
  standalone`). Installed to the home screen, Android keeps its storage and
  cookies; it also opens straight to the run sheet like an app.
- If Jenny's account is shared by staff, give the device its own **staff
  login** with no MFA, scoped by role to the run sheet only (seat, cancel,
  new booking; no settings, no exports). Her own login keeps MFA. That needs
  an RLS change, because policies currently require aal2 for everything.

Don't drop MFA from her owner account to fix this.

---

## 3. Square order-online page

Square Online hosts the ordering page; Square's help says to link to it from
your own site, not embed it. Orders land in her Square POS, she pays only
Square's online card fee, and we carry no ongoing cost.

- Need from Jenny: the ordering page URL (Square Dashboard → Online).
- Optional: serve it at `order.thepeacock.com.au` (Square custom subdomain;
  one CNAME in Cloudflare).
- Add "Order online" to nav (`src/lib/site.ts`), the home hero, and the menu
  page. Add it to Google Business Profile as the order link.
- Before promoting it: Square's catalogue lags her printed menu on about a
  dozen prices and has duplicate items (`docs/menu-price-check.md`). Ordering
  reads Square directly, so she should fix those first.

A fully custom ordering flow on our site (Square Checkout/Orders API) is
possible later, but it's weeks of work for little gain over her Square page.

---

## 4 + 5. Posts from the dashboard

One feature: a **Posts** page in the console.

1. Jenny picks or uploads a photo (or takes one on the phone) and types a line
   ("new seasonal porridge, figs and honey").
2. Claude drafts the post in the café's voice. Three variants: Google (short,
   with a call to action button: Book / Order / Learn more), Instagram (caption
   + hashtags), Facebook.
3. She edits, picks where it goes, and posts now or schedules it.
4. A Vercel cron sends scheduled posts and records the result; the page shows
   what went out and any failures.

Optional prompts: "this week's special", "we're closed Monday", "event".

### Google Business Profile
- API: `accounts.locations.localPosts.create` (v4). Still maintained;
  Google added recurring posts in April 2026.
- **Blocker:** GBP API access isn't automatic. We apply through Google's
  access request form with a Google Cloud project; approval can take days to
  weeks. **Apply this week**, it's the long pole.
- Jenny connects once via Google OAuth (`business.manage` scope); we store the
  refresh token server-side.

### Instagram + Facebook
- Instagram must be a Business/Creator account linked to her Facebook Page.
- Publishing is a two-step container → publish call; Instagram has no native
  scheduling, so our cron does it.
- For our own client accounts, Meta's **Standard Access** is enough (she's
  added as a tester on our app). Selling this to other venues later means
  **Advanced Access**: App Review + Business Verification, a few weeks.
- Photos must be at a public URL when published: Supabase Storage bucket.

### Build order
1. Posts page + Claude drafting + copy-to-clipboard (useful on day one, no
   approvals needed).
2. Google posting (as soon as API access is approved).
3. Instagram/Facebook posting + scheduling.

---

## Running costs

Prices in US$ unless noted; check vercel.com/pricing and supabase.com/pricing
before invoicing.

| Item | Now | After phase 2 | Notes |
| --- | --- | --- | --- |
| Vercel Pro | $20 | $20 | One seat, shared by all clients. Includes $20 usage credit; cron is included |
| Supabase | $0 (Free) | $25 | **Upgrade now regardless**: Free has no backups and it holds real bookings. Pro includes the micro compute and 100 GB storage for photos. Shared by all clients |
| Claude API (post drafts) | – | ~$1–3 | ~30 posts/month × 3 variants at Opus 5.5 rates ($4/$20 per MTok) is about $1. Budget $3 for retries and photo input |
| Google Business Profile API | – | $0 | Free; access approval only |
| Meta Graph API | – | $0 | Free |
| Square Online | – | $0 to us | Jenny pays Square's card fee per order |
| Resend, Turnstile, Cloudflare DNS | $0 | $0 | Free tiers cover one venue |
| **Total infra** | **~$20** | **~$46–48 (≈ A$72–75)** | If Peacock is the only client on it |

Vercel and Supabase are shared, so each new client lowers Peacock's share.

### Pricing it to Jenny
- Infra is about A$75/month at most, and drops as clients join.
- She's saving Resos (A$70/month) + Wix.
- Her early note says she aims to pay about **$100/month**.
- **Suggestion:** A$99/month "hosting & care" (site, booking system, console,
  backups, small changes) and **A$149/month** with Posts (AI drafting +
  Google/Instagram/Facebook publishing). Build work billed once or rolled into
  a 6–12 month term.

### Build effort (for quoting)
| Item | Estimate |
| --- | --- |
| Stay logged in (diagnose + PWA) | 0.5 day; +1 day if we add a staff role |
| Square order link + nav + GBP link | 1–2 hours |
| Posts page + Claude drafting | 2 days |
| Google posting + OAuth | 1–1.5 days (after approval) |
| Instagram/Facebook + scheduling cron | 2 days |

---

## Needed from Jenny
- Square Online ordering page URL (and whether she wants `order.` subdomain).
- Fix Square prices/duplicates before we promote ordering.
- Android: which browser, how often it logs out, does staff share her login?
- Instagram is Business/Creator and linked to her Facebook Page; add us as
  Page admin/tester.
- Add us as a Manager on the Google Business Profile (if not already).
- OK on the monthly price.

---

## Update (12 Oct): table ordering, the app, Cloudflare

### Order from the table → use Square's QR self-serve ordering
Square Online has QR self-serve ordering: one QR code per table, the guest
orders and pays on their phone, and the order lands on her Square POS and
kitchen printer with the table on the ticket, as if a server keyed it in.
Square launched it in AU free for Square Online sellers (2020; confirm the
current terms in her dashboard).

So we don't build ordering or payments. We:
- help her switch it on and name tables to match our plan labels (`t30`
  → "30", etc.), print the QR table cards;
- link "Order online" (pickup) from the site;
- optionally mirror orders into the console read-only. POS orders don't fire
  `order.created`; listen to `payment.*` webhooks and `RetrieveOrder`, read
  the table from `ticket_name`. Test on her account first (forum info, not
  docs). 1–2 days, later.

### The app
- Console has only 3 media queries and no manifest: it needs a phone pass.
- Installable web app (PWA): manifest, icons, home-screen install, stays
  logged in, new-booking push notifications (Android supports web push).
  Mobile pass on today/list/booking edit/new booking/floor.
  **4–5 days.**
- Play Store listing (TWA wrapper) later if wanted: +2–3 days, US$25 one-off
  Google Play fee, store review.

### Cloudflare
- Workers Paid US$5/mo vs Vercel Pro US$20: saves ~US$15/mo across all
  clients. Supabase stays either way (moving to D1 would be a rewrite).
- `@opennextjs/cloudflare` docs still list Next 15 as the supported target;
  both repos are on Next 16.3. Check its releases before committing.
- Things to port: `next/image` (sharp) → Cloudflare Images or unoptimised,
  Vercel cron → Cron Triggers, env vars, the `proxy.ts` auth refresh.
- **Do it later, as its own job, both repos at once.** Not mixed into Jenny's
  feature work, and nothing she'd notice. ~2–3 days.

### Order of work
1. Now: 15-min slots live, Supabase Pro, apply for GBP API access.
2. Week 1–2: dashboard app (PWA + mobile + stay logged in + notifications).
3. Week 2: Square QR table ordering setup + order-online link (needs Jenny).
4. Week 3–4: Posts (drafting first, then Google, then Instagram/Facebook).
5. Later: Cloudflare move; orders feed in the console.
