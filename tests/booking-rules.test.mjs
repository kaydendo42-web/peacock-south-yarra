import test from "node:test";
import assert from "node:assert/strict";
import { checkBooking } from "../src/booking/data/rules.ts";
import {
  ZONE_DEPTH,
  auditVenue,
  fixtures,
  footprint,
  openingOn,
  room,
  tables,
  zones,
} from "../src/booking/data/venue.ts";
import { bookableSlots } from "../src/booking/data/availability.ts";
import { timeLabel, periodOf, sittingFor } from "../src/booking/data/time.ts";
import { hours } from "../src/lib/site.ts";

/**
 * The rules the diary has to hold whichever way a write arrives. These run
 * against the same module the API route imports, so a rule that passes here is
 * the rule the server actually enforces — not a second copy of it.
 *
 * Dates are written in the venue's own wall clock via `local()`, which is what
 * a guest in Melbourne sees. Two of these assert through venue-local minutes
 * rather than constructed dates, which is the part that has to survive a server
 * whose own clock is UTC.
 */

const TUESDAY = "2026-09-22";
const SATURDAY = "2026-09-26";

/** 'YYYY-MM-DD' + 'HH:MM' in the runtime's own zone, as the guest's browser does. */
function local(key, hhmm) {
  const [y, m, d] = key.split("-").map(Number);
  const [h, min] = hhmm.split(":").map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0).toISOString();
}

/** Metres, compared the way metres have to be compared. */
function close(actual, expected, what) {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${what}: ${actual} is not ${expected}`,
  );
}

// C4 is the eight-top in the courtyard: big enough that these tests are about
// the rule under test and never incidentally about seats.
function booking(fields) {
  return {
    tableId: "c4",
    partySize: 2,
    durationMin: sittingFor(2),
    ...fields,
  };
}

test("opening hours come from site.ts, and differ on a weekend", () => {
  assert.deepEqual(openingOn(TUESDAY), [
    hours.weekdays.open,
    hours.weekdays.close,
  ]);
  assert.deepEqual(openingOn(SATURDAY), [
    hours.weekend.open,
    hours.weekend.close,
  ]);
});

test("a sitting that starts before the doors open is refused", () => {
  const violation = checkBooking(
    booking({ startsAt: local(TUESDAY, "06:30") }),
    [],
  );
  assert.equal(violation?.code, "closed");
});

test("a sitting that would run past closing is refused", () => {
  // 14:30 + 75 minutes finishes at 15:45, a quarter-hour after the doors shut.
  const violation = checkBooking(
    booking({ startsAt: local(TUESDAY, "14:30") }),
    [],
  );
  assert.equal(violation?.code, "closed");
});

test("the last sitting that finishes by closing is allowed", () => {
  assert.equal(checkBooking(booking({ startsAt: local(TUESDAY, "13:30") }), []), null);
});

test("Saturday opens an hour later than a weekday", () => {
  assert.equal(checkBooking(booking({ startsAt: local(SATURDAY, "07:30") }), [])?.code, "closed");
  assert.equal(checkBooking(booking({ startsAt: local(SATURDAY, "08:00") }), []), null);
});

test("the offered grid never contains a slot the rules would refuse", () => {
  for (const key of [TUESDAY, SATURDAY]) {
    for (const partySize of [2, 6]) {
      for (const slot of bookableSlots(key, partySize)) {
        const violation = checkBooking(
          booking({
            partySize,
            durationMin: sittingFor(partySize),
            startsAt: slot.toISOString(),
          }),
          [],
        );
        assert.equal(
          violation,
          null,
          `${key} ${timeLabel(slot)} for ${partySize} was offered but refused: ${violation?.message}`,
        );
      }
    }
  }
});

test("the grid runs from opening to the last sitting that fits", () => {
  const slots = bookableSlots(TUESDAY, 2).map(timeLabel);
  assert.equal(slots[0], hours.weekdays.open);
  assert.equal(slots.at(-1), "13:30");
  // One continuous service, so there is no gap in the middle of the day.
  assert.equal(slots.length, new Set(slots).size);
});

test("the day splits into two headings and nothing falls between them", () => {
  const periods = bookableSlots(TUESDAY, 2).map((slot) => periodOf(slot));
  assert.ok(periods.every((p) => p === "morning" || p === "midday"));
  assert.equal(periods.indexOf("midday"), periods.lastIndexOf("morning") + 1);
});

test("a booking still cannot overlap another on the same table", () => {
  const existing = [
    {
      id: "PK-EXISTING",
      tableId: "c4",
      startsAt: local(TUESDAY, "11:30"),
      durationMin: 75,
      partySize: 2,
      guestName: "Someone",
      phone: "0400 000 000",
      email: "someone@example.com",
      status: "confirmed",
    },
  ];
  assert.equal(
    checkBooking(booking({ startsAt: local(TUESDAY, "11:45") }), existing)?.code,
    "double-booked",
  );
  // The buffer after the sitting is held too: 12:45 plus 15 minutes.
  assert.equal(
    checkBooking(booking({ startsAt: local(TUESDAY, "12:30") }), existing)?.code,
    "double-booked",
  );
  assert.equal(checkBooking(booking({ startsAt: local(TUESDAY, "13:00") }), existing), null);
  // Its own edit does not clash with itself.
  assert.equal(
    checkBooking(booking({ startsAt: local(TUESDAY, "11:45") }), existing, "PK-EXISTING"),
    null,
  );
});

test("a party larger than the table is refused", () => {
  assert.equal(
    checkBooking(
      booking({ partySize: 9, durationMin: sittingFor(9), startsAt: local(TUESDAY, "11:00") }),
      [],
    )?.code,
    "too-small",
  );
});

/**
 * The floor plan. `auditVenue()` is the clearance rule written down rather than
 * asserted in a comment, so the test for the layout is a call to it.
 */

test("the room is three equal zones: verandah, inside, courtyard", () => {
  assert.deepEqual(
    zones.map((z) => z.id),
    ["verandah", "inside", "courtyard"],
  );
  close(ZONE_DEPTH * 3, room.depth, "three zones span the room");
  for (const zone of zones) {
    close(zone.span[1] - zone.span[0], ZONE_DEPTH, zone.id);
  }
  // Only the middle one is a building.
  assert.deepEqual(
    zones.map((z) => z.open),
    [true, false, true],
  );
});

test("every table clears its neighbours, the fixtures and the walls", () => {
  assert.deepEqual(auditVenue(), []);
});

test("every table sits in the zone it claims, and every zone has tables", () => {
  for (const table of tables) {
    const zone = zones.find((z) => z.id === table.zone);
    assert.ok(zone, `${table.label} is in unknown zone ${table.zone}`);
    const { y0, y1 } = footprint(table);
    assert.ok(
      y0 >= zone.span[0] && y1 <= zone.span[1],
      `${table.label} pokes out of ${zone.name}`,
    );
  }
  for (const zone of zones) {
    assert.ok(tables.some((t) => t.zone === zone.id), `${zone.name} has no tables`);
  }
});

test("the coffee station is in the western corner of the middle zone", () => {
  // West, as the isometric view reads it, is the corner where x = 0 meets the
  // verandah partition — so the counters hug x = 0 and the start of the zone.
  const counters = fixtures.filter((f) => f.kind === "counter");
  assert.ok(counters.length, "no counters");
  const inside = zones.find((z) => z.id === "inside");
  for (const c of counters) {
    assert.ok(c.x - c.w / 2 < 1.2, `${c.id} is not against the x = 0 wall or its corner`);
    assert.ok(c.y - c.d / 2 >= inside.span[0], `${c.id} starts before the middle zone`);
    assert.ok(c.y + c.d / 2 <= inside.span[1], `${c.id} runs past the middle zone`);
  }
  // Between them they turn the corner: one runs along x, one along y.
  assert.deepEqual(new Set(counters.map((c) => c.rail)), new Set(["x", "y"]));
});

test("the bathrooms are a slice of the middle of the south-east wall", () => {
  const wc = fixtures.find((f) => f.kind === "bathroom");
  assert.ok(wc, "no bathrooms");
  // The south-east wall is x = room.width.
  close(wc.x + wc.w / 2, room.width, "bathrooms against the south-east wall");
  const inside = zones.find((z) => z.id === "inside");
  const middle = (inside.span[0] + inside.span[1]) / 2;
  close(wc.y, middle, "bathrooms centred on that wall");
  // A slice of it, not the whole wall.
  assert.ok(wc.d < ZONE_DEPTH / 2, "the bathrooms take up more than half the wall");
});
