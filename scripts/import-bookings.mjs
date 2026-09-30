/**
 * Bring Resos's future bookings into Peregrine, once, at cutover.
 *
 *   npm run peregrine:import -- bookings.csv            # dry run: what would happen
 *   npm run peregrine:import -- bookings.csv --commit   # write them
 *
 * Reads a CSV export (Resos: List → export). Column names are matched loosely,
 * because exports differ: date, time, guests/people/party, name, phone, email,
 * table, note/comment, status, id/reference. Anything it cannot place is
 * printed rather than guessed at.
 *
 * Needs SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and PEREGRINE_VENUE_ID (from
 * .env.local). Rows go in with source 'resos' and their Resos reference, so
 * running it twice skips what is already there, and a guest's existing
 * confirmation still matches.
 */
import { readFile } from "node:fs/promises";
import nextEnv from "@next/env";
import { tables } from "../src/booking/data/venue.ts";
import { sittingFor } from "../src/booking/data/time.ts";
import { service, VENUE_TZ } from "../src/booking/data/venue.ts";

nextEnv.loadEnvConfig(process.cwd());

const [file, flag] = process.argv.slice(2);
const commit = flag === "--commit";
if (!file) {
  console.error("Usage: npm run peregrine:import -- <bookings.csv> [--commit]");
  process.exit(1);
}

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PEREGRINE_VENUE_ID } = process.env;
if (commit && !(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && PEREGRINE_VENUE_ID)) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and PEREGRINE_VENUE_ID first.");
  process.exit(1);
}

/** RFC 4180-ish: quoted fields, doubled quotes, commas and newlines inside quotes. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (cell += '"'), i++;
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") row.push(cell), (cell = "");
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell), rows.push(row), (row = []), (cell = "");
    } else cell += c;
  }
  if (cell || row.length) row.push(cell), rows.push(row);
  return rows.filter((r) => r.some((v) => v.trim()));
}

const pick = (header, ...names) => header.findIndex((h) => names.some((n) => h.includes(n)));

/** Melbourne wall-clock date + time → an ISO instant, DST-correct. */
function melbourne(date, time) {
  const d = date.includes("/") ? date.split("/").reverse().join("-") : date; // 31/10/2026 → 2026-10-31
  const [hh, mm] = time.replace(/\s*(am|pm)$/i, "").split(":").map(Number);
  const pm = /pm$/i.test(time.trim()) && hh < 12 ? 12 : 0;
  const am = /am$/i.test(time.trim()) && hh === 12 ? -12 : 0;
  const guess = new Date(`${d}T${String(hh + pm + am).padStart(2, "0")}:${String(mm || 0).padStart(2, "0")}:00Z`);
  // Find the offset Melbourne had at that moment and take it off.
  const local = new Date(guess.toLocaleString("en-US", { timeZone: VENUE_TZ }));
  const utc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
  return new Date(guess.getTime() - (local.getTime() - utc.getTime())).toISOString();
}

const [header, ...rows] = parseCsv(await readFile(file, "utf8"));
const h = header.map((x) => x.trim().toLowerCase());
const col = {
  id: pick(h, "reference", "booking id", "id"),
  date: pick(h, "date"),
  time: pick(h, "time"),
  party: pick(h, "guests", "people", "party", "covers", "pax"),
  name: pick(h, "name"),
  phone: pick(h, "phone", "mobile"),
  email: pick(h, "email"),
  table: pick(h, "table"),
  notes: pick(h, "note", "comment", "request"),
  status: pick(h, "status"),
};
for (const k of ["date", "time", "party", "name"]) {
  if (col[k] < 0) {
    console.error(`No "${k}" column in ${file}. Header was: ${header.join(" | ")}`);
    process.exit(1);
  }
}

const byLabel = new Map(tables.map((t) => [t.label.toLowerCase(), t]));
const now = Date.now();
const ready = [];
const problems = [];

rows.forEach((r, i) => {
  const at = (k) => (col[k] >= 0 ? (r[col[k]] ?? "").trim() : "");
  const line = i + 2;
  const status = at("status").toLowerCase();
  if (/cancel|no.?show|declin/.test(status)) return;
  let startsAt;
  try {
    startsAt = melbourne(at("date"), at("time"));
  } catch {
    return problems.push(`line ${line}: cannot read date/time "${at("date")} ${at("time")}"`);
  }
  if (new Date(startsAt).getTime() < now) return; // only the future moves over
  const party = Number.parseInt(at("party"), 10);
  if (!party) return problems.push(`line ${line}: no party size`);
  const label = at("table").replace(/^table\s*/i, "").toLowerCase();
  const table = label ? byLabel.get(label) : undefined;
  if (label && !table) problems.push(`line ${line}: table "${at("table")}" is not on Jenny's plan — imported unassigned`);
  const durationMin = sittingFor(party);
  ready.push({
    id: at("id") ? `RS-${at("id").replace(/[^A-Za-z0-9-]/g, "")}` : `RS-${line}-${startsAt.slice(0, 10)}`,
    venue_id: PEREGRINE_VENUE_ID,
    table_id: table?.id ?? null,
    starts_at: startsAt,
    ends_at: new Date(new Date(startsAt).getTime() + (durationMin + service.bufferMinutes) * 60_000).toISOString(),
    duration_min: durationMin,
    party_size: party,
    guest_name: at("name"),
    phone: at("phone"),
    email: at("email"),
    notes: at("notes") || null,
    status: "confirmed",
    source: "resos",
  });
});

console.log(`${ready.length} future bookings to bring over, ${problems.length} notes.`);
for (const p of problems) console.log(`  · ${p}`);
for (const b of ready.slice(0, 8)) {
  console.log(`  ${b.starts_at}  ${String(b.party_size).padStart(2)}  ${b.table_id ?? "(no table)"}  ${b.guest_name}`);
}
if (!commit) {
  console.log("\nDry run. Add --commit to write them.");
  process.exit(0);
}

let written = 0;
for (const b of ready) {
  const res = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/bookings?on_conflict=id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=ignore-duplicates,return=minimal",
    },
    body: JSON.stringify(b),
  });
  if (res.ok) written++;
  else {
    const err = await res.json().catch(() => ({}));
    const why = err.code === "23P01" ? "table already held then — assign by hand" : err.message ?? res.status;
    console.log(`  ✗ ${b.id} ${b.starts_at} ${b.guest_name}: ${why}`);
  }
}
console.log(`Wrote ${written} of ${ready.length}.`);
