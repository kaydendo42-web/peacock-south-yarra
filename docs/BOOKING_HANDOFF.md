> **Superseded, 22 September 2026.** The booking system landed: `/book-a-table`
> runs PeregrineTable, ported from the standalone build. See
> [BOOKING_SYSTEM.md](BOOKING_SYSTEM.md). What follows is the brief it was
> built against, kept for the record.

# Booking handoff for Jason

The owner requested the existing booking implementation be removed on 21 September
2026. The ResOS iframe, fallback link, photo, hours/contact block and provider URL
are no longer used. No booking request or provider-account change was made.

The `/book-a-table` route remains linked from the header and footer. It currently
contains the branded masthead, a short online-bookings notice, and a call link from
`src/lib/site.ts`. Replace the notice/call fallback in
`src/app/book-a-table/page.tsx` when the approved booking system is ready.

Keep NAP/hours sourced from `src/lib/site.ts`. Update the booking FAQ in
`src/components/cafe-sections.tsx` when online availability becomes available.
Do not add an iframe/provider until the owner has approved the system.

Acceptance checks: mobile sizing, keyboard navigation, provider failure fallback,
privacy/consent requirements, confirmation and cancellation flow. Use the provider's
test mode; do not make real reservations as a website smoke test.
