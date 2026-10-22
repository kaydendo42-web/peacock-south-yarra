# $5 dinners

Jenny's pop-up (brief of 22 Oct 2026, answers the same evening): cooked
dinners ordered and paid online, collected from the café the next day.
November 2026 is the trial: Mon 2 – Fri 27 November, not Tuesday 3 (Melbourne
Cup). If it works she'll keep it going; extend `lastDay` and the menu.

## How it works

- `/dinners` lists open pickup days (Mon–Fri, up to 14 days ahead) and each
  day's two dishes. One pickup day per order; guests wanting several days
  place several orders. Jenny doesn't want her numbers public, so the API
  never says more than 10 left (the most one order can take).
- Placing an order calls `reserve_dinner_order` in Postgres, which checks each
  dish's cap ($5 dishes 40 a day, $10 dishes 60; sent per line) under a
  per-day advisory lock and holds the portions for 20 minutes. The guest is sent to a Square payment link; the Square order has a
  PICKUP fulfilment for 7am on the pickup day, so it shows in Square POS.
- Payment is confirmed when the guest returns to `/dinners/thanks` and by
  Square's `payment.updated` webhook, whichever is first. Exactly one receipt
  is sent. A hold that lapses unpaid stops counting immediately; its payment
  link is closed the next time anyone loads the page.
- Square's redirect and the receipt carry a signed link to
  `/dinners/thanks?order=…&t=…` (same key as booking links, `dinner:` prefix).
  With it, the guest can cancel until 24 hours before pickup opens (7am the
  day before): the site refunds the full amount through Square's Refunds API
  (idempotent on the order number), marks the order `cancelled` with
  `cancelled_at` and `square_refund_id`, emails the guest, and the portions go
  back on sale.
- At 9pm Melbourne (two Vercel crons cover daylight saving) the café gets the
  next day's paid orders by email.

## What Jenny changes

Everything is in `dinners` in `src/dinners/menu.ts`: the first Monday of Week 1
(`firstMonday`), an end date (`lastDay`), closed days, the cap, max per dish
per order, cut-off, pickup window and both weeks' dishes and prices.

## Going live

1. Apply `20261022000000_dinner_orders.sql` and
   `20261022010000_dinner_caps_refunds.sql` (console repo) to the shared
   Supabase project. The second must be on before this code deploys, or every
   dish reads as sold out.
2. Confirm the Square token can create payment links (ORDERS_WRITE,
   PAYMENTS_WRITE). A personal access token can.
3. Square Developer Dashboard → the app → Webhooks: subscribe
   `payment.updated` to `https://www.thepeacock.com.au/api/dinners/webhook`.
   Put its signature key in `SQUARE_WEBHOOK_SIGNATURE_KEY` (Production).
4. Set `CRON_SECRET` (Production). Optionally `DINNERS_NOTIFY_EMAIL`.
5. Deploy; place a real $5 order and refund it from Square.

Guests cancel and are refunded online up to 24 hours ahead. Later than that,
Jenny refunds in Square if she chooses; mark the order `cancelled` in the
database so its portions go back on sale.
