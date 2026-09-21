import test from "node:test";
import assert from "node:assert/strict";
import { catalogToMenu, readSquareMenu } from "../src/lib/square-catalog.ts";

const category = {
  type: "CATEGORY",
  id: "coffee",
  category_data: { name: "Coffee" },
};
function item(extra = {}, variation = {}) {
  return {
    type: "ITEM",
    id: "latte",
    present_at_all_locations: true,
    item_data: {
      name: "Latte",
      categories: [{ id: "coffee" }],
      variations: [
        {
          id: "regular",
          item_variation_data: {
            name: "Regular",
            pricing_type: "FIXED_PRICING",
            price_money: { amount: 550, currency: "AUD" },
            ...variation,
          },
        },
      ],
      ...extra,
    },
  };
}
test("prices use AUD cents and per-location overrides", () => {
  const menu = catalogToMenu(
    [
      category,
      item(
        {},
        {
          location_overrides: [
            {
              location_id: "cafe",
              price_money: { amount: 620, currency: "AUD" },
            },
          ],
        },
      ),
    ],
    "cafe",
  );
  assert.equal(menu[0].id, "drinks");
  assert.equal(menu[0].sections[0].items[0].price, "6.20");
});
test("archived, deleted, wrong-location, hidden and excluded-category items stay out", () => {
  for (const row of [
    item({ is_archived: true }),
    { ...item(), is_deleted: true },
    { ...item(), absent_at_location_ids: ["cafe"] },
    {
      ...item(),
      present_at_all_locations: false,
      present_at_location_ids: ["other"],
    },
    item({ ecom_visibility: "HIDDEN" }),
  ])
    assert.deepEqual(catalogToMenu([category, row], "cafe"), []);
  assert.deepEqual(catalogToMenu([category, item()], "cafe", ["food"]), []);
});
test("variable prices do not inherit an old fixed amount; zero AUD remains valid", () => {
  const variable = catalogToMenu(
    [
      category,
      item(
        {},
        {
          location_overrides: [
            { location_id: "cafe", pricing_type: "VARIABLE_PRICING" },
          ],
        },
      ),
    ],
    "cafe",
  );
  assert.equal(variable[0].sections[0].items[0].price, undefined);
  const zero = catalogToMenu(
    [category, item({}, { price_money: { amount: 0, currency: "AUD" } })],
    "cafe",
  );
  assert.equal(zero[0].sections[0].items[0].price, "0.00");
});
test("non-AUD prices and sold-out variations are not published", () => {
  assert.deepEqual(
    catalogToMenu(
      [category, item({}, { price_money: { amount: 550, currency: "USD" } })],
      "cafe",
    ),
    [],
  );
  assert.deepEqual(
    catalogToMenu(
      [
        category,
        item(
          {},
          { location_overrides: [{ location_id: "cafe", sold_out: true }] },
        ),
      ],
      "cafe",
    ),
    [],
  );
});
test("each size retains its name and price", () => {
  const row = item({
    variations: [
      {
        id: "small",
        item_variation_data: {
          name: "Small",
          price_money: { amount: 500, currency: "AUD" },
        },
      },
      {
        id: "large",
        item_variation_data: {
          name: "Large",
          price_money: { amount: 650, currency: "AUD" },
        },
      },
    ],
  });
  assert.deepEqual(
    catalogToMenu([category, row], "cafe")[0].sections[0].items.map((i) => [
      i.name,
      i.price,
    ]),
    [
      ["Latte — Small", "5.00"],
      ["Latte — Large", "6.50"],
    ],
  );
});
const response = (payload, status = 200) =>
  new Response(JSON.stringify(payload), { status });
test("retrieves every catalog page and never sends credentials in a URL", async () => {
  const calls = [];
  const request = async (url, options) => {
    calls.push(url);
    assert.equal(options.headers.Authorization, "Bearer test-token");
    assert.ok(!url.includes("test-token"));
    if (url.endsWith("/locations"))
      return response({
        locations: [{ id: "cafe", status: "ACTIVE", currency: "AUD" }],
      });
    return response(
      url.includes("cursor=next")
        ? { objects: [item()] }
        : { objects: [category], cursor: "next" },
    );
  };
  const menu = await readSquareMenu({ token: "test-token" }, request);
  assert.equal(calls.length, 3);
  assert.equal(menu[0].sections[0].items[0].price, "5.50");
});
test("multiple active locations require an explicit choice", async () => {
  await assert.rejects(
    readSquareMenu({ token: "test-token" }, async () =>
      response({
        locations: [
          { id: "one", status: "ACTIVE", currency: "AUD" },
          { id: "two", status: "ACTIVE", currency: "AUD" },
        ],
      }),
    ),
    /SQUARE_LOCATION_ID/,
  );
});
test("API errors and broken pagination fail rather than returning a partial menu", async () => {
  await assert.rejects(
    readSquareMenu({ token: "test-token" }, async () => response({}, 401)),
    /HTTP 401/,
  );
  await assert.rejects(
    readSquareMenu({ token: "test-token" }, async (url) =>
      url.endsWith("/locations")
        ? response({
            locations: [{ id: "cafe", status: "ACTIVE", currency: "AUD" }],
          })
        : response({ objects: [item()], cursor: "repeat" }),
    ),
    /repeated pagination/,
  );
});

test("catalog images attach to the correct item and retain variation identity", () => {
  const photo = {
    type: "IMAGE",
    id: "photo",
    image_data: {
      url: "https://items-images-production.s3.us-west-2.amazonaws.com/files/latte.jpg",
    },
  };
  const row = catalogToMenu(
    [category, photo, item({ image_ids: ["photo"] })],
    "cafe",
  )[0].sections[0].items[0];
  assert.equal(row.image, photo.image_data.url);
  assert.equal(row.catalogItemId, "latte");
  assert.equal(row.itemName, "Latte");
  assert.equal(row.variationName, "Regular");
});

test("reviewed non-food image exclusions suppress only the incorrect image", () => {
  const photos = [
    {
      type: "IMAGE",
      id: "wrong",
      image_data: {
        url: "https://items-images-production.s3.us-west-2.amazonaws.com/files/person.jpeg",
      },
    },
    {
      type: "IMAGE",
      id: "food-photo",
      image_data: {
        url: "https://items-images-production.s3.us-west-2.amazonaws.com/files/food.jpeg",
      },
    },
  ];
  const row = catalogToMenu(
    [category, ...photos, item({ image_ids: ["wrong", "food-photo"] })],
    "cafe",
    [],
    ["wrong"],
  )[0].sections[0].items[0];
  assert.equal(
    row.image,
    "https://items-images-production.s3.us-west-2.amazonaws.com/files/food.jpeg",
  );
});

test("deleted images and unsafe image URLs are never rendered", () => {
  for (const photo of [
    {
      type: "IMAGE",
      id: "photo",
      is_deleted: true,
      image_data: {
        url: "https://items-images-production.s3.us-west-2.amazonaws.com/files/latte.jpg",
      },
    },
    {
      type: "IMAGE",
      id: "photo",
      image_data: { url: "http://localhost/private" },
    },
  ]) {
    const row = catalogToMenu(
      [category, photo, item({ image_ids: ["photo"] })],
      "cafe",
    )[0].sections[0].items[0];
    assert.equal(row.image, undefined);
  }
});

test("image objects are requested with the catalog, including later pages", async () => {
  const menu = await readSquareMenu(
    { token: "test-token", locationId: "cafe" },
    async (url) => {
      if (url.endsWith("/locations"))
        return response({
          locations: [{ id: "cafe", status: "ACTIVE", currency: "AUD" }],
        });
      const types = new URL(url).searchParams.get("types");
      return response({
        objects: [
          category,
          item({ image_ids: ["photo"] }),
          ...(types.includes("IMAGE")
            ? [
                {
                  type: "IMAGE",
                  id: "photo",
                  image_data: {
                    url: "https://items-images-production.s3.us-west-2.amazonaws.com/files/latte.jpg",
                  },
                },
              ]
            : []),
        ],
      });
    },
  );
  assert.equal(
    menu[0].sections[0].items[0].image,
    "https://items-images-production.s3.us-west-2.amazonaws.com/files/latte.jpg",
  );
});
