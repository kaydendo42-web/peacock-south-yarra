import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/structured-data";
import { hours, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book Now",
  description:
    "Booking a table at The Peacock South Yarra is easy. Use the booking tool to secure your spot for breakfast, brunch or our tapas nights.",
  alternates: { canonical: "/book-a-table" },
  openGraph: {
    title: "Book Now | The Peacock South Yarra | South Yarra Cafe",
    description: "Secure your spot for breakfast, brunch or our tapas nights.",
    url: "/book-a-table",
  },
};

/*
  Interim: the live site embeds ResOS, so the migration keeps that booking flow
  working unchanged. Replacing this iframe with the in-house booking system is
  the next milestone — see docs/BOOKING_MIGRATION.md.
*/
const RESOS_EMBED = "https://the-peacock-south-yarra.resos.com/booking";

export default function BookATablePage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Bookings", path: "/book-a-table" },
        ]}
      />

      <div className="mx-auto max-w-[1440px] px-5 py-10 lg:py-[42px]">
        <h1 className="sr-only">Book a table at {site.name}</h1>

        <div className="mx-auto w-full max-w-[512px]">
          <iframe
            src={RESOS_EMBED}
            title={`Book a table at ${site.name}`}
            loading="lazy"
            className="h-[708px] w-full border-0"
          />
        </div>

        <p className="mx-auto mt-8 max-w-[512px] text-center font-body text-[15px] leading-[1.5] text-ink-soft">
          Booking trouble, or a group of more than ten? Call us on{" "}
          <a href={site.phoneHref} className="text-teal underline underline-offset-2">
            {site.phone}
          </a>{" "}
          or email{" "}
          <a href={`mailto:${site.email}`} className="text-teal underline underline-offset-2">
            {site.email}
          </a>
          . We serve {hours.weekdays.display} weekdays and {hours.weekend.display} weekends.
        </p>
      </div>
    </>
  );
}
