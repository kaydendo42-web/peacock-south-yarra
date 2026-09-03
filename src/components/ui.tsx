import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/**
 * The one button on the site: solid teal, square corners, 15px Raleway.
 * Measured at 220×44 on the home page.
 */
export function TealButton({
  href,
  children,
  className = "",
  ...rest
}: { href: string; children: ReactNode; className?: string } & Omit<
  ComponentProps<typeof Link>,
  "href" | "className" | "children"
>) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 min-w-[220px] items-center justify-center bg-teal px-6 font-button text-[15px] leading-[21px] text-white transition-colors hover:bg-teal-dark ${className}`}
      {...rest}
    >
      {children}
    </Link>
  );
}

/** Section heading: 26px DIN-substitute bold in the brighter teal. */
export function SectionHeading({
  children,
  as: Tag = "h2",
  className = "",
}: {
  children: ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag
      className={`font-display text-[24px] leading-tight font-semibold tracking-wide text-teal-bright uppercase lg:text-[26px] ${className}`}
    >
      {children}
    </Tag>
  );
}
