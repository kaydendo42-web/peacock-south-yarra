import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { checkBooking } from "../src/booking/data/rules.ts";
import {
  PLATFORM_RISE,
  RISER,
  ZONE_ELEVATIONS,
  auditVenue,
  floorAt,
  steps,
  inside,
  openingOn,
  tables,
  zones,
} from "../src/booking/data/venue.ts";
import { bookableSlots } from "../src/booking/data/availability.ts";
import { at, timeLabel, periodOf, sittingFor } from "../src/booking/data/time.ts";
import { hours } from "../src/lib/site.ts";

/**
 * The rules the diary has to hold whichever way a write arrives. These run
 * against the same module the API route imports, so a rule that passes here is
 * the rule the server actually enforces — not a second copy of it.
 *
 * Dates are written in the venue's own wall clock via `local()`, independent
 * of the runtime's zone. Freeze the clock before the fixture dates so these
 * checks exercise opening hours and overlaps without becoming past bookings.
 */

const TUESDAY = "2026-09-22";
const SATURDAY = "2026-09-26";

beforeEach((t) => t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-21T00:00:00.000Z") }));

/** 'YYYY-MM-DD' + 'HH:MM' in the venue's zone. */
function local(key, hhmm) {
  return at(key, hhmm).toISOString();
}

/** Metres, compared the way metres have to be compared. */
function close(actual, expected, what) {
  assert.ok(
    Math.abs(actual - expected) < 1e-9,
    `${what}: ${actual} is not ${expected}`,
  );
}

// D1 ("Deck 1") is the long table in the Court Yard, a six-top: big enough that
// these tests are about the rule under test and never incidentally about seats.
function booking(fields) {
  return {
    tableId: "td1",
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
      tableId: "td1",
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

test("the room is Jenny's four sections: Court Yard, Main, Peacock, Deck", () => {
  assert.deepEqual(
    zones.map((z) => z.name),
    ["Court Yard", "Main", "Peacock", "Deck"],
  );
  // Main and Peacock are inside the house; the other two are open to the sky.
  assert.deepEqual(
    zones.map((z) => z.open),
    [true, false, false, true],
  );
});

test("every table on Jenny's plan is here, once, by her Resos names", () => {
  const labels = tables.map((t) => t.label);
  assert.equal(new Set(labels).size, labels.length, "a table number is used twice");
  assert.deepEqual(
    [...labels].sort(),
    [
      "Peacock", "13", "14", "16", "2", "20", "21", "22", "23", "24", "25", "26",
      "28", "29", "3", "30", "31", "32", "4", "41", "42", "5", "51", "52",
      "53", "6", "Deck 1", "Deck 3", "Deck 5", "Lawn", "Tree 2",
    ].sort(),
  );
});

test("no table overlaps another, a fixture, or leaves its section", () => {
  assert.deepEqual(auditVenue(), []);
});

test("every table sits in the section it claims, and every section has tables", () => {
  for (const table of tables) {
    const zone = zones.find((z) => z.id === table.zone);
    assert.ok(zone, `${table.label} is in unknown zone ${table.zone}`);
    assert.ok(inside([table.x, table.y], zone.outline), `${table.label} is outside ${zone.name}`);
  }
  for (const zone of zones) {
    assert.ok(tables.some((t) => t.zone === zone.id), `${zone.name} has no tables`);
  }
});

test("the levels read as a journey: Deck, up into the house, down to the Court Yard", () => {
  const e = ZONE_ELEVATIONS;
  assert.ok(e.peacock > e.deck, "the café is a step up from the Deck");
  assert.equal(e.main, e.peacock, "Main and Peacock share the house floor");
  assert.ok(e.courtyard < e.main, "the Court Yard is a step down from Main");
  // One step each way, not a storey.
  close(e.peacock - e.deck, RISER, "Deck to Peacock is one riser");
  close(e.main - e.courtyard, RISER, "Main to Court Yard is one riser");
});

test("every table stands on its section's floor, or on the yard's timber platform", () => {
  for (const table of tables) {
    const zone = zones.find((z) => z.id === table.zone);
    const under = floorAt(table.x, table.y);
    const onPlatform = table.zone === "courtyard" && Math.abs(under - (zone.floor + PLATFORM_RISE)) < 1e-9;
    assert.ok(Math.abs(under - zone.floor) < 1e-9 || onPlatform, `${table.label} is on the wrong floor (${under})`);
  }
});

test("each step sits on the lower floor, below the one it leads to", () => {
  for (const step of steps) {
    const under = floorAt(step.x, step.y);
    assert.ok(step.top > under && step.top < under + RISER + 1e-9, `${step.id} is not one tread up`);
  }
});
