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
};

/** Square can take a few seconds to settle a payment; ask again for about half a minute. */
const TRIES = 10;
const EVERY_MS = 3000;

export function DinnerThanks({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [missing, setMissing] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

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
        const res = await fetch(`/api/dinners/orders/${orderId}`, { cache: "no-store" });
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
  }, [orderId]);

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
