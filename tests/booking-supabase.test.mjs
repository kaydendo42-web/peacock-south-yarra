import test from "node:test";
import assert from "node:assert/strict";
import { StoreConflict, supabaseStore } from "../src/booking/server/store.ts";

/**
 * The Supabase store against a stand-in PostgREST. What matters: new bookings
 * insert with the venue and a turnaround-inclusive end, edits PATCH without
 * touching `source`, and the database's double-booking refusal (23P01) comes
 * back as a StoreConflict the API can turn into a 409.
 */

const booking = {
  id: "PK-TEST01",
  tableId: "t14",
  startsAt: "2026-10-01T23:00:00.000Z",
  durationMin: 75,
  partySize: 2,
  guestName: "Test Guest",
  phone: "0400000000",
  email: "guest@example.com",
  status: "confirmed",
};

function fakeFetch(respond) {
  const calls = [];
  const fn = async (url, init = {}) => {
    const call = { url: String(url), method: init.method ?? "GET", body: init.body ? JSON.parse(init.body) : undefined };
    calls.push(call);
    const { status = 200, json = [] } = respond(call);
    return new Response(JSON.stringify(json), { status });
  };
  return { fn, calls };
}

test("a new booking is inserted with its venue, source and turnaround-inclusive end", async (t) => {
  const { fn, calls } = fakeFetch((c) => (c.method === "PATCH" ? { json: [] } : { status: 201, json: {} }));
  t.mock.method(globalThis, "fetch", fn);
  await supabaseStore("https://x.supabase.co", "key", "venue-1", 15).put(booking);

  const insert = calls.find((c) => c.method === "POST");
  assert.ok(insert, "no insert");
  assert.equal(insert.body.venue_id, "venue-1");
  assert.equal(insert.body.source, "website");
  // 75 minutes plus the 15-minute turnaround.
  assert.equal(insert.body.ends_at, "2026-10-02T00:30:00.000Z");
});

test("an edit patches the booking and leaves its source alone", async (t) => {
  const { fn, calls } = fakeFetch((c) => (c.method === "PATCH" ? { json: [{ id: booking.id }] } : { json: {} }));
  t.mock.method(globalThis, "fetch", fn);
  await supabaseStore("https://x.supabase.co", "key", "venue-1", 15).put({ ...booking, status: "seated" });

  assert.equal(calls.length, 1, "an edit should not also insert");
  assert.equal(calls[0].method, "PATCH");
  assert.equal(calls[0].body.status, "seated");
  assert.equal("source" in calls[0].body, false);
  assert.match(calls[0].url, /venue_id=eq\.venue-1/);
});

test("the database refusing a double booking surfaces as StoreConflict", async (t) => {
  const { fn } = fakeFetch((c) =>
    c.method === "PATCH" ? { json: [] } : { status: 409, json: { code: "23P01", message: "conflicting key value" } },
  );
  t.mock.method(globalThis, "fetch", fn);
  await assert.rejects(
    supabaseStore("https://x.supabase.co", "key", "venue-1", 15).put(booking),
    (e) => e instanceof StoreConflict,
  );
});

test("reading the diary maps rows back to bookings, for this venue only", async (t) => {
  const { fn, calls } = fakeFetch(() => ({
    json: [
      {
        id: "PK-A", venue_id: "venue-1", table_id: "t5", starts_at: "2026-10-01T23:00:00+00:00",
        ends_at: "2026-10-02T00:30:00+00:00", duration_min: 75, party_size: 4, guest_name: "A",
        phone: "1", email: "a@example.com", notes: null, status: "confirmed", source: "resos",
      },
    ],
  }));
  t.mock.method(globalThis, "fetch", fn);
  const all = await supabaseStore("https://x.supabase.co", "key", "venue-1", 15).all();
  assert.match(calls[0].url, /venue_id=eq\.venue-1/);
  assert.deepEqual(all, [
    {
      id: "PK-A", tableId: "t5", startsAt: "2026-10-01T23:00:00.000Z", durationMin: 75, partySize: 4,
      guestName: "A", phone: "1", email: "a@example.com", status: "confirmed",
    },
  ]);
});

test("the integration's prefixed variable names are found", async () => {
  const { fromEnv } = await import("../src/booking/server/store.ts");
  const env = {
    BookingStorage_SUPABASE_URL: "https://x.supabase.co",
    NEXT_PUBLIC_BookingStorage_SUPABASE_URL: "https://public.supabase.co",
    BookingStorage_SUPABASE_SERVICE_ROLE_KEY: "secret",
  };
  assert.equal(fromEnv(env, "SUPABASE_URL"), "https://x.supabase.co");
  assert.equal(fromEnv(env, "SUPABASE_SERVICE_ROLE_KEY"), "secret");
  assert.equal(fromEnv({ SUPABASE_URL: "plain", X_SUPABASE_URL: "prefixed" }, "SUPABASE_URL"), "plain");
  assert.equal(fromEnv({}, "SUPABASE_URL"), undefined);
});
