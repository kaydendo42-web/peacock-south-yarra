"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { nav, site } from "@/lib/site";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [open]);
  return (
    <header className="site-header" id="top">
      <div className="header-inner">
        <Link href="/" className="wordmark" aria-label={`${site.name} home`}>
          <span>THE</span> PEACOCK
          <span className="wordmark-dot" aria-hidden="true">
            ✳
          </span>
        </Link>
        <nav aria-label="Main navigation" className="desktop-nav">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rolling-link"
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <span className="rolling-label">
                <span>{item.label}</span>
                <span aria-hidden="true">{item.label}</span>
              </span>
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <Link
            className="mobile-booking"
            href="/book-a-table"
            aria-label="Book a table"
          >
            Book ↗
          </Link>
          <Link className="button button-small" href="/book-a-table">
            Book a table <span aria-hidden="true">↗</span>
          </Link>
          <button
            className="menu-toggle"
            type="button"
            ref={toggle}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen(!open)}
          >
            {open ? "Close −" : "Menu +"}
          </button>
        </div>
      </div>
      <nav
        id="mobile-nav"
        className="mobile-nav"
        aria-label="Mobile navigation"
        hidden={!open}
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={pathname === item.href ? "page" : undefined}
          >
            {item.label}
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
        <Link href="/book-a-table" onClick={() => setOpen(false)}>
          Book a table <span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
  );
}
