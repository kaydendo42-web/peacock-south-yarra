# Onboarding Jenny: the full plan

Written 5 Oct 2026. Jenny approved the walkthrough. This is everything between
here and The Peacock running on thepeacock.com.au with Resos and Wix switched
off, in order. `PICKUP-jenny-onboarding.md` has the build history.

Legend: **K** = Kayden does it, **C** = Claude does it, **J** = needs Jenny.

## Facts this plan rests on (checked 5 Oct)

- `thepeacock.com.au` is registered at Crazy Domains, but its **nameservers are
  Cloudflare** (`ursula`/`vick.ns.cloudflare.com`), in Kayden's Cloudflare
  account. Every DNS change happens in Cloudflare, not Crazy Domains.
- Apex A records point at Wix (`185.230.63.x`). Mail (MX) is Google Workspace,
  so `hello@thepeacock.com.au` is a real inbox. No SPF record; DMARC `p=none`.
- Bookings phone is `0419 448 953` (from Resos); the café line `03 8596 2342`
  stays everywhere else.

## Phase 1: accounts and keys (K)

Each of these is set up once for Peregrine and reused for every future client.

| # | What | How | Where it goes |
| --- | --- | --- | --- |
| 1 | Cloudflare API token | Cloudflare → My Profile → API Tokens → Create → "Edit zone DNS", zone = `thepeacock.com.au` only | `~/.config/peregrine/cloudflare.env` as `CLOUDFLARE_API_TOKEN=...`, `chmod 600`. Never in chat or git. |
| 2 | Resend account | resend.com, Peregrine's own account (free: 3,000/month, 100/day) | API key → Vercel env (step 2.1) |
| 3 | Turnstile widget | Cloudflare → Turnstile → Add widget, hostnames: `thepeacock.com.au`, `www.thepeacock.com.au`, `peacock-south-yarra.vercel.app`, `www.peregrinepartners.space`, `localhost` | Site key + secret → Vercel env + Supabase |
| 4 | Google OAuth client | Google Cloud → new project "Peregrine Console" → OAuth consent screen (External, app name Peregrine) → Credentials → OAuth client (Web). Redirect URI: `https://pzljcmcnthzklaurzxpa.supabase.co/auth/v1/callback` | Client ID + secret → Supabase → Auth → Providers → Google |
| 5 | Vercel Pro | Upgrade team `kaydendo42-webs-projects` (Hobby is non-commercial only) | One seat covers every client project |

## Phase 2: build and wire (C, with K pasting secrets)

Claude can't write Vercel env vars or Supabase settings (auto-mode blocks it),
so each step ends with the exact values for Kayden to paste.

1. **Booking emails.** Add `thepeacock.com.au` in Resend; C adds its DNS
   records in Cloudflare via the API (on the `send.` subdomain, so Google mail
   is untouched). K sets on `peacock-south-yarra`:
   `RESEND_API_KEY`, `BOOKING_FROM_EMAIL=The Peacock <bookings@thepeacock.com.au>`,
   `BOOKING_NOTIFY_EMAIL=hello@thepeacock.com.au`,
   `CONTACT_FROM_EMAIL` (same as booking), which also switches on the contact
   form. Test: book on a preview, both emails arrive.
2. **Auth emails through Resend.** Supabase's built-in mailer sends ~2/hour.
   Supabase → Auth → SMTP: Resend's SMTP, from `no-reply@peregrinepartners.space`
   (needs that domain verified in Resend too).
3. **Two-step sign-in (MFA)**, required for owners and managers: authenticator
   app enrolment on first sign-in, challenge on every new session. Console repo.
   **Built 5 Oct** on branch `console/two-step` (`d3306eb`): `/sign-in/verify`,
   proxy check, and migration `20261005000000_require_two_step.sql` (K runs it
   in the SQL editor *after* the branch is live, or members are locked out of
   the data until they verify). Lost phone: Supabase → Authentication → the
   user → remove the MFA factor; they set up again on next sign-in.
4. **Turnstile** on console sign-in and magic-link (Supabase Auth → Bot
   protection → Turnstile + secret) and on the public booking form (verified in
   `/api/booking` before a row is written).
5. **Google sign-in** on the console. Sign-ups stay off: Google only works for
   an email already added to a venue.
6. **Remove `/owners`** from the Peacock site. One shared password, and the
   console replaces it. **Done 6 Oct.** After it deploys, delete
   `PEACOCK_SESSION_SECRET`, `PEACOCK_OWNER_PASSWORD_HASH` and
   `PEACOCK_OWNER_USERNAME` from Vercel; nothing reads them now.
8. **Booking alert switch.** Console → Settings → Notifications (branch
   `console/polish`, migration `20261006000000_venue_notifications.sql`).
   The website checks it on every booking. Jenny starts **off**, as she had
   Resos; guests' confirmations always send.
7. **Supabase backups.** Free has no automatic backups. A nightly `pg_dump` to
   a private place (GitHub Action) until a second client justifies Pro.

## Phase 3: Jenny's setup (J, ~15 min with K)

- Sign in on her phone, enrol the authenticator app (Google Authenticator or
  1Password), try Google sign-in.
- Answers to the questions below.

## Phase 4: cutover day (quiet weekday morning)

1. **K** Resos → export future bookings (CSV). **C** `npm run peregrine:import
   -- export.csv` (dry run, fix flags), then `--commit`.
2. **K** Vercel → `peacock-south-yarra` → Domains: add `thepeacock.com.au` and
   `www.thepeacock.com.au`.
3. **C** Cloudflare DNS via API: replace the Wix A records with Vercel's
   (`A 76.76.21.21` at the apex, `CNAME www → cname.vercel-dns.com`), **DNS
   only (grey cloud)**. Leave MX and the Resend records alone.
4. **C** Check: site loads on the domain with HTTPS, `/book-a-table` books end
   to end, emails link to the right domain, old Wix URLs redirect.
5. **K** Google Business Profile: website → `https://thepeacock.com.au`,
   booking link → `https://thepeacock.com.au/book-a-table`. Instagram bio too.
6. **K** Resos: turn off new online bookings. Keep it paid until the last
   imported booking has passed so old confirmation links still work; check it
   for cancellations in that window.

## Phase 5: tidy

- **K** Cancel the Wix plan (after DNS has moved; mail is on Google, not Wix).
- **K** Cancel Resos after the last imported booking date (saves $70/month).
- **K** Crazy Domains: confirm auto-renew is on and the registrant is Jenny.
- **C** Disconnect Upstash from the Vercel project.

## Not needed yet

- **Xero**: out of scope for the website.
- **Square**: menu already reads from it. Pre-order for pickup (phase 2 of the
  project) needs a production access token with Orders + Checkout scopes later.

## Running costs

| Item | Cost | Notes |
| --- | --- | --- |
| Vercel Pro | US$20/month | One seat, shared by every client site and the console |
| Supabase | Free | No backups (see 2.7); Pro US$25/month when it holds several clients |
| Resend, Turnstile, Google OAuth, Cloudflare DNS | Free | |
| Resos, Wix | Cancelled | Jenny saves Resos's $70/month plus Wix |

## Questions for Jenny

- **Booking alerts** go to `hello@thepeacock.com.au` for now. Does she check
  that inbox, or should alerts also go to her Gmail?
- Bookings phone on the site and emails is `0419 448 953`. Right number?
- Weekend surcharge (10% via Kpay): going ahead? If so it goes in the booking
  policy.
- How long should we keep guests' booking details? The policy says "only as
  long as needed"; a fixed period (e.g. 2 years) is a one-line change.
- **D1** has 6 chairs drawn; it's set to seat 8 (ends). Right?
- **L1** is in the Court Yard, **26** and **25** in Main. Right?
- Where do people step between levels (Deck side door, which Court Yard doors)?
  Raised platform in the yard under D1/D3? Photos would settle it.
- Guests pick an exact table, or a section and she places them?
- Square prices lag the printed menu (`docs/menu-price-check.md`); fix before
  online ordering.
- New text for "what we're about → Good food".
