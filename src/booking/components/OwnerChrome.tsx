"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { dateLabel, shiftDays, signOut, todayKey, type DateKey } from "../data";

/**
 * The console's own chrome, under the site header rather than instead of it.
 *
 * There is no `RequireOwner` here any more. Whether a page renders at all is
 * settled on the server by `ownerSignedIn()`, which reads a cookie script
 * cannot forge — a guard in the browser can only redirect after the console has
 * already painted.
 */
export function OwnerBar() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <header className="app__bar app__bar--owner">
      <span className="display t-13">Owner console</span>
      <nav className="owner-nav">
        <Link
          className={`owner-nav__link${pathname === "/owners/bookings" ? " is-current" : ""}`}
          href="/owners/bookings"
        >
          Run sheet
        </Link>
        <Link
          className={`owner-nav__link${pathname === "/owners/floor" ? " is-current" : ""}`}
          href="/owners/floor"
        >
          Floor
        </Link>
      </nav>
      <button
        type="button"
        className="btn btn--quiet btn--sm owner-bar__out"
        onClick={async () => {
          await signOut();
          // The gate is a server component, so the new cookie state only takes
          // effect once the router has been told to go back for it.
          router.replace("/owners");
          router.refresh();
        }}
      >
        Sign out
      </button>
    </header>
  );
}

/** Shared date control: previous day, the date itself, next day, and Today. */
export function DateBar({
  date,
  onChange,
  children,
}: {
  date: DateKey;
  onChange: (date: DateKey) => void;
  children?: ReactNode;
}) {
  const today = todayKey();
  return (
    <div className="datebar">
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        onClick={() => onChange(shiftDays(date, -1))}
        aria-label="Previous day"
      >
        <Chevron dir="left" />
      </button>
      <span className="display t-13 datebar__label">{dateLabel(date)}</span>
      <button
        type="button"
        className="btn btn--quiet btn--sm"
        onClick={() => onChange(shiftDays(date, 1))}
        aria-label="Next day"
      >
        <Chevron dir="right" />
      </button>
      {date !== today ? (
        <button type="button" className="btn btn--sm" onClick={() => onChange(today)}>
          Today
        </button>
      ) : null}
      <input
        className="field datebar__date"
        type="date"
        value={date}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label="Pick a date"
      />
      <span className="datebar__spacer" />
      {children}
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  const d = dir === "left" ? "M9 3 4 8l5 5" : "M7 3l5 5-5 5";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
