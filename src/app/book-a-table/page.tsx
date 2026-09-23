import type { Metadata } from "next";
import BookingExperience from "@/booking/BookingExperience";
import { BreadcrumbSchema } from "@/components/structured-data";
import { hours, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a table",
  description: `Pick your table on the floor plan and choose a time. All-day brunch at ${site.shortName}, ${site.suburb}.`,
  alternates: { canonical: "/book-a-table" },
};

export default function BookingPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Book a table", path: "/book-a-table" },
        ]}
      />
      <header className="page-masthead container booking-masthead">
        <h1>
          book a
          <br />
          <span className="angled-title">table</span>
        </h1>
        <p className="booking-masthead__lede">
          Open weekdays {hours.weekdays.display} and weekends{" "}
          {hours.weekend.display}. For groups of more than eight, call us on{" "}
          <a className="text-link" href={site.phoneHref}>
            {site.phone}
          </a>
          .
        </p>
      </header>

      <section className="section booking-section">
        <div className="container">
          <BookingExperience />
        </div>
      </section>
    </>
  );
}
