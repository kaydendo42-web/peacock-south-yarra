"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site } from "@/lib/site";
import { InstagramIcon, FacebookIcon } from "@/components/icons";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the drawer on navigation so a tap-through never leaves it hanging open.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="relative z-50 bg-white">
      <div className="relative mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 lg:h-[120px] lg:items-start lg:px-[50px] lg:pt-[28px]">
        <Link href="/" aria-label={`${site.name} — home`} className="shrink-0 lg:mt-[3px]">
          <Image
            src="/images/logo.png"
            alt={site.name}
            width={190}
            height={27}
            priority
            className="h-[22px] w-auto lg:h-[27px]"
          />
        </Link>

        <nav
          aria-label="Primary"
          className="hidden lg:absolute lg:left-1/2 lg:top-[28px] lg:block lg:-translate-x-1/2"
        >
          <ul className="flex items-center gap-[25px]">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`font-ui text-[14px] leading-[41px] font-extrabold tracking-[0.04em] transition-colors hover:text-teal ${
                    isCurrent(item.href) ? "text-teal" : "text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2 lg:mt-[3px]">
          <SocialLinks />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="ml-2 flex h-10 w-10 flex-col items-center justify-center gap-[5px] lg:hidden"
          >
            <span
              className={`block h-[2px] w-6 bg-ink transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`}
            />
            <span className={`block h-[2px] w-6 bg-ink transition-opacity ${open ? "opacity-0" : ""}`} />
            <span
              className={`block h-[2px] w-6 bg-ink transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`}
            />
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Primary"
        hidden={!open}
        className="border-t border-black/10 bg-white lg:hidden"
      >
        <ul className="flex flex-col px-5 py-2">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={`block py-3 font-ui text-[15px] font-extrabold ${
                  isCurrent(item.href) ? "text-teal" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

function SocialLinks() {
  return (
    <>
      <a
        href={site.instagram}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${site.shortName} on Instagram`}
        className="text-ink transition-opacity hover:opacity-70"
      >
        <InstagramIcon className="h-[25px] w-[25px]" />
      </a>
      <a
        href={site.facebook}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${site.shortName} on Facebook`}
        className="text-ink transition-opacity hover:opacity-70"
      >
        <FacebookIcon className="h-[25px] w-[25px]" />
      </a>
    </>
  );
}
