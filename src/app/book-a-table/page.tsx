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
        <p className="eyebrow">There’s a place for you here</p>
        <h1>
          LET’S MAKE
          <br />
          <span className="angled-title">BRUNCH PLANS.</span>
        </h1>
        <p className="booking-masthead__lede">
          Choose where you’d like to sit, not just when. Weekdays{" "}
          {hours.weekdays.display}, weekends {hours.weekend.display} — or call{" "}
          <a className="text-link" href={site.phoneHref}>
            {site.phone}
          </a>{" "}
          for a party of more than eight.
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
