# Onboarding Jenny: the full plan

Started 5 Oct 2026, updated end of Tue 6 Oct. Everything between here and The
Peacock running on thepeacock.com.au with Resos and Wix switched off, in order.
`PICKUP-jenny-onboarding.md` has the earlier build history.

Legend: **K** = Kayden does it, **C** = Claude does it, **J** = needs Jenny.

## Start here on Wednesday

Where it stands: both sites are live and green. Peacock `main` at `f44c768`
(peacock-south-yarra.vercel.app), Peregrine console `main` at `cec3118`
(www.peregrinepartners.space). The joined-tables SQL and seed have run.

1. **K** In the console List, give Monika (Sat 10 Oct, party of 9) **2 + 3 + 4**
   and Briony (Fri 9 Oct) **Peacock** (Courtyard). Both are amber until placed.
2. **K** Text Jenny: guests now choose an area, she can move anyone (joined
   tables too), the menu page shows her real menus. Ask the open questions
   below, especially **Resos priority direction**.
3. **K** Confirm: the test booking confirmation reached Gmail, and the
   **notifications SQL** (`20261006000000_venue_notifications.sql`) ran (the
   Settings → Notifications switch saves).
4. **K** Delete `PEACOCK_SESSION_SECRET`, `PEACOCK_OWNER_PASSWORD_HASH`,
   `PEACOCK_OWNER_USERNAME` from Vercel; remove the `KV_*` lines from the
   Peacock `.env.local` (local dev still writes test bookings to old Upstash).
5. When Jenny says yes: **Phase 4, cutover**.

## Facts this plan rests on (checked 5–6 Oct)

- `thepeacock.com.au` is registered at Crazy Domains, but its **nameservers are
  Cloudflare** (`ursula`/`vick.ns.cloudflare.com`), in Kayden's Cloudflare
  account, zone `d6c7eeb392258bd849222ba4f1f19e89`. Every DNS change happens in
  Cloudflare. A DNS-edit token for that zone is in the Peacock `.env.local` as
  `CLOUDFLARE_API_TOKEN`.
- Apex A records still point at Wix (`185.230.63.x`); `www` CNAME
  `cdn3.wixdns.net`. Mail (MX) is Google Workspace (`hello@` is a real inbox).
  Resend records (`send.`, `rsend.`, `resend._domainkey`) and the Google
  verification CNAME are in Cloudflare. Wix's `s1/s2._domainkey` and `_dmarc`
  CNAME remain until Wix is cancelled.
- Bookings phone `0419 448 953` (from Resos); café line `03 8596 2342` elsewhere.
- Resos has **no CSV export**. Future bookings were read from app.resos.com
  (logged in as Jenny) through its Meteor subscription
  `bookings.byDateTimeRange('57XdF2SeTHC9db4PW', Date, Date)` (real `Date`s,
  not strings), then imported with `npm run peregrine:import`.
- Claude is blocked by auto-mode from `vercel env pull` and from writing
  Vercel/Supabase settings; Kayden pastes secrets and runs SQL.

## Done

- Privacy policy + booking policy pages (Resos wording, Australian Privacy
  Principles, payment terms from her printed menu).
- Booking emails via Resend (`bookings@thepeacock.com.au`, alerts to `hello@`,
  switchable in console Settings → Notifications; Jenny starts **off**).
- Two-step sign-in (authenticator app) on the console, enforced by RLS; new
  sign-in loading states and setup screen.
- `/owners` removed from the Peacock site; alerts link to the console.
- 4 future Resos bookings imported (`RS-` ids).
- **Jenny's feedback (6 Oct):** guests book by **area** (Front Deck / Inside /
  Courtyard) in the 3D room; the server allocates a table or joined set from
  her Resos setup (`docs/resos-tables.md`, `docs/area-booking-plan.md`). Console
  picker offers joined tables. Menu page = food photos + her printed menus.

## Still to build (C, keys from K)

1. **Turnstile** on console sign-in and the booking form. Needs K: Cloudflare →
   Turnstile → Add widget, hostnames `thepeacock.com.au`,
   `www.thepeacock.com.au`, `peacock-south-yarra.vercel.app`,
   `www.peregrinepartners.space`, `localhost`.
2. **Google sign-in** on the console. Needs K: Google Cloud OAuth client (Web),
   redirect `https://pzljcmcnthzklaurzxpa.supabase.co/auth/v1/callback`.
3. **Auth emails through Resend** (Supabase's mailer sends ~2/hour). Needs
   `peregrinepartners.space` verified in Resend.
4. **Cancellation email from the console.** Cancelling in the console doesn't
   email the guest yet (only website bookings send emails).
5. **Supabase backups.** Free has none; nightly `pg_dump` to a private place.
6. Vercel Pro before or right after cutover (Hobby is non-commercial only).

## Phase 4: cutover day (quiet weekday morning)

1. **K** Vercel → `peacock-south-yarra` → Domains: add `www.thepeacock.com.au`
   (primary) and `thepeacock.com.au` (redirect to www). Send C the records
   Vercel shows.
2. **K** Resos: turn off online booking. **C** pull any Resos bookings made
   since 6 Oct (same Meteor method) and import them.
3. **C** Cloudflare DNS via API: replace the Wix A records and `www` CNAME with
   Vercel's, **DNS only (grey cloud)**. Leave MX, Resend and Google records.
4. **C** Check: HTTPS on the domain, an area booking end to end, email links,
   old Wix URLs redirect.
5. **K** Google Business Profile: website → `https://www.thepeacock.com.au`,
   booking link → `https://www.thepeacock.com.au/book-a-table`. Instagram bio.
6. **K** Keep Resos paid until the last imported booking (1 Nov) has passed;
   check it for cancellations in that window.

## Phase 5: tidy

- **K** Cancel Wix after DNS moves. **C** swap Wix's `_dmarc` for our own
  DMARC record and drop `s1/s2._domainkey`.
- **K** Cancel Resos after 1 Nov (saves $70/month).
- **K** Crazy Domains: auto-renew on, registrant is Jenny.
- **K** Delete the old Upstash store.

## Questions for Jenny

- **Resos priority:** does a higher number mean "fill this table first"? The
  allocation assumes yes (one-line change if not).
- **Booking alerts:** they're off, as in Resos. Want them on, and to which
  address (hello@ or her Gmail)?
- How long should we keep guests' booking details? Policy says "only as long
  as needed"; a fixed period is a one-line change.
- Resos lists table 41 as 1–2 seats and 51 as 1–5, the reverse of how they're
  drawn on her plan. Right?
- Square prices lag the printed menu (`docs/menu-price-check.md`); fix before
  online ordering.
- New text for "what we're about → Good food".

## Running costs

| Item | Cost | Notes |
| --- | --- | --- |
| Vercel Pro | US$20/month | One seat, shared by every client site and the console |
| Supabase | Free | No backups (see above); Pro US$25/month when it holds several clients |
| Resend, Turnstile, Google OAuth, Cloudflare DNS | Free | Resend free covers one domain |
| Resos, Wix | Cancelled at cutover | Jenny saves Resos's $70/month plus Wix |
