import test from "node:test";
import assert from "node:assert/strict";
import { groupMenuItems } from "../src/lib/menu-display.ts";

test("sizes group by Square identity without conflating similarly named products", () => {
  const groups = groupMenuItems([
    {
      catalogItemId: "latte",
      itemName: "Latte",
      name: "Latte — Reg",
      variationName: "Reg",
      price: "5.00",
    },
    {
      catalogItemId: "latte",
      itemName: "Latte",
      name: "Latte — Large",
      variationName: "Large",
      price: "5.80",
    },
    { catalogItemId: "other", itemName: "Latte", name: "Latte", price: "6.00" },
    { name: "Toast", price: "7.50" },
  ]);
  assert.equal(groups.length, 3);
  assert.equal(groups[0].name, "Latte");
  assert.deepEqual(
    groups[0].variations.map((v) => v.price),
    ["5.00", "5.80"],
  );
  assert.equal(groups[1].variations[0].price, "6.00");
  assert.equal(groups[2].name, "Toast");
});
