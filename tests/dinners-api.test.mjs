import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHmac } from "node:crypto";
import { handleDinners } from "../src/dinners/server/api.ts";
import { fileStore } from "../src/dinners/server/store.ts";
import { e164 } from "../src/dinners/server/square.ts";

/**
 * The $5 dinners API against a JSON-file store and a stand-in Square: the cap
 * of 50 a dish a day, the 9pm cutoff, a hold that lapses, payment confirmed
 * once (and receipted once) however many times Square tells us, and the 9pm
 * pickup list.
 */

const TUE = "2026-10-27"; // week 1 Tuesday: Spag bol ($5), Butter chicken ($10)
const MON_NOON = new Date("2026-10-26T12:00:00+11:00");

function setup({ now = MON_NOON, paid = false } = {}) {
  const store = fileStore(path.join(mkdtempSync(path.join(tmpdir(), "dinners-")), "orders.json"));
  const sent = [];
  const closed = [];
  const square = {
    paid: new Set(),
    createCheckout: async (order, redirect) => ({
      linkId: `L-${order.id}`,
      url: `https://square.link/${order.id}`,
      squareOrderId: `SQ-${order.id}`,
      redirect,
    }),
    isPaid: async (id) => paid || square.paid.has(id),
    closeCheckout: async (id) => void closed.push(id),
  };
  const clock = { now };
  const config = {
    store,
    payments: square,
    mailer: { send: async (m) => void sent.push(m) },
    env: { CRON_SECRET: "cron", SQUARE_WEBHOOK_SIGNATURE_KEY: "sig", CONTACT_TO_EMAIL: "jenny@example.com" },
    now: () => clock.now,
  };
  const call = (method, p, body, extra = {}) =>
    handleDinners(
      { method, path: p, query: extra.query ?? {}, headers: extra.headers ?? {}, body, ip: "1", origin: "https://site", rawBody: extra.rawBody },
      config,
    );
  return { call, store, sent, closed, square, clock, config };
}

const order = (items, extra = {}) => ({
  date: TUE,
  items,
  name: "Pat Guest",
  phone: "0400 000 000",
  email: "pat@example.com",
  ...extra,
});

test("availability lists open days with 50 portions of each dish", async () => {
  const { call } = setup();
  const out = await call("GET", "/availability");
  assert.equal(out.status, 200);
  assert.equal(out.body.ordering, true);
  const tue = out.body.days.find((d) => d.date === TUE);
  assert.deepEqual(tue.dishes.map((d) => [d.name, d.priceCents, d.left]), [
    ["Spag bol", 500, 50],
    ["Butter chicken & rice", 1000, 50],
  ]);
});

test("an order holds portions and returns Square's checkout", async () => {
  const { call } = setup();
  const out = await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 3 }, { dishId: "w1-tue-10", quantity: 1 }]));
  assert.equal(out.status, 201);
  assert.match(out.body.id, /^DN-[A-Z2-9]{8}$/);
  assert.equal(out.body.checkoutUrl, `https://square.link/${out.body.id}`);

  const tue = (await call("GET", "/availability")).body.days.find((d) => d.date === TUE);
  assert.deepEqual(tue.dishes.map((d) => d.left), [47, 49]);
});

test("a dish sells out at 50, and the order that would pass it is refused whole", async () => {
  const { call } = setup();
  for (const quantity of [10, 10, 10, 10, 5]) {
    assert.equal((await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity }]))).status, 201);
  }
  const refused = await call("POST", "/orders", order([{ dishId: "w1-tue-10", quantity: 1 }, { dishId: "w1-tue-5", quantity: 10 }]));
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, "sold-out");
  assert.equal(refused.body.left, 5);
  assert.match(refused.body.error, /Only 5 Spag bol left/);

  // nothing of the refused order was held
  const tue = (await call("GET", "/availability")).body.days.find((d) => d.date === TUE);
  assert.deepEqual(tue.dishes.map((d) => d.left), [5, 50]);

  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 5 }]))).status, 201);
  const gone = await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 1 }]));
  assert.match(gone.body.error, /Spag bol has sold out/);
});

test("concurrent orders can't oversell", async () => {
  const { call } = setup();
  const results = await Promise.all(
    Array.from({ length: 8 }, () => call("POST", "/orders", order([{ dishId: "w1-tue-10", quantity: 7 }]))),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 7); // 49 of 50
});

test("orders close at 9pm the night before", async () => {
  const { call } = setup({ now: new Date("2026-10-26T21:00:00+11:00") });
  const out = await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 1 }]));
  assert.equal(out.status, 409);
  assert.equal(out.body.code, "closed");
});

test("bad orders are refused", async () => {
  const { call } = setup();
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 11 }]))).body.code, "too-many");
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-mon-5", quantity: 1 }]))).status, 400);
  assert.equal((await call("POST", "/orders", order([]))).status, 400);
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 1 }], { email: "nope" }))).status, 400);
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 1.5 }]))).status, 400);
});

test("without Square, the menu shows but ordering is off", async () => {
  const { call, config } = setup();
  config.payments = null;
  assert.equal((await call("GET", "/availability")).body.ordering, false);
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 1 }]))).status, 503);
});

test("an unpaid hold lapses: its portions return and its checkout is closed", async () => {
  const { call, clock, closed, store } = setup();
  const { body } = await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 5 }]));
  clock.now = new Date(MON_NOON.getTime() + 21 * 60_000);
  const tue = (await call("GET", "/availability")).body.days.find((d) => d.date === TUE);
  assert.equal(tue.dishes[0].left, 50);
  assert.deepEqual(closed, [`L-${body.id}`]);
  assert.equal((await store.get(body.id)).status, "expired");
});

test("returning from Square confirms payment and sends one receipt", async () => {
  const { call, square, sent } = setup();
  const { body } = await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 2 }]));
  assert.equal((await call("GET", `/orders/${body.id}`)).body.status, "pending");

  square.paid.add(`SQ-${body.id}`);
  const back = await call("GET", `/orders/${body.id}`);
  assert.equal(back.body.status, "paid");
  assert.equal(back.body.totalCents, 1000);
  assert.equal("email" in back.body, false);
  await call("GET", `/orders/${body.id}`);

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "pat@example.com");
  assert.match(sent[0].text, /2 × Spag bol/);
});

test("Square's webhook confirms payment, only when signed", async () => {
  const { call, square, sent, store } = setup();
  const { body } = await call("POST", "/orders", order([{ dishId: "w1-tue-10", quantity: 1 }]));
  square.paid.add(`SQ-${body.id}`);
  const event = { type: "payment.updated", data: { object: { payment: { order_id: `SQ-${body.id}`, status: "COMPLETED" } } } };
  const raw = JSON.stringify(event);
  const sig = createHmac("sha256", "sig").update("https://site/api/dinners/webhook" + raw).digest("base64");

  const forged = await call("POST", "/webhook", event, { rawBody: raw, headers: { "x-square-hmacsha256-signature": "AAAA" } });
  assert.equal(forged.status, 401);
  assert.equal((await store.get(body.id)).status, "pending");

  const real = await call("POST", "/webhook", event, { rawBody: raw, headers: { "x-square-hmacsha256-signature": sig } });
  assert.equal(real.status, 200);
  assert.equal((await store.get(body.id)).status, "paid");
  await call("GET", `/orders/${body.id}`);
  assert.equal(sent.length, 1);
});

test("the 9pm list goes to the café with tomorrow's paid orders only", async () => {
  const { call, square, sent, clock } = setup();
  const a = (await call("POST", "/orders", order([{ dishId: "w1-tue-5", quantity: 2 }]))).body;
  await call("POST", "/orders", order([{ dishId: "w1-tue-10", quantity: 1 }], { name: "Unpaid" }));
  square.paid.add(`SQ-${a.id}`);
  await call("GET", `/orders/${a.id}`);
  sent.length = 0;

  clock.now = new Date("2026-10-26T20:05:00+11:00");
  assert.equal((await call("GET", "/digest", undefined, { headers: { authorization: "Bearer cron" } })).body.sent, false);
  assert.equal((await call("GET", "/digest", undefined, { headers: { authorization: "Bearer nope" } })).status, 401);

  clock.now = new Date("2026-10-26T21:05:00+11:00");
  const out = await call("GET", "/digest", undefined, { headers: { authorization: "Bearer cron" } });
  assert.deepEqual(out.body, { sent: true, date: TUE, orders: 1 });
  assert.equal(sent[0].to, "jenny@example.com");
  assert.match(sent[0].subject, /2 portions, 1 order/);
  assert.doesNotMatch(sent[0].text, /Unpaid/);
});

test("Australian phone numbers go to Square in E.164", () => {
  assert.equal(e164("0400 123 456"), "+61400123456");
  assert.equal(e164("(03) 8596 2342"), "+61385962342");
  assert.equal(e164("+61 400 123 456"), "+61400123456");
  assert.equal(e164("123"), undefined);
});
