"use client";

import { useCallback, useEffect, useState } from "react";
import { addOnLineId, dietLabels, dinners, money, type Dish } from "./menu";
import { site } from "@/lib/site";

type Day = {
  date: string;
  label: string;
  closesAt: string;
  dishes: (Dish & { left: number })[];
};

type Availability = {
  ordering: boolean;
  pickup: string;
  maxPerDish: number;
  days: Day[];
};


const closesLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(":00", "")
    .replace(/\s*(am|pm)/i, "$1")
    .replace(/\s/g, " ");

/**
 * Pick a day, choose how many of each dish, give a name and contact, and pay
 * through Square. One pickup day per order; the server re-checks everything.
 */
export function DinnerOrder() {
  const [data, setData] = useState<Availability | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [date, setDate] = useState<string | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dinners/availability", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const next = (await res.json()) as Availability;
      setData(next);
      setLoadError(false);
      setDate((d) => (d && next.days.some((x) => x.date === d) ? d : (next.days[0]?.date ?? null)));
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const day = data?.days.find((d) => d.date === date);
  const total = day
    ? day.dishes.reduce(
        (sum, d) =>
          sum + d.priceCents * (qty[d.id] ?? 0) + (d.addOn ? d.addOn.priceCents * (qty[addOnLineId(d)] ?? 0) : 0),
        0,
      )
    : 0;
  const count = day ? day.dishes.reduce((n, d) => n + (qty[d.id] ?? 0), 0) : 0;

  const pickDay = (d: string) => {
    setDate(d);
    setQty({});
    setError(null);
  };

  const step = (dish: Day["dishes"][number], by: number) => {
    const cap = Math.min(dish.left, data?.maxPerDish ?? 10);
    setQty((q) => {
      const n = Math.max(0, Math.min(cap, (q[dish.id] ?? 0) + by));
      const next = { ...q, [dish.id]: n };
      // Never more add-ons than portions.
      if (dish.addOn) next[addOnLineId(dish)] = Math.min(q[addOnLineId(dish)] ?? 0, n);
      return next;
    });
  };

  const stepExtra = (dish: Day["dishes"][number], by: number) => {
    const key = addOnLineId(dish);
    setQty((q) => ({ ...q, [key]: Math.max(0, Math.min(q[dish.id] ?? 0, (q[key] ?? 0) + by)) }));
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!day || !count) return;
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/dinners/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: day.date,
          items: day.dishes.flatMap((d) => [
            { dishId: d.id, quantity: qty[d.id] ?? 0 },
            ...(d.addOn ? [{ dishId: addOnLineId(d), quantity: qty[addOnLineId(d)] ?? 0 }] : []),
          ]),
          name: form.get("name"),
          phone: form.get("phone"),
          email: form.get("email"),
        }),
      });
      const out = (await res.json()) as { checkoutUrl?: string; error?: string; code?: string };
      if (res.ok && out.checkoutUrl) {
        window.location.assign(out.checkoutUrl);
        return;
      }
      setError(out.error ?? "Something went wrong. Try again.");
      if (out.code === "sold-out" || out.code === "closed") {
        setQty({});
        await load();
      }
    } catch {
      setError(`We couldn't reach the café's ordering. Try again, or call us on ${site.phone}.`);
    }
    setBusy(false);
  }

  if (loadError && !data) {
    return (
      <p className="dinners-note" role="alert">
        We couldn’t load this week’s dinners. Refresh, or call us on{" "}
        <a href={site.phoneHref}>{site.phone}</a> to order.
      </p>
    );
  }
  if (!data) return <p className="dinners-note">Loading dinners…</p>;
  if (!data.days.length) {
    return <p className="dinners-note">No dinners are open for ordering right now. Check back soon.</p>;
  }

  return (
    <form className="dinners-form" onSubmit={submit}>
      <fieldset>
        <legend className="eyebrow">1. Pick your collection day</legend>
        <div className="dinners-days" role="radiogroup">
          {data.days.map((d) => {
            const out = d.dishes.every((x) => x.left === 0);
            return (
              <label key={d.date} className="dinners-day" data-selected={d.date === date || undefined}>
                <input
                  type="radio"
                  name="date"
                  value={d.date}
                  checked={d.date === date}
                  onChange={() => pickDay(d.date)}
                />
                <span className="dinners-day-name">{d.label.replace(/ \w+$/, "")}</span>
                <span className="dinners-day-meta">
                  {out ? "Sold out" : `Order by ${closesLabel(d.closesAt)}`}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {day ? (
        <fieldset>
          <legend className="eyebrow">2. Choose your dinners</legend>
          <ul className="dinners-dishes">
            {day.dishes.map((d) => {
              const n = qty[d.id] ?? 0;
              const cap = Math.min(d.left, data.maxPerDish);
              return (
                <li key={d.id} className="dinners-dish" data-soldout={d.left === 0 || undefined}>
                  <div>
                    <p className="dinners-dish-price">{money(d.priceCents)}</p>
                    <h3>{d.name}</h3>
                    <p className="dinners-dish-meta">
                      {d.diet.map((x) => dietLabels[x]).join(" · ")}
                      {d.left === 0 ? (
                        <strong> Sold out</strong>
                      ) : d.left < data.maxPerDish ? (
                        <strong> Only {d.left} left</strong>
                      ) : null}
                    </p>
                  </div>
                  <div className="dinners-stepper" aria-label={`How many ${d.name}`}>
                    <button
                      type="button"
                      onClick={() => step(d, -1)}
                      disabled={n === 0}
                      aria-label={`One fewer ${d.name}`}
                    >
                      −
                    </button>
                    <output aria-live="polite">{n}</output>
                    <button
                      type="button"
                      onClick={() => step(d, 1)}
                      disabled={n >= cap}
                      aria-label={`One more ${d.name}`}
                    >
                      +
                    </button>
                  </div>
                  {d.addOn && n > 0 ? (
                    <div className="dinners-extra">
                      <span>
                        Add {d.addOn.name.toLowerCase()}{" "}
                        <span className="dinners-extra-price">+{money(d.addOn.priceCents)} each</span>
                      </span>
                      <div className="dinners-stepper" aria-label={`How many with ${d.addOn.name.toLowerCase()}`}>
                        <button
                          type="button"
                          onClick={() => stepExtra(d, -1)}
                          disabled={(qty[addOnLineId(d)] ?? 0) === 0}
                          aria-label={`One fewer with ${d.addOn.name.toLowerCase()}`}
                        >
                          −
                        </button>
                        <output aria-live="polite">{qty[addOnLineId(d)] ?? 0}</output>
                        <button
                          type="button"
                          onClick={() => stepExtra(d, 1)}
                          disabled={(qty[addOnLineId(d)] ?? 0) >= n}
                          aria-label={`One more with ${d.addOn.name.toLowerCase()}`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="dinners-note">
            Order by {closesLabel(day.closesAt)}, collect {day.label},{" "}
            {data.pickup}. Want dinners for another day too? Place a separate
            order for it.
          </p>
        </fieldset>
      ) : null}

      <fieldset className="dinners-details" disabled={!count}>
        <legend className="eyebrow">3. Your details</legend>
        <label>
          <span>Name</span>
          <input name="name" autoComplete="name" required maxLength={80} />
        </label>
        <label>
          <span>Mobile</span>
          <input name="phone" type="tel" autoComplete="tel" required maxLength={30} />
        </label>
        <label>
          <span>Email (for your receipt)</span>
          <input name="email" type="email" autoComplete="email" required maxLength={120} />
        </label>
      </fieldset>

      {error ? (
        <p className="dinners-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="dinners-pay">
        {data.ordering ? (
          <>
            <p>
              {count ? (
                <>
                  {count} dinner{count === 1 ? "" : "s"} · <strong>{money(total)}</strong>
                </>
              ) : (
                "Choose at least one dinner"
              )}
            </p>
            <button className="button" type="submit" disabled={!count || busy}>
              {busy ? "Opening checkout…" : `Pay ${count ? money(total) : ""} securely`}{" "}
              <span aria-hidden="true">↗︎</span>
            </button>
            <p className="dinners-fine">
              You’ll pay on Square’s secure checkout, then come back here. Your
              dinners are held for {dinners.holdMinutes} minutes while you pay.
            </p>
          </>
        ) : (
          <p>
            Online ordering opens soon. To order now, call us on{" "}
            <a href={site.phoneHref}>{site.phone}</a>.
          </p>
        )}
      </div>
    </form>
  );
}
