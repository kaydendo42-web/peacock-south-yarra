import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import BookingExperience from "@/booking/BookingExperience";
import { BreadcrumbSchema } from "@/components/structured-data";
import { hours, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a table",
  description: `Pick your table on the floor plan and choose a time. All-day brunch at ${site.shortName}, ${site.suburb}.`,
  alternates: { canonical: "/book-a-table" },
};

/**
 * Booking takes the whole screen. On a phone the room was a postcard-sized
 * strip between the masthead and the footer; here it gets every pixel, with one
 * way back to the site and one way to ring the café.
 */
export default function BookingPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Book a table", path: "/book-a-table" },
        ]}
      />
      <div className="book-screen">
        <header className="book-screen__bar">
          <Link href="/" className="book-screen__logo" aria-label={`${site.name} home`}>
            <Image src="/images/logo.png" alt="" width={828} height={117} priority />
          </Link>
          <h1 className="sr-only">Book a table</h1>
          <p className="book-screen__note">
            Open weekdays {hours.weekdays.display}, weekends{" "}
            {hours.weekend.display}. More than eight?{" "}
            <a href={site.phoneHref}>Call {site.phone}</a>
          </p>
          <a className="book-screen__call" href={site.phoneHref}>
            Call us
          </a>
          <Link href="/" className="book-screen__home">
            <span aria-hidden="true">←︎</span> Return to home page
          </Link>
        </header>
        <BookingExperience />
      </div>
    </>
  );
}
