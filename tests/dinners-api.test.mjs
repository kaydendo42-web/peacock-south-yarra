import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { createHmac } from "node:crypto";
import { handleDinners } from "../src/dinners/server/api.ts";
import { fileStore } from "../src/dinners/server/store.ts";
import { e164 } from "../src/dinners/server/square.ts";
import { dinnerToken } from "../src/dinners/server/cancel.ts";

/**
 * The $5 dinners API against a JSON-file store and a stand-in Square: the caps
 * (50 of a $5 dish a day, 100 of a $10), parmesan add-ons, the 9pm cutoff, a hold that lapses,
 * payment confirmed once (and receipted once) however many times Square tells
 * us, the guest cancelling for a refund, and the 9pm pickup list.
 *
 * Guests never see more than 10 left: how many Jenny makes isn't public.
 */

const TUE = "2026-11-04"; // named for the old fixture; week 1 Wednesday: Pesto pasta ($5, + parmesan), Vege chilli ($10)
const MON_NOON = new Date("2026-11-02T12:00:00+11:00");

function setup({ now = MON_NOON, paid = false } = {}) {
  const store = fileStore(path.join(mkdtempSync(path.join(tmpdir(), "dinners-")), "orders.json"));
  const sent = [];
  const closed = [];
  const refunds = [];
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
    refund: async (sq, cents, id) => {
      refunds.push([sq, cents]);
      return `R-${id}`;
    },
  };
  const clock = { now };
  const config = {
    store,
    payments: square,
    mailer: { send: async (m) => void sent.push(m) },
    env: {
      CRON_SECRET: "cron",
      SQUARE_WEBHOOK_SIGNATURE_KEY: "sig",
      CONTACT_TO_EMAIL: "jenny@example.com",
      BOOKING_MANAGE_SECRET: "secret",
    },
    now: () => clock.now,
  };
  const call = (method, p, body, extra = {}) =>
    handleDinners(
      { method, path: p, query: extra.query ?? {}, headers: extra.headers ?? {}, body, ip: "1", origin: "https://site", rawBody: extra.rawBody },
      config,
    );
  return { call, store, sent, closed, refunds, square, clock, config };
}

const order = (items, extra = {}) => ({
  date: TUE,
  items,
  name: "Pat Guest",
  phone: "0400 000 000",
  email: "pat@example.com",
  ...extra,
});

test("availability lists open days, showing at most 10 left of a dish", async () => {
  const { call } = setup();
  const out = await call("GET", "/availability");
  assert.equal(out.status, 200);
  assert.equal(out.body.ordering, true);
  const tue = out.body.days.find((d) => d.date === TUE);
  assert.deepEqual(tue.dishes.map((d) => [d.name, d.priceCents, d.left]), [
    ["Pesto pasta", 500, 10],
    ["Vege chilli con carne & baked potato", 1000, 10],
  ]);
});

test("an order holds portions and returns Square's checkout", async () => {
  const { call } = setup();
  for (let i = 0; i < 4; i++) await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 10 }]));
  const out = await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 3 }, { dishId: "w1-wed-10", quantity: 1 }]));
  assert.equal(out.status, 201);
  assert.match(out.body.id, /^DN-[A-Z2-9]{8}$/);
  assert.equal(out.body.checkoutUrl, `https://square.link/${out.body.id}`);

  const tue = (await call("GET", "/availability")).body.days.find((d) => d.date === TUE);
  assert.deepEqual(tue.dishes.map((d) => d.left), [7, 10]);
});

test("a $5 dish sells out at 50, and the order that would pass it is refused whole", async () => {
  const { call } = setup();
  for (const quantity of [10, 10, 10, 10, 5]) {
    assert.equal((await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity }]))).status, 201);
  }
  const refused = await call("POST", "/orders", order([{ dishId: "w1-wed-10", quantity: 1 }, { dishId: "w1-wed-5", quantity: 10 }]));
  assert.equal(refused.status, 409);
  assert.equal(refused.body.code, "sold-out");
  assert.equal(refused.body.left, 5);
  assert.match(refused.body.error, /Only 5 Pesto pasta left/);

  // nothing of the refused order was held
  const tue = (await call("GET", "/availability")).body.days.find((d) => d.date === TUE);
  assert.deepEqual(tue.dishes.map((d) => d.left), [5, 10]);

  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 5 }]))).status, 201);
  const gone = await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 1 }]));
  assert.match(gone.body.error, /Pesto pasta has sold out/);
});

test("concurrent orders can't oversell", async () => {
  const { call } = setup();
  const results = await Promise.all(
    Array.from({ length: 11 }, () => call("POST", "/orders", order([{ dishId: "w1-wed-10", quantity: 10 }]))),
  );
  assert.equal(results.filter((r) => r.status === 201).length, 10); // 100 of 100
});

test("orders close at 9pm the night before", async () => {
  const { call } = setup({ now: new Date("2026-11-03T21:00:00+11:00") });
  const out = await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 1 }]));
  assert.equal(out.status, 409);
  assert.equal(out.body.code, "closed");
});

test("parmesan rides on its dish: at most one per portion, never capped", async () => {
  const { call, store } = setup();
  const out = await call(
    "POST",
    "/orders",
    order([
      { dishId: "w1-wed-5", quantity: 2 },
      { dishId: "w1-wed-5+parmesan", quantity: 1 },
    ]),
  );
  assert.equal(out.status, 201);
  const saved = await store.get(out.body.id);
  assert.equal(saved.totalCents, 1100);
  assert.deepEqual(saved.lines[1], { dishId: "w1-wed-5+parmesan", dishName: "Parmesan on Pesto pasta", priceCents: 100, quantity: 1 });

  const tooMany = order([{ dishId: "w1-wed-5", quantity: 1 }, { dishId: "w1-wed-5+parmesan", quantity: 2 }]);
  assert.equal((await call("POST", "/orders", tooMany)).status, 400);
  // the vege chilli has no parmesan
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-wed-10", quantity: 1 }, { dishId: "w1-wed-10+parmesan", quantity: 1 }]))).status, 400);
});

test("bad orders are refused", async () => {
  const { call } = setup();
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 11 }]))).body.code, "too-many");
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-thu-5", quantity: 1 }]))).status, 400);
  assert.equal((await call("POST", "/orders", order([]))).status, 400);
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 1 }], { email: "nope" }))).status, 400);
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 1.5 }]))).status, 400);
});

test("without Square, the menu shows but ordering is off", async () => {
  const { call, config } = setup();
  config.payments = null;
  assert.equal((await call("GET", "/availability")).body.ordering, false);
  assert.equal((await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 1 }]))).status, 503);
});

test("an unpaid hold lapses: its portions return and its checkout is closed", async () => {
  const { call, clock, closed, store } = setup();
  const { body } = await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 5 }]));
  clock.now = new Date(MON_NOON.getTime() + 21 * 60_000);
  const tue = (await call("GET", "/availability")).body.days.find((d) => d.date === TUE);
  assert.equal(tue.dishes[0].left, 10);
  assert.deepEqual(closed, [`L-${body.id}`]);
  assert.equal((await store.get(body.id)).status, "expired");
});

test("returning from Square confirms payment and sends one receipt", async () => {
  const { call, square, sent } = setup();
  const { body } = await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 2 }]));
  assert.equal((await call("GET", `/orders/${body.id}`)).body.status, "pending");

  square.paid.add(`SQ-${body.id}`);
  const back = await call("GET", `/orders/${body.id}`);
  assert.equal(back.body.status, "paid");
  assert.equal(back.body.totalCents, 1000);
  assert.equal("email" in back.body, false);
  await call("GET", `/orders/${body.id}`);

  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "pat@example.com");
  assert.match(sent[0].text, /2 × Pesto pasta/);
  assert.match(sent[0].text, new RegExp(`/dinners/thanks\\?order=${body.id}&t=`));
});

test("Square's webhook confirms payment, only when signed", async () => {
  const { call, square, sent, store } = setup();
  const { body } = await call("POST", "/orders", order([{ dishId: "w1-wed-10", quantity: 1 }]));
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
  const a = (await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 2 }]))).body;
  await call("POST", "/orders", order([{ dishId: "w1-wed-10", quantity: 1 }], { name: "Unpaid" }));
  square.paid.add(`SQ-${a.id}`);
  await call("GET", `/orders/${a.id}`);
  sent.length = 0;

  clock.now = new Date("2026-11-03T20:05:00+11:00");
  assert.equal((await call("GET", "/digest", undefined, { headers: { authorization: "Bearer cron" } })).body.sent, false);
  assert.equal((await call("GET", "/digest", undefined, { headers: { authorization: "Bearer nope" } })).status, 401);

  clock.now = new Date("2026-11-03T21:05:00+11:00");
  const out = await call("GET", "/digest", undefined, { headers: { authorization: "Bearer cron" } });
  assert.deepEqual(out.body, { sent: true, date: TUE, orders: 1 });
  assert.equal(sent[0].to, "jenny@example.com");
  assert.match(sent[0].subject, /2 portions, 1 order/);
  assert.doesNotMatch(sent[0].text, /Unpaid/);
});

test("the guest cancels with their signed link, is refunded once, and the portions return", async () => {
  const { call, square, sent, refunds, store } = setup();
  const { body } = await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 10 }]));
  square.paid.add(`SQ-${body.id}`);
  const t = dinnerToken(body.id, "secret");

  // without the link, no cancel option and no cancel
  assert.equal("canCancel" in (await call("GET", `/orders/${body.id}`)).body, false);
  assert.equal((await call("POST", `/orders/${body.id}/cancel`, { t: "nope" })).status, 404);

  const seen = await call("GET", `/orders/${body.id}`, undefined, { query: { t } });
  assert.equal(seen.body.canCancel, true);
  sent.length = 0;

  const out = await call("POST", `/orders/${body.id}/cancel`, { t });
  assert.equal(out.status, 200);
  assert.equal(out.body.status, "cancelled");
  assert.equal(out.body.refunded, true);
  assert.deepEqual(refunds, [[`SQ-${body.id}`, 5000]]);
  assert.equal((await store.get(body.id)).squareRefundId, `R-${body.id}`);
  assert.match(sent[0].subject, /^Cancelled/);

  // a second click changes nothing
  assert.equal((await call("POST", `/orders/${body.id}/cancel`, { t })).status, 200);
  assert.equal(refunds.length, 1);
  assert.equal(sent.length, 1);

  const sold = await store.sold(TUE, TUE);
  assert.equal(sold.get(`${TUE}|w1-wed-5`) ?? 0, 0);
});

test("cancelling closes 24 hours before pickup, and unpaid orders can't be cancelled", async () => {
  const { call, square, clock, refunds } = setup();
  const unpaid = (await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 1 }]))).body;
  assert.equal(
    (await call("POST", `/orders/${unpaid.id}/cancel`, { t: dinnerToken(unpaid.id, "secret") })).body.code,
    "too-late",
  );

  const { body } = await call("POST", "/orders", order([{ dishId: "w1-wed-5", quantity: 1 }]));
  square.paid.add(`SQ-${body.id}`);
  await call("GET", `/orders/${body.id}`);
  clock.now = new Date("2026-11-03T07:00:00+11:00"); // 24 hours before Wednesday 7am
  const late = await call("POST", `/orders/${body.id}/cancel`, { t: dinnerToken(body.id, "secret") });
  assert.equal(late.status, 409);
  assert.equal(late.body.code, "too-late");
  assert.equal(refunds.length, 0);
});

test("Australian phone numbers go to Square in E.164", () => {
  assert.equal(e164("0400 123 456"), "+61400123456");
  assert.equal(e164("(03) 8596 2342"), "+61385962342");
  assert.equal(e164("+61 400 123 456"), "+61400123456");
  assert.equal(e164("123"), undefined);
});
