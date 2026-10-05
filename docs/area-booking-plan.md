# Booking by area, not by table

From Jenny's message (6 Oct 2026): guests shouldn't choose a table. They choose
where they'd like to sit, see what that area looks like, and the venue
allocates the table, including joined tables for groups, the way Resos does.
Jenny must be able to move people. Kayden: keep the 3D room, but make the
**areas** the thing guests pick.

## Guest flow

1. Party, date, time (as now).
2. **Choose an area** in the 3D room. Three areas, matching Jenny's words:
   - **Front Deck**: outdoors, covered, not heated (our `deck` section)
   - **Inside**: our `main` and `peacock` sections together
   - **Courtyard**: outdoors, covered and uncovered, heated cover in winter (our
     `courtyard` section)

   Tapping an area lights the whole section and dims the rest. A card shows
   that area's photos (or a short video) and Jenny's description from Resos.
   Areas with no room for the party at that time are greyed: "Full at 11:30".
   Tables are not clickable.
3. Details, then confirm. The confirmation names the area, not a table.

## Allocation (server, at booking time)

For the chosen area, time and party size, consider every single table and
every combination in that area that is bookable online, seats the party
(`min ≤ party ≤ max`), and is free for the whole sitting. Pick the one with
the fewest empty seats, then the highest table priority. Write the booking and
its table(s) together; the database's no-double-booking rule settles races,
and on a clash the next candidate is tried.

## Data (Supabase migration)

- `venue_areas`: guest-facing area (name, description, photos, priority,
  which sections it covers).
- `venue_tables`: add `seats_min`, `priority`, `bookable_online`.
- `table_combinations` + members: Jenny's joined tables (e.g. Courtyard 2+3+4
  for 3–12).
- `booking_tables`: the table(s) a booking holds, with the exclusion
  constraint moved here so a combination can't overlap a single booking.
  `bookings.table_id` stays during the move for older rows.

Seeded from `docs/resos-tables.md`.

## Console

- List shows the area and table(s); the table picker offers single tables and
  combinations (built on `console/assign-table`).
- Moving someone is the same picker. Unassigned bookings stay flagged.

## Needed from Jenny

1. **Photos (or a short video) of each area**: Front Deck, Inside,
   Courtyard (ideally both the covered and open parts). We have usable shots
   of Inside (`peacock-interior`) and the deck from the street (`shopfront`),
   none of the courtyard.
2. **Courtyard table names**: Resos calls them Lawn, Tree 2, Deck 1, Deck 3,
   Deck 5, Peacock; our plan has L1, T1, D1, D3, D4 and a round table 1. Which
   is which?
3. **Priority**: in Resos, is a higher number filled first?
