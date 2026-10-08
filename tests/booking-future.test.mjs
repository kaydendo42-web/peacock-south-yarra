import test from "node:test";
import assert from "node:assert/strict";
import { checkBooking } from "../src/booking/data/rules.ts";
import { bookableSlots } from "../src/booking/data/availability.ts";
import { at, timeLabel, todayKey, venueDateKey } from "../src/booking/data/time.ts";

// Thursday 8 October, noon in Melbourne (AEDT, UTC+11).
const NOW = new Date("2026-10-08T01:00:00.000Z");
const booking = (startsAt) => ({ tableId: "td1", startsAt, durationMin: 75, partySize: 2 });
const freeze = (t) => t.mock.timers.enable({ apis: ["Date"], now: NOW });

test("the booking rule refuses earlier days, earlier today and the current instant", (t) => {
  freeze(t);
  for (const start of ["2026-10-07T01:00:00.000Z", "2026-10-08T00:30:00.000Z", NOW.toISOString()]) {
    assert.equal(checkBooking(booking(start), [])?.code, "past", start);
  }
});

test("later today and future days remain bookable", (t) => {
  freeze(t);
  for (const start of ["2026-10-08T01:30:00.000Z", "2026-10-08T23:00:00.000Z"]) {
    assert.equal(checkBooking(booking(start), []), null, start);
  }
});

test("a previously valid selection is refused once its start time arrives", (t) => {
  freeze(t);
  const candidate = booking("2026-10-08T01:30:00.000Z");
  assert.equal(checkBooking(candidate, []), null);
  t.mock.timers.tick(30 * 60_000);
  assert.equal(checkBooking(candidate, [])?.code, "past");
});

test("the guest grid offers only future times today, and none on earlier days", (t) => {
  freeze(t);
  assert.deepEqual(bookableSlots("2026-10-07", 2), []);
  assert.deepEqual(bookableSlots("2026-10-08", 2).map(timeLabel), ["12:30", "13:00", "13:30"]);
  assert.equal(timeLabel(bookableSlots("2026-10-09", 2)[0]), "07:00");
});

test("the grid has no starts left after the last fitting sitting begins", (t) => {
  freeze(t);
  t.mock.timers.setTime(new Date("2026-10-08T02:30:00.000Z").getTime());
  assert.deepEqual(bookableSlots("2026-10-08", 2), []);
  assert.ok(bookableSlots("2026-10-09", 2).length > 0);
});

test("today and slot labels use Melbourne time across the UTC date boundary", (t) => {
  freeze(t);
  t.mock.timers.setTime(new Date("2026-10-07T14:00:00.000Z").getTime());
  assert.equal(todayKey(), "2026-10-08");
  const slot = at("2026-10-08", "07:00");
  assert.equal(slot.toISOString(), "2026-10-07T20:00:00.000Z");
  assert.equal(venueDateKey(slot), "2026-10-08");
  assert.equal(timeLabel(slot), "07:00");
});

test("venue-local slots account for both Melbourne daylight-saving changes", () => {
  for (const [date, expected] of [
    ["2026-04-04", "2026-04-03T21:00:00.000Z"],
    ["2026-04-05", "2026-04-04T22:00:00.000Z"],
    ["2026-10-03", "2026-10-02T22:00:00.000Z"],
    ["2026-10-04", "2026-10-03T21:00:00.000Z"],
  ]) {
    assert.equal(at(date, "08:00").toISOString(), expected, date);
  }
});
