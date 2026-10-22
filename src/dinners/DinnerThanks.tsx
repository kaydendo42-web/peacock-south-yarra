"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { money } from "./menu";
import { site } from "@/lib/site";

type Order = {
  id: string;
  status: "pending" | "paid" | "expired" | "cancelled" | "collected";
  pickupLabel: string;
  pickupWindow: string;
  lines: { dishId: string; dishName: string; priceCents: number; quantity: number }[];
  totalCents: number;
  checkoutUrl?: string;
  refunded?: boolean;
  /** Only with the signed link from the receipt or Square's redirect. */
  canCancel?: boolean;
  cancelUntil?: string;
};

const cancelUntilLabel = (iso: string) =>
  new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  })
    .format(new Date(iso))
    .replace(":00", "")
    .replace(/\s*(am|pm)/i, "$1");

/** Square can take a few seconds to settle a payment; ask again for about half a minute. */
const TRIES = 10;
const EVERY_MS = 3000;

/**
 * After Square's checkout, and from the link in the receipt: the order, its
 * payment as Square settles it, and (with the signed link) a way to cancel.
 */
export function DinnerThanks({ orderId, token }: { orderId: string; token?: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function cancel() {
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/dinners/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ t: token }),
      });
      const out = (await res.json()) as Order & { error?: string };
      if (res.ok) setOrder(out);
      else setCancelError(out.error ?? "Something went wrong. Call us to cancel.");
    } catch {
      setCancelError(`We couldn't reach the café. Try again, or call us on ${site.phone}.`);
    }
    setCancelling(false);
    setConfirming(false);
  }

  useEffect(() => {
    if (!/^DN-[A-Z2-9]{8}$/.test(orderId)) {
      setMissing(true);
      return;
    }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const check = async () => {
      tries++;
      try {
        const query = token ? `?t=${encodeURIComponent(token)}` : "";
        const res = await fetch(`/api/dinners/orders/${orderId}${query}`, { cache: "no-store" });
        if (res.status === 404) return setMissing(true);
        const next = (await res.json()) as Order;
        if (stopped) return;
        setOrder(next);
        if (next.status !== "pending") return;
      } catch {
        // try again below
      }
      if (tries < TRIES) timer = setTimeout(check, EVERY_MS);
      else setGaveUp(true);
    };
    check();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [orderId, token]);

  if (missing) {
    return (
      <Message heading="We can’t find that order">
        If you paid, your receipt email has your order number. Call us on{" "}
        <a href={site.phoneHref}>{site.phone}</a> and we’ll sort it out.
      </Message>
    );
  }
  if (!order) return <Message heading="Checking your payment…" />;

  if (order.status === "paid" || order.status === "collected") {
    return (
      <Message heading="Your dinners are ordered">
        <p>
          Collect them from the counter on <strong>{order.pickupLabel}</strong>,{" "}
          {order.pickupWindow}. A receipt is on its way to your inbox.
        </p>
        <dl className="dinners-receipt">
          {order.lines.map((l) => (
            <div key={l.dishId}>
              <dt>
                {l.quantity} × {l.dishName}
              </dt>
              <dd>{money(l.priceCents * l.quantity)}</dd>
            </div>
          ))}
          <div>
            <dt>Paid</dt>
            <dd>{money(order.totalCents)}</dd>
          </div>
          <div>
            <dt>Order number</dt>
            <dd>{order.id}</dd>
          </div>
        </dl>
        {order.canCancel && order.cancelUntil ? (
          <div className="dinners-cancel">
            {confirming ? (
              <>
                <p>
                  Cancel this order? We’ll refund {money(order.totalCents)} to
                  your card.
                </p>
                <div className="dinners-cancel-actions">
                  <button type="button" className="button" onClick={cancel} disabled={cancelling}>
                    {cancelling ? "Cancelling…" : "Yes, cancel and refund"}
                  </button>
                  <button type="button" className="dinners-link" onClick={() => setConfirming(false)} disabled={cancelling}>
                    Keep my order
                  </button>
                </div>
              </>
            ) : (
              <p>
                Change of plans?{" "}
                <button type="button" className="dinners-link" onClick={() => setConfirming(true)}>
                  Cancel for a full refund
                </button>{" "}
                until {cancelUntilLabel(order.cancelUntil)}.
              </p>
            )}
            {cancelError ? (
              <p className="dinners-error" role="alert">
                {cancelError}
              </p>
            ) : null}
          </div>
        ) : null}
      </Message>
    );
  }

  if (order.status === "cancelled" && order.refunded) {
    return (
      <Message heading="Your order is cancelled">
        <p>
          We’ve refunded {money(order.totalCents)} to your card. It can take a
          few business days to show. <Link href="/dinners">Order again</Link>{" "}
          any time.
        </p>
      </Message>
    );
  }

  if (order.status === "pending") {
    return (
      <Message heading={gaveUp ? "We haven’t seen your payment yet" : "Checking your payment…"}>
        {gaveUp ? (
          <p>
            If you finished paying, it can take a minute to come through and
            your receipt email will follow. If you didn’t,{" "}
            {order.checkoutUrl ? (
              <a href={order.checkoutUrl}>go back to the payment page</a>
            ) : (
              <Link href="/dinners">start your order again</Link>
            )}
            .
          </p>
        ) : null}
      </Message>
    );
  }

  return (
    <Message heading="This order wasn’t paid">
      <p>
        The time to pay ran out, so the dinners went back on sale.{" "}
        <Link href="/dinners">Order again</Link>, or call us on{" "}
        <a href={site.phoneHref}>{site.phone}</a> if you think you were charged.
      </p>
    </Message>
  );
}

function Message({ heading, children }: { heading: string; children?: React.ReactNode }) {
  return (
    <div className="dinners-thanks-card" role="status">
      <p className="eyebrow">$5 dinners</p>
      <h1>{heading}</h1>
      {children}
    </div>
  );
}
