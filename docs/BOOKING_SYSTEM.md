# The booking system

`/book-a-table` runs PeregrineTable: a guest picks a party size, a day and a
time, then picks a **table** on an isometric floor plan rather than accepting
whatever the diary hands them. The owner sees the day as a run sheet or as the
same room, with each table carrying its current or next booking.

It was built standalone in `peregrinetable/` (its own repo, ignored here) and
ported into this site on 22 September 2026. This is what changed in the port,
and what is still owed.

## Where things live

| Path | What it is |
| --- | --- |
| `src/booking/data/` | Domain: the floor plan in metres, availability, and the rules |
| `src/booking/scene/` | The isometric room — orthographic, unlit, three-value flat shading |
| `src/booking/components/` | The guest flow: gate, floor plan, table panel, form |
| `src/booking/server/` | The API handlers, auth, config and the store |
| `src/app/api/booking/[...route]/` | The route handler; adapts Next's request into the shape above |
| `src/app/owners/` | The console, gated in a server component |
| `src/app/booking.css` | The stylesheet, every selector scoped under `.pt-root` |

`src/booking/data/rules.ts` is the one place a booking rule is written. The
browser checks the same rules for a better experience; the server re-checks
every write, and nothing depends on the browser having bothered.

## What the port changed

**The backend is the only backend.** The standalone build shipped a
localStorage adapter for its demo, with the owner credentials readable in the
bundle and guest details sitting unencrypted in the browser. It is gone. The
API adapter is the only adapter.

**Opening hours come from `src/lib/site.ts`.** The standalone build was written
around a restaurant: a lunch service and a dinner service, with a hard boundary
between them. The Peacock opens once and stays open, so there is one continuous
window per day — 7am–3pm on a weekday, 8am–3pm on a weekend, read from `hours`
via `openingOn()` in `src/booking/data/venue.ts`. "Breakfast" and "Brunch &
lunch" are headings on the time grid and on the run sheet; they do not gate
availability, so a sitting that starts at 10:30 and runs past eleven books
perfectly well.

Sittings are 75 minutes, 90 for a party of five or more, plus a 15-minute
turnaround. That is a café turn rather than the restaurant's 90/120.

**Opening hours are enforced, not just displayed.** `checkBooking` now refuses a
sitting that starts before the doors open or finishes after they shut, in
venue-local minutes so it holds on a server running in UTC. The guest's grid
never offers such a slot, but a write can arrive from an owner's edit or a stale
tab.

**The owner console is gated on the server.** The standalone build redirected
in the browser after rendering, and trusted a value script could write. Here
`ownerSignedIn()` reads the signed HttpOnly cookie in a server component, and an
unsigned browser is redirected before any of the console reaches it.

**The floor plan is The Peacock's.** The standalone build's synthetic layout
was a front bar, a dining room and a small courtyard. The room is now three
equal 5.2 m slices across its depth, which is what `ZONE_DEPTH` in
`src/booking/data/venue.ts` divides:

| Zone | Venue y | |
| --- | --- | --- |
| Front verandah | 0 – 5.2 | Open to the street: a crenellated parapet with a gap for the entry, not a wall |
| Inside | 5.2 – 10.4 | The only enclosed third. Full-height walls, an arched front door, a wider opening through to the back |
| Courtyard | 10.4 – 15.6 | Open to the sky, on its raised terrace |

Inside it, the **coffee station** is an L turning the western corner — west as
the isometric view reads it, which is the corner where the `x = 0` wall meets
the verandah partition — and the **bathrooms** are a block against the middle of
the south-east wall, the `x = room.width` one. Both are `fixtures`, so
`auditVenue()` keeps tables 0.9 m clear of them.

A note on the compass, since the code uses it: with the camera at equal XYZ,
screen-right is world (+x, −z). That puts west at the left corner of the
diamond and makes the lower-right face of the block its south-east wall. The
words in `Room.tsx` and in the tests mean the view, not a survey.

18 tables, 70 seats. A zone is 5.2 m deep and `auditVenue()` wants 0.9 m off
every wall including the two partitions, which leaves 3.4 m — two rows of
tables and the walkway between them, and not room for three. That is why the
layout is rows rather than a scatter.

**The palette is the website's.** The standalone build's mint-teal sky, coral
tables and yellow accent are gone. The site's own colours took their roles:

| Role | Was | Now |
| --- | --- | --- |
| Sky | teal `#94c4b4` | mint `#8bd3c4` |
| Floors, platforms, panels | stone `#f6efe4` | paper `#fff9ed` |
| Available table, primary action | coral `#ee7460` | pink `#efb8c4` |
| Booked / background | drained sand | pale sage `#e7edde` |
| Accent — selected table, chosen time | yellow `#f2c230` | forest `#244d3d` |
| Ink and hairlines | `#3a3247` | forest `#244d3d` |

The structure is untouched: three lightnesses per solid, one accent, and the
accent still under the 3%-of-pixels ceiling — it simply became the darkest
value in the palette rather than the brightest. The values live in two files
that must be edited together: the `.pt-root` token block at the top of
`src/app/booking.css`, and `src/booking/scene/palette.ts` for the 3D room.

**The type is the website's.** The standalone build set its body text in Karla
and everything else in Jost 300. Karla is gone. The booking system now uses the
site's two faces, split by size the way the site splits: `.display` at 11 and
13 px is a caption and takes the site's `.eyebrow` treatment (Jost 600,
uppercase, 0.13em); at 16 px and up it is a heading and takes Fira Sans Extra
Condensed 900, which is what every heading on the marketing pages is set in.
The two heading steps carry their own sizes rather than the 11/13/16/22/40 text
scale, because a condensed face needs more millimetres to hold the same weight.

Everything else about the layout is as the art direction set it. Do not
introduce a perspective camera, a lit material, a light, a box-shadow, a
backdrop-filter, or a border radius above 3px.

## Before it holds real bookings

Three things, in order of how badly they matter.

1. **The password.** `owner` / `password12345` is what the venue asked for at
   handover. It gates the run sheet, which holds guests' names, phone numbers
   and email addresses. Replace it:

   ```bash
   printf 'the new password' | npm run hash-password
   ```

   Put the result in `PEACOCK_OWNER_PASSWORD_HASH`. The password itself is never
   in the repo either way — only a scrypt hash — but a password published in a
   handover note is a password anyone can use.

2. **The store.** With neither `KV_REST_API_URL` nor `KV_REST_API_TOKEN` set,
   bookings go to `.data/bookings.json`. That is right for local work and wrong
   on Vercel, where the filesystem is per-instance and discarded — bookings
   would silently disappear. Point those two at Vercel KV / Upstash before
   deploying. `kvStore` in `src/booking/server/store.ts` is written but has
   never been run against a real instance; exercise it before launch.

3. **The session secret.** Without `PEACOCK_SESSION_SECRET` the cookie is signed
   with a random per-instance secret, so the owner is signed out by a deploy or
   by a cold start. Generate one with `openssl rand -base64 32`.

`.env.example` documents all four.

## Still owed

- **A narrow-viewport pass.** The phone layout is the standalone build's,
  verbatim, plus the frame giving up its height below 768px. It has not been
  looked at in a real narrow window since the port.
- **The availability grid assumes the guest's clock is Melbourne's.**
  `bookableSlots` builds its times in the runtime's own zone, which is right for
  a guest standing in South Yarra and wrong for one booking from overseas — they
  would see the grid shifted, and the server would refuse the booking with "The
  Peacock is open 07:00–15:00 that day". Safe, but confusing. The fix is to
  build the grid in `VENUE_TZ` the way `checkBooking` already does.
- **Public holidays.** `hours.publicHolidays` carries a display string and no
  open/close pair, so a holiday books as its weekday would. The owner can cancel
  from the run sheet in the meantime.
- **Sign-in throttling is per-instance**, so on serverless it is a speed bump
  rather than a lock. A shared counter in the store is the real fix.
- **No confirmation email.** The guest gets a reference on screen and nothing
  else. `RESEND_API_KEY` is already wired for the contact form and could carry
  this too.
