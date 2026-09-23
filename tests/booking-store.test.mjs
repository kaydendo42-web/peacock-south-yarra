import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileStore, kvStore } from "../src/booking/server/store.ts";

/**
 * The store's one job beyond reading and writing: two guests racing for the
 * same table must not both be confirmed. Each test fires a burst of
 * concurrent "book table v1 at 9:00" writers at a store and counts how many
 * got the table.
 */

const booking = (id, extra = {}) => ({
  id,
  tableId: "v1",
  startsAt: "2026-10-01T09:00:00+10:00",
  durationMin: 75,
  partySize: 2,
  guestName: `Guest ${id}`,
  phone: "0400000000",
  email: `${id}@example.com`,
  status: "confirmed",
  ...extra,
});

const pause = () => new Promise((r) => setTimeout(r, Math.random() * 5));

/** The API's shape: read the diary, refuse if the table is taken, write. */
async function race(store, n) {
  const results = await Promise.all(
    Array.from({ length: n }, (_, i) =>
      store.exclusive(async () => {
        const all = await store.all();
        await pause(); // widen the window a missing lock would fall through
        if (all.some((b) => b.tableId === "v1" && b.status === "confirmed")) return false;
        await store.put(booking(`PK-${i}`));
        return true;
      }),
    ),
  );
  return results.filter(Boolean).length;
}

/**
 * Just enough of Upstash's REST API — one command per POST, `{ result }` back —
 * with a random delay on every call so concurrent requests interleave the way
 * they do against the real thing.
 */
function fakeUpstash() {
  const strings = new Map();
  const hashes = new Map();
  const fetch = async (_url, init) => {
    const [cmd, key, ...args] = JSON.parse(init.body);
    await pause();
    let result = null;
    switch (cmd) {
      case "HVALS":
        result = [...(hashes.get(key)?.values() ?? [])];
        break;
      case "HSET":
        if (!hashes.has(key)) hashes.set(key, new Map());
        hashes.get(key).set(args[0], args[1]);
        result = 1;
        break;
      case "SET":
        if (args.includes("NX") && strings.has(key)) result = null;
        else {
          strings.set(key, args[0]);
          result = "OK";
        }
        break;
      case "EVAL": {
        // [script, numkeys, lockKey, holder]
        const [lockKey, holder] = [args[1], args[2]];
        result = strings.get(lockKey) === holder ? (strings.delete(lockKey), 1) : 0;
        break;
      }
      default:
        return new Response(JSON.stringify({ error: `unknown command ${cmd}` }), { status: 400 });
    }
    return new Response(JSON.stringify({ result }), { status: 200 });
  };
  return { fetch, strings, hashes };
}

test("file store: only one of twenty racing guests gets the table", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "peacock-store-"));
  try {
    const store = fileStore(path.join(dir, "bookings.json"));
    assert.equal(await race(store, 20), 1);
    assert.equal((await store.all()).length, 1);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("file store: put replaces one booking and leaves the rest alone", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "peacock-store-"));
  try {
    const store = fileStore(path.join(dir, "bookings.json"));
    await store.put(booking("PK-A"));
    await store.put(booking("PK-B", { tableId: "v2" }));
    await store.put(booking("PK-A", { status: "cancelled" }));
    const all = await store.all();
    assert.equal(all.length, 2);
    assert.equal(all.find((b) => b.id === "PK-A").status, "cancelled");
    assert.equal(all.find((b) => b.id === "PK-B").tableId, "v2");
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("kv store: only one of twenty racing guests gets the table", async (t) => {
  const fake = fakeUpstash();
  t.mock.method(globalThis, "fetch", fake.fetch);
  const store = kvStore("https://fake.upstash.io", "token");
  assert.equal(await race(store, 20), 1);
  assert.equal((await store.all()).length, 1);
  assert.equal(fake.strings.size, 0, "the lock is released afterwards");
});

test("kv store: a failed job still releases the lock", async (t) => {
  const fake = fakeUpstash();
  t.mock.method(globalThis, "fetch", fake.fetch);
  const store = kvStore("https://fake.upstash.io", "token");
  await assert.rejects(store.exclusive(async () => { throw new Error("boom"); }), /boom/);
  assert.equal(fake.strings.size, 0);
  assert.equal(await store.exclusive(async () => "next writer gets in"), "next writer gets in");
});

test("kv store: each booking is its own field, keyed by reference", async (t) => {
  const fake = fakeUpstash();
  t.mock.method(globalThis, "fetch", fake.fetch);
  const store = kvStore("https://fake.upstash.io", "token");
  await store.put(booking("PK-A"));
  await store.put(booking("PK-B"));
  await store.put(booking("PK-A", { status: "seated" }));
  const diary = fake.hashes.get("peacock:diary");
  assert.deepEqual([...diary.keys()].sort(), ["PK-A", "PK-B"]);
  assert.equal(JSON.parse(diary.get("PK-A")).status, "seated");
});

test("kv store: an Upstash error surfaces instead of reading as an empty diary", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    new Response(JSON.stringify({ error: "WRONGPASS invalid token" }), { status: 401 }),
  );
  const store = kvStore("https://fake.upstash.io", "bad");
  await assert.rejects(store.all(), /store unavailable \(401: WRONGPASS/);
});
