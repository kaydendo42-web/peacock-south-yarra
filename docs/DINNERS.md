# $5 dinners

Jenny's pop-up (brief of 22 Oct 2026): cooked dinners ordered and paid online,
collected from the café the next day.

## How it works

- `/dinners` lists open pickup days (Mon–Fri, up to 14 days ahead) and each
  day's two dishes with portions left. One pickup day per order.
- Placing an order calls `reserve_dinner_order` in Postgres, which checks the
  50-a-dish cap under a per-day advisory lock and holds the portions for 20
  minutes. The guest is sent to a Square payment link; the Square order has a
  PICKUP fulfilment for 7am on the pickup day, so it shows in Square POS.
- Payment is confirmed when the guest returns to `/dinners/thanks` and by
  Square's `payment.updated` webhook, whichever is first. Exactly one receipt
  is sent. A hold that lapses unpaid stops counting immediately; its payment
  link is closed the next time anyone loads the page.
- At 9pm Melbourne (two Vercel crons cover daylight saving) the café gets the
  next day's paid orders by email.

## What Jenny changes

Everything is in `dinners` in `src/dinners/menu.ts`: the first Monday of Week 1
(`firstMonday`), an end date (`lastDay`), closed days, the cap, max per dish
per order, cut-off, pickup window and both weeks' dishes and prices.

## Going live

1. Apply `20261022000000_dinner_orders.sql` (console repo) to the shared
   Supabase project.
2. Confirm the Square token can create payment links (ORDERS_WRITE,
   PAYMENTS_WRITE). A personal access token can.
3. Square Developer Dashboard → the app → Webhooks: subscribe
   `payment.updated` to `https://www.thepeacock.com.au/api/dinners/webhook`.
   Put its signature key in `SQUARE_WEBHOOK_SIGNATURE_KEY` (Production).
4. Set `CRON_SECRET` (Production). Optionally `DINNERS_NOTIFY_EMAIL`.
5. Deploy; place a real $5 order and refund it from Square.

Refunds and cancellations are done by Jenny in Square; mark the order
`cancelled` in the database so its portions go back on sale.
