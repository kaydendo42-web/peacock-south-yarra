/**
 * Exercise the real booking store before trusting it with real bookings.
 *
 *   npm run store:check
 *
 * Needs KV_REST_API_URL and KV_REST_API_TOKEN in .env.local, copied from the
 * database's page in the Vercel Storage tab (they are sensitive, so
 * `vercel env pull` leaves them out).
 *
 * Works under its own `peacock-selftest` prefix, so it never reads or touches
 * the live diary, and deletes what it wrote when it is done.
 */
import nextEnv from "@next/env";
import { kvStore } from "../src/booking/server/store.ts";

nextEnv.loadEnvConfig(process.cwd());
const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;

if (!url?.startsWith("https://") || !token || token === "[SENSITIVE]") {
  console.log(
    "No usable store credentials. Vercel stores the Upstash keys as sensitive, so\n" +
      "`vercel env pull` cannot download them. Copy KV_REST_API_URL and\n" +
      "KV_REST_API_TOKEN from the database's page in the Vercel Storage tab\n" +
      "(Show secret) into .env.local, then run npm run store:check again.",
  );
  process.exit(1);
}

const prefix = "peacock-selftest";
const store = kvStore(url, token, prefix);
const booking = (id) => ({
  id,
  tableId: "v1",
  startsAt: "2026-10-01T09:00:00+10:00",
  durationMin: 75,
  partySize: 2,
  guestName: "Self test",
  phone: "0400000000",
  email: "selftest@example.com",
  status: "confirmed",
});

const cleanup = () =>
  fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(["DEL", `${prefix}:diary`, `${prefix}:diary:lock`]),
  });

try {
  await cleanup();

  await store.put(booking("PK-SELF1"));
  const read = await store.all();
  if (read.length !== 1 || read[0].id !== "PK-SELF1") throw new Error("wrote one booking, read back something else");
  console.log("✓ write and read back");

  const winners = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      store.exclusive(async () => {
        const all = await store.all();
        if (all.some((b) => b.id.startsWith("PK-RACE"))) return false;
        await store.put(booking(`PK-RACE${i}`));
        return true;
      }),
    ),
  );
  const won = winners.filter(Boolean).length;
  if (won !== 1) throw new Error(`${won} of 10 racing writers got the same table; expected 1`);
  console.log("✓ 10 simultaneous bookings for one table: exactly 1 accepted");

  console.log(`\nStore is working. Live diary key: peacock:diary (${url.replace(/^https:\/\//, "")})`);
} catch (error) {
  console.error(`✗ ${error.message}`);
  process.exitCode = 1;
} finally {
  await cleanup();
}
