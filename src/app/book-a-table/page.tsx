import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/structured-data";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a table",
  description:
    "Get in touch with The Peacock South Yarra to plan your next visit.",
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
      <header className="page-masthead container booking-handoff">
        <p className="eyebrow">There’s a place for you here</p>
        <h1>
          LET’S MAKE
          <br />
          <span className="angled-title">BRUNCH PLANS.</span>
        </h1>
        {/* Booking-system integration is intentionally reserved for Jason. */}
        <p>
          Online bookings are on their way.
          <br />
          For now, give the team a call to arrange your visit.
        </p>
        <a className="button" href={site.phoneHref}>
          Call {site.phone}
          <span aria-hidden="true">↗</span>
        </a>
      </header>
    </>
  );
}
