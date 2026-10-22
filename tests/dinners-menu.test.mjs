import test from "node:test";
import assert from "node:assert/strict";
import { cancelCutoffFor, cutoffFor, dinners, dishesOn, isOrderable, orderableDates, portionsOf } from "../src/dinners/menu.ts";

/**
 * The $5 dinner rotation and its ordering window: November 2026 only, Week 1
 * from Monday 2 November, then Week 2, then Week 1 again; weekdays only, not
 * Melbourne Cup day; orders for a day close at 9pm Melbourne time the evening
 * before; no more than two weeks ahead.
 */

const melbourne = (iso) => new Date(iso); // ISO strings below carry their own offset

test("four weeks from Monday 2 November, matching Jenny's menu", () => {
  assert.equal(dinners.firstMonday, "2026-11-02");
  assert.deepEqual(dishesOn("2026-11-02").map((d) => d.name), ["Mac & cheese", "Beef stew & mash potato"]);
  assert.deepEqual(dishesOn("2026-11-09").map((d) => d.name), ["Sweet chilli mushroom pasta", "Teriyaki tofu & fried rice"]);
  assert.deepEqual(dishesOn("2026-11-18").map((d) => d.name), ["Mac & cheese", "Lemon rice pilaf & garlic chicken"]);
  assert.deepEqual(dishesOn("2026-11-27").map((d) => d.name), ["Vodka pasta", "Beef stroganoff"]);
  assert.equal(dishesOn("2026-11-06")[1].name, "Cottage pie");
});

test("parmesan is offered on the dishes Jenny marked", () => {
  assert.equal(dishesOn("2026-11-04")[0].addOn?.priceCents, 100); // pesto pasta
  assert.equal(dishesOn("2026-11-04")[1].addOn, undefined); // vege chilli (df)
  assert.equal(dishesOn("2026-11-25")[1].addOn?.id, "parmesan"); // marry me chicken
  assert.equal(dishesOn("2026-11-02")[0].addOn, undefined); // mac & cheese
});

test("no dinners at weekends, on Melbourne Cup day, or outside November", () => {
  assert.deepEqual(dishesOn("2026-11-07"), []);
  assert.deepEqual(dishesOn("2026-11-08"), []);
  assert.deepEqual(dishesOn("2026-11-03"), []);
  assert.deepEqual(dishesOn("2026-10-30"), []);
  assert.equal(dishesOn("2026-11-27").length, 2);
  assert.deepEqual(dishesOn("2026-11-30"), []);
});

test("$5 dishes sell 50 a day and $10 dishes 100", () => {
  assert.deepEqual(dishesOn("2026-11-02").map(portionsOf), [50, 100]);
});

test("guests can cancel until 7am the day before pickup", () => {
  assert.equal(cancelCutoffFor("2026-11-04").toISOString(), "2026-11-02T20:00:00.000Z");
});

test("every day has a $5 and a $10 dish", () => {
  for (const week of dinners.weeks) {
    for (const day of Object.values(week)) {
      if (day.length) assert.deepEqual(day.map((d) => d.priceCents), [500, 1000]);
    }
  }
});

test("orders close at 9pm Melbourne the evening before", () => {
  // AEDT (+11:00)
  assert.equal(cutoffFor("2026-11-05").toISOString(), "2026-11-04T10:00:00.000Z");
  // Monday's orders close Sunday night
  assert.equal(cutoffFor("2026-11-02").toISOString(), "2026-11-01T10:00:00.000Z");
});

test("a day is orderable until its cutoff and not after", () => {
  assert.equal(isOrderable("2026-11-05", melbourne("2026-11-04T20:59:00+11:00")), true);
  assert.equal(isOrderable("2026-11-05", melbourne("2026-11-04T21:00:00+11:00")), false);
  // same-day pickup is never orderable
  assert.equal(isOrderable("2026-11-05", melbourne("2026-11-05T06:00:00+11:00")), false);
});

test("orders open at most two weeks ahead, weekdays only", () => {
  const dates = orderableDates(melbourne("2026-11-02T12:00:00+11:00"));
  assert.equal(dates[0], "2026-11-04"); // Tuesday 3rd is Cup day
  assert.equal(dates.at(-1), "2026-11-16");
  assert.equal(dates.length, 9);
  assert.ok(!dates.includes("2026-11-07"));
});

test("before launch, the first Monday is the first date on offer", () => {
  const dates = orderableDates(melbourne("2026-10-22T12:00:00+11:00"));
  assert.equal(dates[0], "2026-11-02");
});

test("nothing is on sale after the last day", () => {
  assert.deepEqual(orderableDates(melbourne("2026-11-26T21:00:00+11:00")), []);
});
