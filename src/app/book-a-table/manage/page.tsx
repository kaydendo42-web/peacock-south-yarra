import type { Metadata } from "next";
import { ManageBooking } from "@/booking/components/ManageBooking";

export const metadata: Metadata = {
  title: "Change your booking",
  robots: { index: false, follow: false },
};

/** Reached from the link in a booking confirmation; the signature is the key. */
export default async function ManageBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; t?: string }>;
}) {
  const { ref, t } = await searchParams;
  return (
    <section className="container manage-booking">
      <ManageBooking reference={ref ?? ""} token={t ?? ""} />
    </section>
  );
}
