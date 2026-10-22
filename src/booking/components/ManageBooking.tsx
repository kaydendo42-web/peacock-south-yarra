"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { AreaId, Booking } from "../data/types";
import { areaStateAt } from "../data/allocate";
import { bookableSlots } from "../data/availability";
import { areas } from "../data/venue";
import { dateLabel, timeLabel, venueDateKey, todayKey } from "../data/time";
import { site } from "@/lib/site";

/**
 * A guest's own booking, from the signed link in their confirmation email:
 * move it to another day, time, area or party size, or cancel it. The server
 * rechecks everything; this only offers times that look free.
 */

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8];

type Loaded = { booking: Booking; changeableUntil: string; canChange: boolean };

const when = (iso: string) => `${dateLabel(venueDateKey(new Date(iso)))} at ${clock(iso)}`;
const clock = (d: Date | string) => {
  const [h, m] = timeLabel(d).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")}${h < 12 ? "am" : "pm"}`;
};
const people = (n: number) => `${n} ${n === 1 ? "person" : "people"}`;

export function ManageBooking({ reference, token }: { reference: string; token: string }) {
  const [state, setState] = useState<Loaded | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [done, setDone] = useState<"changed" | "cancelled" | null>(null);

  const [date, setDate] = useState("");
  const [party, setParty] = useState(2);
  const [area, setArea] = useState<AreaId>("inside");
  const [time, setTime] = useState("");
  const [others, setOthers] = useState<Booking[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const api = `/api/booking/bookings/${encodeURIComponent(reference)}`;

  useEffect(() => {
    if (!reference || !token) return setInvalid(true);
    fetch(`${api}?t=${encodeURIComponent(token)}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const loaded = (await res.json()) as Loaded;
        const b = loaded.booking;
        setState(loaded);
        setDate(venueDateKey(new Date(b.startsAt)));
        setParty(b.partySize);
        setArea(b.area ?? "inside");
        setTime(timeLabel(b.startsAt));
      })
      .catch(() => setInvalid(true));
  }, [api, reference, token]);

  // Everyone else's bookings that day, so only free times are offered.
  useEffect(() => {
    if (!date) return;
    setOthers(null);
    fetch(`/api/booking/bookings?date=${date}`, { cache: "no-store" })
      .then((res) => res.json() as Promise<Booking[]>)
      .then((all) => setOthers(all.filter((b) => b.id !== reference)))
      .catch(() => setOthers([]));
  }, [date, reference]);

  const slots = useMemo(() => {
    if (!date || !others) return [];
    return bookableSlots(date, party).filter((s) => areaStateAt(area, s, party, others) === "available");
  }, [date, party, area, others]);

  const chosen = slots.find((s) => timeLabel(s) === time);
  const original = state?.booking;
  const unchanged =
    !!original &&
    !!chosen &&
    chosen.toISOString() === new Date(original.startsAt).toISOString() &&
    party === original.partySize &&
    area === (original.area ?? area);

  async function send(action: "change" | "cancel") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${api}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "cancel"
            ? { t: token }
            : { t: token, area, partySize: party, startsAt: chosen?.toISOString() },
        ),
      });
      const out = (await res.json()) as Booking & { error?: string };
      if (!res.ok) throw new Error(out.error ?? "Something went wrong.");
      setState((s) => (s ? { ...s, booking: out } : s));
      setDone(action === "cancel" ? "cancelled" : "changed");
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    }
    setBusy(false);
    setConfirmCancel(false);
  }

  if (invalid) {
    return (
      <Card heading="We can’t open that booking">
        <p>
          The link may be incomplete. Copy it from your confirmation email, or
          call us on <a href={site.phoneHref}>{site.phone}</a>.
        </p>
      </Card>
    );
  }
  if (!state || !original) return <Card heading="Finding your booking…" />;

  const summary = (
    <dl className="manage-summary">
      <div>
        <dt>When</dt>
        <dd>{when(original.startsAt)}</dd>
      </div>
      <div>
        <dt>Table for</dt>
        <dd>{people(original.partySize)}</dd>
      </div>
      <div>
        <dt>Where</dt>
        <dd>{areas.find((a) => a.id === original.area)?.name ?? "Our pick"}</dd>
      </div>
      <div>
        <dt>Reference</dt>
        <dd>{original.id}</dd>
      </div>
    </dl>
  );

  if (done === "cancelled" || original.status === "cancelled") {
    return (
      <Card heading="Booking cancelled">
        <p>Thanks for letting us know. Hope to see you another time.</p>
        <p>
          <Link href="/book-a-table">Make a new booking</Link>
        </p>
      </Card>
    );
  }
  if (done === "changed") {
    return (
      <Card heading="Booking updated">
        {summary}
        <p>We’ve emailed you the new details.</p>
      </Card>
    );
  }
  if (!state.canChange) {
    return (
      <Card heading="Your booking">
        {summary}
        <p>
          It’s too close to your booking to change it online. Call us on{" "}
          <a href={site.phoneHref}>{site.phone}</a> and we’ll sort it out.
        </p>
      </Card>
    );
  }

  return (
    <Card heading={`Hi ${original.guestName.split(" ")[0]}`}>
      <p>Here’s your booking. Change anything below, or cancel it.</p>
      {summary}

      <form
        className="manage-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (chosen && !unchanged) send("change");
        }}
      >
        <label>
          <span>Day</span>
          <input
            type="date"
            value={date}
            min={todayKey()}
            onChange={(e) => {
              setDate(e.target.value);
              setTime("");
            }}
            required
          />
        </label>
        <label>
          <span>People</span>
          <select value={party} onChange={(e) => setParty(Number(e.target.value))}>
            {PARTY_SIZES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Where</span>
          <select value={area} onChange={(e) => setArea(e.target.value as AreaId)}>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Time</span>
          <select value={chosen ? time : ""} onChange={(e) => setTime(e.target.value)} required>
            <option value="" disabled>
              {others === null ? "Checking…" : slots.length ? "Choose a time" : "Nothing free"}
            </option>
            {slots.map((s) => (
              <option key={s.toISOString()} value={timeLabel(s)}>
                {clock(s)}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="manage-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="manage-actions">
          <button className="button" type="submit" disabled={busy || !chosen || unchanged}>
            {busy ? "Saving…" : "Save changes"} <span aria-hidden="true">↗︎</span>
          </button>
          {confirmCancel ? (
            <span className="manage-confirm">
              Cancel this booking?{" "}
              <button type="button" onClick={() => send("cancel")} disabled={busy}>
                Yes, cancel it
              </button>{" "}
              <button type="button" onClick={() => setConfirmCancel(false)}>
                Keep it
              </button>
            </span>
          ) : (
            <button type="button" className="manage-cancel" onClick={() => setConfirmCancel(true)}>
              Cancel booking
            </button>
          )}
        </div>
      </form>
      <p className="manage-fine">
        Changes close at 9pm the night before your booking. After that, call
        us on{" "}
        <a href={site.phoneHref}>{site.phone}</a>.
      </p>
    </Card>
  );
}

function Card({ heading, children }: { heading: string; children?: React.ReactNode }) {
  return (
    <div className="manage-card">
      <p className="eyebrow">Your booking</p>
      <h1>{heading}</h1>
      {children}
    </div>
  );
}
