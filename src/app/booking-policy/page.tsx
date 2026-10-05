import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/policy-page";
import { policyUpdated } from "@/lib/policies";
import { site } from "@/lib/site";
import { service } from "@/booking/data/venue";

export const metadata: Metadata = {
  title: "Booking policy",
  description: `How table bookings work at ${site.shortName}: group sizes, sitting times, running late and cancellations.`,
  alternates: { canonical: "/booking-policy" },
};

export default function BookingPolicyPage() {
  return (
    <PolicyPage
      title="Booking policy"
      path="/booking-policy"
      updated={policyUpdated.booking}
    >
      <p>
        By making a booking at {site.name}, you agree to the following.
      </p>

      <h2>Booking a table</h2>
      <ul>
        <li>
          You can book online for groups of up to eight. For more than eight,
          call us on <a href={site.bookingPhoneHref}>{site.bookingPhone}</a> or email{" "}
          <a href={`mailto:${site.email}`}>{site.email}</a>.
        </li>
        <li>
          Tables are held for {service.sittingMinutes.small} minutes for groups
          of one to four, and {service.sittingMinutes.large} minutes for groups
          of five or more.
        </li>
        <li>We don’t take a deposit or card details to hold a booking.</li>
      </ul>

      <h2>Running late</h2>
      <p>
        Your table may be released if you are significantly late. If you are
        running behind, please give us a call so we can hold it for you.
      </p>

      <h2>Changes and cancellations</h2>
      <p>
        If your group size changes or you can no longer make it, please let us
        know as early as possible so we can offer the table to someone else.
        Call us on <a href={site.bookingPhoneHref}>{site.bookingPhone}</a> or email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> and mention your
        booking reference.
      </p>

      <h2>Allergies and requests</h2>
      <p>
        Add allergies, high chairs or anything else we should know to the notes
        when you book, and remind our team when you arrive.
      </p>

      <h2>Your details</h2>
      <p>
        We use the details you give us to manage your booking and contact you
        about it. Read how we look after them in our{" "}
        <Link href="/privacy-policy">privacy policy</Link>.
      </p>

      <h2>Questions</h2>
      <p>
        Contact us at <a href={`mailto:${site.email}`}>{site.email}</a> or{" "}
        <a href={site.bookingPhoneHref}>{site.bookingPhone}</a>.
      </p>
    </PolicyPage>
  );
}
