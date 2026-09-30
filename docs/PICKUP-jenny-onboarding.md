# Pickup: finish the booking system and onboard Jenny

Written 30 Sep 2026, at the end of the session that built it. Read this first;
it is the state of play and the list of what's left, in order.

## Where everything is

| What | Where | State |
| --- | --- | --- |
| Peacock website | `kaydendo42-web/peacock-south-yarra`, branch `main` | Pushed. **Not deployed** — the Vercel project isn't git-connected; deploy with `vercel --prod` (or connect the repo in Vercel → Settings → Git). |
| Peregrine console | `kaydendo42-web/PeregrinePartners` (the repo behind www.peregrinepartners.space, Vercel project `peregrine-partners`), branch `console/bookings`; local worktree `~/Documents/Projects/peregrine-v2-console` | Pushed, preview deployed and checked 30 Sep. **Not merged to `main`** — merging deploys it to www.peregrinepartners.space. (The first build lived on the old `consilium` repo in `~/Documents/Projects/peregrine-console`; that copy is superseded.) |
| Database | Supabase project `supabase-booking` (ref `pzljcmcnthzklaurzxpa`), Sydney, Free | Created. Connected to both Vercel projects. |
| Schema + Peacock seed | `supabase/migrations/20260930000000_bookings.sql`, `supabase/seed/peacock.sql` in the PeregrinePartners repo | Pasted into the SQL editor — **confirm it ran** (step 1). |
| Console setup doc | PeregrinePartners `docs/console-setup.md` | |
| New-client prompt | PeregrinePartners `docs/onboard-new-venue-prompt.md` | Copy-paste prompt for the next venue. |

The Peacock's venue id, used everywhere: `fb19b599-8b90-4576-b84a-1ff0f4eb1f7e`.

### How it fits together

```
guest ─▶ thepeacock.com.au/book-a-table ─▶ /api/booking (server, service-role key) ─┐
                                                                                    ▼
                                                Supabase: bookings (RLS by venue_members)
                                                                                    ▲
Jenny ─▶ www.peregrinepartners.space/sign-in ─▶ /console/the-peacock (her session, RLS) ┘
```

The Postgres constraint `bookings_no_double_booking` is the last word on a
table being free, whichever door the booking came through.

## Environment variables (checked 30 Sep)

**peacock-south-yarra** (Production + Preview): `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_*`, `POSTGRES_*`,
`PEREGRINE_VENUE_ID` ✓. Still has the Upstash `KV_*` set — leave it until step 5
passes, then disconnect the Upstash store (Storage → the store → disconnect),
don't delete variables one by one. No `RESEND_API_KEY` yet, so booking
confirmation emails are off.

**peregrine-partners** (Production + Preview): the same set under the prefix
`BookingStorage_` (e.g. `NEXT_PUBLIC_BookingStorage_SUPABASE_URL`). The code
finds prefixed names on its own; nothing to rename.

Neither project has them in **Development**. For local work against the real
database, add Development in the integration, or put the values in `.env.local`.

## Finish line, in order

1. **Confirm the seed ran.** (30 Sep: all five tables exist, so the migration ran; row counts are hidden from the public key by RLS.) Supabase → Table Editor: `venues` 1 row,
   `sections` 4, `venue_tables` 31, `bookings` 0. If the tables aren't there,
   run the migration (whole file, Cmd+A), then the seed.
2. **Logins.** Supabase → Authentication → Users → Add user: Jenny's email +
   a password (auto-confirm), and one for each of us. Then SQL:

   ```sql
   insert into venue_members (venue_id, user_id, role)
   select 'fb19b599-8b90-4576-b84a-1ff0f4eb1f7e', id,
          case when email = '<jenny's email>' then 'owner' else 'manager' end
   from auth.users where email in ('<jenny's email>', 'kaydendo42@gmail.com');
   ```
3. **Auth URLs.** Supabase → Authentication → URL configuration: Site URL
   `https://www.peregrinepartners.space` (the bare domain 308s to `www`);
   redirect URLs `https://www.peregrinepartners.space/auth/confirm`,
   `https://*-kaydendo42-webs-projects.vercel.app/auth/confirm` and
   `http://localhost:3000/auth/confirm`. Only email-link sign-in needs these.
4. **Put the console on www.peregrinepartners.space.** Done on branch
   `console/bookings` of `PeregrinePartners`; the preview already redirects
   `/console` to sign-in, so it sees the Supabase variables. Once step 2 gives
   you a login, sign in on the preview, then merge to `main` (Vercel deploys
   it). Don't set `PEREGRINE_CONSOLE_DEMO` anywhere but a laptop.
5. **Prove the loop on a preview.** `vercel` (preview) from the Peacock repo →
   book a table → the row appears in Supabase `bookings` with
   `source = website` → it appears on `/console/the-peacock/list` for that day
   without a refresh → Seat it from the console → try to book the same table
   and time on the site: it must be refused. Then `vercel --prod`.
6. **Jenny's walkthrough.** Sign in on her phone and laptop. Dashboard, List,
   Seat / No-show / Cancel, Schedule, Floor plan, New booking (phone), Customers.
   The sidebar is in Resos's order on purpose.
7. **Cutover day** (pick a quiet weekday):
   - Export Resos's future bookings (CSV). In the Peacock repo:
     `npm run peregrine:import -- export.csv` (dry run, fix what it flags —
     unknown table numbers import unassigned), then `--commit`.
   - Point every Book button and her Google Business Profile booking link at
     `https://thepeacock.com.au/book-a-table`.
   - Keep Resos paid until the last imported booking has passed, so guests'
     old confirmation links work. Check Resos for cancellations made through
     those links in that window.
   - DNS: `thepeacock.com.au` → the Vercel project (registration stays at
     Crazy Domains).
8. **Tidy.** Disconnect Upstash. Decide whether the site's own `/owners`
   console stays as a fallback or goes (the Peregrine console replaces it).

## Questions for Jenny (none of these block the build)

- **D1** has 6 chairs drawn; it's set to seat 8 (ends). Right?
- **L1** is in the Court Yard, **26** and **25** in Main. Right?
- Where do people actually step between levels — the side door from the Deck,
  and which glazed doors into the Court Yard? And is there a raised timber
  platform in the yard (currently under D1/D3)? Photos would settle it.
- Does she want guests picking an exact table, or a section with her placing
  them? It's built for exact tables.
- Square is behind her printed menu on about a dozen prices and has duplicate
  items (`docs/menu-price-check.md`). She should fix Square before online
  ordering, which reads it directly.
- The "what we're about → Good food" paragraph: she said she'd send new text.

## Known gaps (not built)

- Editing a booking's time or table from the console (seat/cancel/no-show and
  new bookings work). Move a booking = cancel + new for now.
- Confirmation emails (need `RESEND_API_KEY` + a from-address on her domain).
- SMS, waitlist, reports, Reserve with Google.
- Square pre-order for pickup (her request; phase 2 — Square Checkout API,
  orders land in her POS, only Square's card fee).
- Per-venue sitting lengths: 75 min / 90 for 5+ / 15 min turnaround are in
  both the website (`service` in `venue.ts`) and the console
  (`app/console/[venue]/actions.ts`). Move to a `venues` column when the second
  venue needs different ones.

## Money

Both Vercel projects are on Hobby, which is non-commercial only. A café taking
bookings is commercial: budget Pro before go-live. Supabase Free is fine at one
café's volume; it pauses after a week without traffic, which a live booking
site won't hit.

## Checking your work

```bash
npm test          # 50 tests: booking rules, the floor plan audit, stores, emails
npm run build
npm run dev       # :3000
```

Console locally with sample data (no database needed):
`PEREGRINE_CONSOLE_DEMO=1 PORT=3001 npm run dev` in `peregrine-console`, then
`/console/the-peacock`.
