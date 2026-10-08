import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { allocate, areaStateAt, optionsFor } from "../src/booking/data/allocate.ts";
import { checkBooking } from "../src/booking/data/rules.ts";
import { sittingFor } from "../src/booking/data/time.ts";
import { areas, combinations, tables } from "../src/booking/data/venue.ts";

// Tuesday 22 September 2026, 10:00 in Melbourne (AEST, UTC+10).
const TEN_AM = new Date("2026-09-22T00:00:00.000Z");
beforeEach((t) => t.mock.timers.enable({ apis: ["Date"], now: new Date("2026-09-21T00:00:00.000Z") }));
const label = (ids) => ids.map((id) => tables.find((t) => t.id === id).label);
const held = (tableId, extra = {}) => ({
  id: `PK-${tableId}`,
  tableId,
  startsAt: TEN_AM.toISOString(),
  durationMin: sittingFor(2),
  partySize: 2,
  guestName: "Held",
  phone: "",
  email: "",
  status: "confirmed",
  ...extra,
});

test("every combination names tables that exist, all in one area", () => {
  for (const c of combinations) {
    const zones = new Set(c.tables.map((id) => tables.find((t) => t.id === id)?.zone));
    assert.ok(!zones.has(undefined), `combination ${c.tables} names a missing table`);
    const area = areas.find((a) => [...zones].every((z) => a.zones.includes(z)));
    assert.ok(area, `combination ${label(c.tables)} spans areas`);
  }
});

test("a pair gets a two-top, Jenny's higher priority first, never a six-top", () => {
  const seat = allocate("inside", TEN_AM, 2, []);
  const t = tables.find((x) => x.id === seat.tableIds[0]);
  assert.equal(seat.tableIds.length, 1);
  assert.equal(t.seats, 2);
  assert.equal(t.priority, 7, "21–24 (priority 7) go before 29 and 30 (priority 2)");
});

test("a group of nine in the Courtyard gets 2 + 3 + 4 joined, as Resos had Monika", () => {
  assert.deepEqual(label(allocate("courtyard", TEN_AM, 9, []).tableIds), ["2", "3", "4"]);
});

test("a group of nine inside gets the tightest joined set", () => {
  assert.deepEqual(label(allocate("inside", TEN_AM, 9, []).tableIds), ["20", "21", "22", "23"]);
});

test("a taken table is passed over for the next best", () => {
  const first = allocate("deck", TEN_AM, 2, []);
  const next = allocate("deck", TEN_AM, 2, [held(first.tableIds[0])]);
  assert.notEqual(next.tableIds[0], first.tableIds[0]);
});

test("a joined set is refused if any one of its tables is held", () => {
  const options = optionsFor("courtyard", 9);
  assert.deepEqual(label(options[0].tableIds), ["2", "3", "4"]);
  assert.equal(allocate("courtyard", TEN_AM, 9, [held("t3")]), null);
  assert.equal(areaStateAt("courtyard", TEN_AM, 9, [held("t3")]), "full");
});

test("an area that can never seat the party says so, rather than 'full'", () => {
  assert.equal(areaStateAt("deck", TEN_AM, 11, []), "too-big", "the Deck's biggest set seats 10");
  assert.equal(areaStateAt("courtyard", TEN_AM, 11, []), "available");
});

test("a booking on joined tables clashes with anyone on any of them", () => {
  const joined = { tableId: "t2", tableIds: ["t2", "t3", "t4"], startsAt: TEN_AM.toISOString(), durationMin: sittingFor(9), partySize: 9 };
  assert.equal(checkBooking(joined, []), null);
  assert.equal(checkBooking(joined, [held("t4")])?.code, "double-booked");
  assert.equal(checkBooking({ ...held("t4"), id: undefined }, [{ ...held("t2"), id: "PK-J", tableIds: ["t2", "t3", "t4"], partySize: 9 }])?.code, "double-booked");
});
