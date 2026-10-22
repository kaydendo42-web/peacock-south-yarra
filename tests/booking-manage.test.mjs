import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { handle } from "../src/booking/server/api.ts";
import { fileStore } from "../src/booking/server/store.ts";
import { manageToken, manageSecret, manageUrl, checkToken } from "../src/booking/server/manage.ts";
import { messagesFor } from "../src/booking/server/email.ts";

/**
 * Guests changing or cancelling their own booking from the signed link in
 * their confirmation: only with a valid signature, only until 9pm the night
 * before, and never onto someone else's table.
 */

// Thursday 8 October, noon in Melbourne (AEDT, UTC+11).
const NOW = new Date("2026-10-08T01:00:00.000Z");
const FRI_10AM = "2026-10-08T23:00:00.000Z";
const FRI_1PM = "2026-10-09T02:00:00.000Z";

process.env.BOOKING_MANAGE_SECRET = "test-secret";
const t = (id) => manageToken(id, "test-secret");

function setup(ctx, bookings = [], now = NOW) {
  ctx.mock.timers.enable({ apis: ["Date"], now });
  const store = fileStore(path.join(mkdtempSync(path.join(tmpdir(), "manage-")), "b.json"));
  const sent = [];
  const config = { store, mailer: { send: async (m) => void sent.push(m) } };
  const call = (method, p, { body, query = {} } = {}) =>
    handle({ method, path: p, query, headers: {}, body, ip: "1" }, config);
  return Promise.all(bookings.map((b) => store.put(b))).then(() => ({ call, store, sent }));
}

const mine = {
  id: "PK-MINE22",
  tableId: "td1",
  area: "deck",
  startsAt: FRI_10AM,
  durationMin: 75,
  partySize: 2,
  guestName: "Pat Guest",
  phone: "0400000000",
  email: "pat@example.com",
  status: "confirmed",
};

test("the link is signed per booking", () => {
  assert.equal(checkToken("PK-MINE22", t("PK-MINE22"), "test-secret"), true);
  assert.equal(checkToken("PK-OTHER2", t("PK-MINE22"), "test-secret"), false);
  assert.equal(checkToken("PK-MINE22", "x", "test-secret"), false);
  assert.match(manageUrl("PK-MINE22", process.env), /\/book-a-table\/manage\?ref=PK-MINE22&t=[\w-]{32}$/);
  // falls back to a key derived from the service key, and none at all without one
  assert.ok(manageSecret({ SUPABASE_SERVICE_ROLE_KEY: "k" }));
  assert.equal(manageSecret({}), undefined);
});

test("a guest reads their booking only with the right signature", async (ctx) => {
  const { call } = await setup(ctx, [mine]);
  assert.equal((await call("GET", "/bookings/PK-MINE22", { query: { t: "nope" } })).status, 404);
  assert.equal((await call("GET", "/bookings/PK-NONE22", { query: { t: t("PK-NONE22") } })).status, 404);
  const out = await call("GET", "/bookings/PK-MINE22", { query: { t: t("PK-MINE22") } });
  assert.equal(out.status, 200);
  assert.equal(out.body.booking.guestName, "Pat Guest");
  assert.equal(out.body.canChange, true);
});

test("a guest moves their booking; the venue and guest both hear", async (ctx) => {
  const { call, store, sent } = await setup(ctx, [mine]);
  const out = await call("POST", "/bookings/PK-MINE22/change", {
    body: { t: t("PK-MINE22"), area: "inside", partySize: 4, startsAt: FRI_1PM },
  });
  assert.equal(out.status, 200, JSON.stringify(out.body));
  const saved = (await store.all()).find((b) => b.id === "PK-MINE22");
  assert.equal(saved.startsAt, FRI_1PM);
  assert.equal(saved.partySize, 4);
  assert.equal(saved.area, "inside");
  assert.equal(saved.status, "confirmed");
  assert.deepEqual(sent.map((m) => m.to), ["pat@example.com", "hello@thepeacock.com.au"]);
  assert.match(sent[0].subject, /Booking updated/);
  assert.match(sent[1].text, /Was: Friday 9 October at 10:00 am/);
});

test("a guest can keep their own table at a shifted time", async (ctx) => {
  const { call } = await setup(ctx, [mine]);
  // 15 minutes later overlaps their own current sitting; that mustn't count against them.
  const out = await call("POST", "/bookings/PK-MINE22/change", {
    body: { t: t("PK-MINE22"), area: "deck", partySize: 2, startsAt: "2026-10-08T23:15:00.000Z" },
  });
  assert.equal(out.status, 200, JSON.stringify(out.body));
});

test("a change goes through the same seating rules as a new booking", async (ctx) => {
  const { call } = await setup(ctx, [mine]);
  const out = await call("POST", "/bookings/PK-MINE22/change", {
    body: { t: t("PK-MINE22"), area: "deck", partySize: 12, startsAt: FRI_1PM },
  });
  assert.equal(out.status, 409);
});

test("a guest cancels; the slot frees and nobody can change it after", async (ctx) => {
  const { call, store, sent } = await setup(ctx, [mine]);
  const out = await call("POST", "/bookings/PK-MINE22/cancel", { body: { t: t("PK-MINE22") } });
  assert.equal(out.status, 200);
  assert.equal((await store.all())[0].status, "cancelled");
  assert.match(sent[0].text, /you've cancelled/);
  assert.match(sent[1].subject, /^Booking cancelled/);

  const again = await call("POST", "/bookings/PK-MINE22/change", {
    body: { t: t("PK-MINE22"), area: "deck", partySize: 2, startsAt: FRI_1PM },
  });
  assert.equal(again.body.code, "too-late");
});

test("changes close at 9pm the night before", async (ctx) => {
  const thu9pm = new Date("2026-10-08T10:00:00.000Z");
  const { call } = await setup(ctx, [mine], thu9pm); // booked for Fri 10am
  const out = await call("POST", "/bookings/PK-MINE22/cancel", { body: { t: t("PK-MINE22") } });
  assert.equal(out.body.code, "too-late");
});

test("same-day bookings can't be changed online", async (ctx) => {
  const soon = { ...mine, startsAt: "2026-10-08T02:30:00.000Z" }; // 1:30pm today
  const { call } = await setup(ctx, [soon]);
  const out = await call("POST", "/bookings/PK-MINE22/cancel", { body: { t: t("PK-MINE22") } });
  assert.equal(out.status, 409);
  assert.equal(out.body.code, "too-late");
});

test("the confirmation email carries the manage link", () => {
  const [guest] = messagesFor("created", mine, { BOOKING_MANAGE_SECRET: "test-secret" });
  assert.match(guest.text, /book-a-table\/manage\?ref=PK-MINE22&t=/);
  const [plain] = messagesFor("created", mine, {});
  assert.match(plain.text, /Reply to this email or call us/);
});
