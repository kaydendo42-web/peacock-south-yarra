"use client";
import BookingFlow from "./components/BookingFlow";

/**
 * The guest journey as it sits on the website.
 *
 * The standalone build wrapped this in its own header bar carrying the venue's
 * name. Here the site header is already doing that job two rows up, so the
 * frame starts straight in on the gate.
 */
export default function BookingExperience() {
  return (
    <div className="pt-root pt-frame">
      <div className="app">
        <BookingFlow />
      </div>
    </div>
  );
}
