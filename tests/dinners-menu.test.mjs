import test from "node:test";
import assert from "node:assert/strict";
import { cutoffFor, dinners, dishesOn, isOrderable, orderableDates } from "../src/dinners/menu.ts";

/**
 * The $5 dinner rotation and its ordering window: Week 1 from the first
 * Monday, then Week 2, then Week 1 again; weekdays only; orders for a day close
 * at 9pm Melbourne time the evening before; no more than two weeks ahead.
 */

const melbourne = (iso) => new Date(iso); // ISO strings below carry their own offset

test("week 1 starts on the first Monday and week 2 follows", () => {
  assert.equal(dinners.firstMonday, "2026-10-26");
  assert.deepEqual(dishesOn("2026-10-26").map((d) => d.name), ["Mac & cheese", "Beef stew & mash"]);
  assert.deepEqual(dishesOn("2026-11-02").map((d) => d.name), ["Sweet chilli mushroom pasta", "Teriyaki tofu & fried rice"]);
  // and back to week 1
  assert.deepEqual(dishesOn("2026-11-09").map((d) => d.id), ["w1-mon-5", "w1-mon-10"]);
  assert.equal(dishesOn("2026-10-30")[1].name, "Cottage pie");
});

test("no dinners at weekends or before the pop-up starts", () => {
  assert.deepEqual(dishesOn("2026-10-31"), []);
  assert.deepEqual(dishesOn("2026-11-01"), []);
  assert.deepEqual(dishesOn("2026-10-23"), []);
});

test("every day has a $5 and a $10 dish", () => {
  for (const week of dinners.weeks) {
    for (const day of Object.values(week)) {
      assert.deepEqual(day.map((d) => d.priceCents), [500, 1000]);
    }
  }
});

test("orders close at 9pm Melbourne the evening before, across daylight saving", () => {
  // AEDT (+11:00) in late October
  assert.equal(cutoffFor("2026-10-27").toISOString(), "2026-10-26T10:00:00.000Z");
  // Monday's orders close Sunday night
  assert.equal(cutoffFor("2026-11-02").toISOString(), "2026-11-01T10:00:00.000Z");
});

test("a day is orderable until its cutoff and not after", () => {
  assert.equal(isOrderable("2026-10-27", melbourne("2026-10-26T20:59:00+11:00")), true);
  assert.equal(isOrderable("2026-10-27", melbourne("2026-10-26T21:00:00+11:00")), false);
  // same-day pickup is never orderable
  assert.equal(isOrderable("2026-10-27", melbourne("2026-10-27T06:00:00+11:00")), false);
});

test("orders open at most two weeks ahead, weekdays only", () => {
  const dates = orderableDates(melbourne("2026-10-26T12:00:00+11:00"));
  assert.equal(dates[0], "2026-10-27");
  assert.equal(dates.at(-1), "2026-11-09");
  assert.equal(dates.length, 10);
  assert.ok(!dates.includes("2026-10-31"));
});

test("before launch, the first Monday is the first date on offer", () => {
  const dates = orderableDates(melbourne("2026-10-22T12:00:00+11:00"));
  assert.equal(dates[0], "2026-10-26");
});
