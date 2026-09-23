# The Peacock Revamp — Implementation Plan (Codex pickup file)

> **Superseded, 23 September 2026.** Hosting moved back to Vercel (project
> `peacock-south-yarra`), and Jason's PeregrineTable booking system replaced
> Resos (`docs/BOOKING_SYSTEM.md`). Cloudflare Workers, OpenNext, Resos and
> the plan's task list no longer apply. `CLAUDE.md` holds the current rules.
> Kept for the record.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 1:1 Wix migration in this repo into a Ferea-style redesign of thepeacock.com.au, fed by Square's catalog, deployed on Cloudflare Workers, ready for DNS cutover.

**Architecture:** Section-based rebuild on the existing Next.js 16 App Router repo. `src/lib/site.ts` stays the NAP/hours/nav source of truth; `src/lib/menu.ts` becomes the fallback snapshot behind a new `src/lib/square/` layer that maps Square Catalog objects into the existing `MenuBoard` types. Pages are composed from `src/components/sections/*` on top of a small `src/components/ui/*` kit driven by `@theme` tokens. Bookings live behind `src/features/booking/BookingWidget` so Jason can replace Resos without touching pages. Deployment is `@opennextjs/cloudflare` with R2 incremental cache and a Durable Object queue for ISR.

**Tech Stack:** Next.js 16.3.4 (App Router, Server Actions, ISR) · React 19 · Tailwind CSS v4 (`@theme`) · TypeScript strict · Vitest · `@opennextjs/cloudflare` + Wrangler · Square Catalog REST API (no SDK) · Resend · Cloudflare Turnstile.

**Spec:** `docs/superpowers/specs/2026-09-21-peacock-revamp-design.md` — read it first. Every section number referenced below (§4.1, §7.4 …) points there.

## Global Constraints

- Next.js here is **16.3.4** and differs from older training data. Before writing any route, layout, image, font, config or caching code, read the relevant guide in `node_modules/next/dist/docs/` (run `npm install` first). No `middleware.ts` (it is `proxy.ts` in 16); no `export const runtime = "edge"` anywhere (§10.1).
- Node 20+, npm. Do not add pnpm/yarn lockfiles.
- `src/lib/site.ts` is the only place an address, phone, email or opening hour may be written (repo rule). Copy in `src/lib/content/*` must be exactly the text in spec §6 — no invented facts, no lorem ipsum, no stock reviews (§13).
- Tokens: only the eight colours in §4.1 and the two fonts in §4.2. Teal buttons use **cocoa** text, never white (§4.1).
- Light-only. No dark palette (repo rule).
- Keep `docs/research/*` and `_assets_raw/*` untouched.
- Every task ends with `npm run build` passing (it typechecks) and, where a test exists, `npm test` passing. Commit at the end of every task with the message given.
- Commit messages: imperative, lower-case type prefix (`feat:`, `chore:`, `docs:`, `test:`), no emoji.
- Inputs listed in spec §13 (Square token, reviews, Instagram images, Cloudflare/Resend/Turnstile keys) are supplied by Kayden. Where a task needs one and it is absent, do the code, leave the data module empty, and say so in the task's commit body — never fabricate.

---

## File map

Created
```
AGENTS.md                                   Codex entry point (already written — read it)
vitest.config.ts
src/lib/format.ts                           formatPrice, slugify, parseNameTags
src/lib/format.test.ts
src/lib/content/copy.ts                     all page copy from spec §6
src/lib/content/faq.ts
src/lib/content/reviews.ts                  empty until Kayden supplies
src/lib/content/instagram.ts                empty until Kayden supplies
src/lib/square/types.ts
src/lib/square/client.ts                    listCatalog() with pagination
src/lib/square/client.test.ts
src/lib/square/menu-map.ts                  category → board/section allowlist
src/lib/square/map-catalog.ts               pure mapper: objects → { food, drinks }
src/lib/square/map-catalog.test.ts
src/lib/square/featured.ts
src/lib/square/catalog.ts                   getMenu(), getFeaturedItems() with fallback + cache
src/lib/square/catalog.test.ts
src/lib/turnstile.ts
src/lib/turnstile.test.ts
scripts/square-dump.mjs
scripts/square-snapshot.mjs
src/components/ui/button.tsx
src/components/ui/pill.tsx
src/components/ui/section-card.tsx
src/components/ui/container.tsx
src/components/ui/stickers.tsx
src/components/ui/scroll-badge.tsx
src/components/ui/reveal.tsx                client
src/components/ui/stars.tsx
src/components/chrome/site-header.tsx       client (replaces src/components/site-header.tsx)
src/components/chrome/site-footer.tsx
src/components/sections/home/hero.tsx
src/components/sections/home/about.tsx
src/components/sections/home/menu-highlights.tsx
src/components/sections/home/values.tsx
src/components/sections/home/our-place.tsx
src/components/sections/home/specials.tsx
src/components/sections/home/reviews.tsx
src/components/sections/home/instagram-grid.tsx
src/components/sections/home/faq.tsx        + faq-accordion.tsx (client)
src/components/sections/home/cta-band.tsx
src/components/sections/menu/menu-nav.tsx   client
src/components/sections/menu/menu-board.tsx
src/components/sections/menu/menu-row.tsx
src/components/sections/menu/specials-strip.tsx
src/components/sections/contact/contact-details.tsx
src/components/contact/turnstile-widget.tsx client
src/features/booking/README.md
src/features/booking/BookingWidget.tsx
src/features/booking/ResosEmbed.tsx
src/features/booking/NativeBooking.tsx
wrangler.jsonc
open-next.config.ts
.dev.vars.example
docs/ops/DEPLOY.md
docs/ops/CUTOVER.md
docs/ops/dns-before.md                      template, filled by Kayden
docs/research/square/MAPPING.md             written after the dump
```

Modified
```
package.json                                scripts + deps
.gitignore                                  .open-next, .dev.vars
.env.example
src/app/globals.css                         tokens, fonts, utilities
src/app/layout.tsx                          fonts, shell
src/app/page.tsx                            composed from sections
src/app/menu/page.tsx
src/app/book-a-table/page.tsx
src/app/contact-us/page.tsx
src/app/contact-us/actions.ts               Turnstile verification
src/components/contact-form.tsx             restyle + Turnstile field
src/components/structured-data.tsx          MenuSchema takes data as props
src/lib/site.ts                             nav labels, peregrine URL
src/lib/menu.ts                             MenuItem.image?, menuSpecials.day
src/app/sitemap.ts                          drop /cafe-menu
next.config.ts                              /cafe-menu redirect, OpenNext dev init, remotePatterns
README.md, CLAUDE.md
```

Deleted
```
src/app/cafe-menu/page.tsx
src/components/site-header.tsx, site-footer.tsx, ui.tsx, hero-slideshow.tsx
docs/BOOKING_MIGRATION.md                   (content moves to src/features/booking/README.md)
```

---

## Phase 0 — Tooling and design system

### Task 1: Vitest and the format helpers

**Files:**
- Create: `vitest.config.ts`, `src/lib/format.ts`, `src/lib/format.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `formatPrice(cents: number): string`, `slugify(s: string): string`, `parseNameTags(name: string): { name: string; tags: string[] }`

- [ ] **Step 1: Install and configure Vitest**

```bash
npm install
npm install -D vitest
```

`vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  test: { include: ["src/**/*.test.ts"], environment: "node" },
});
```

Add to `package.json` scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 2: Write the failing tests**

`src/lib/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { formatPrice, parseNameTags, slugify } from "./format";

describe("formatPrice", () => {
  it("drops trailing zeros", () => {
    expect(formatPrice(400)).toBe("4");
    expect(formatPrice(750)).toBe("7.5");
    expect(formatPrice(1290)).toBe("12.9");
    expect(formatPrice(1275)).toBe("12.75");
  });
});

describe("slugify", () => {
  it("makes anchor-safe ids", () => {
    expect(slugify("Toast & Bakery")).toBe("toast-and-bakery");
    expect(slugify("Cold Pressed Juice")).toBe("cold-pressed-juice");
    expect(slugify("$5 Hump Day Hotcakes")).toBe("5-hump-day-hotcakes");
  });
});

describe("parseNameTags", () => {
  it("strips a trailing bracketed dietary suffix", () => {
    expect(parseNameTags("Carrot Cake (V, N)")).toEqual({ name: "Carrot Cake", tags: ["V", "N"] });
    expect(parseNameTags("Toast (GF/o, DF/o)")).toEqual({ name: "Toast", tags: ["GF/o", "DF/o"] });
  });
  it("leaves names without a recognised suffix alone", () => {
    expect(parseNameTags("Fish Tacos (3)")).toEqual({ name: "Fish Tacos (3)", tags: [] });
    expect(parseNameTags("Latte")).toEqual({ name: "Latte", tags: [] });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `./format`.

- [ ] **Step 4: Implement**

`src/lib/format.ts`:
```ts
/** Square prices arrive in cents; the menu prints "7.5", "12", "12.75". */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? String(dollars) : dollars.toFixed(2).replace(/0$/, "");
}

/** Anchor-safe ids for menu sections: "Toast & Bakery" → "toast-and-bakery". */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const DIETARY = /^(GF|V|VG|DF|N)(\/o)?$/i;

/**
 * "Carrot Cake (V, N)" → { name: "Carrot Cake", tags: ["V", "N"] }.
 * Only strips the suffix when every token is a dietary code, so "(3)" survives.
 */
export function parseNameTags(raw: string): { name: string; tags: string[] } {
  const match = raw.match(/^(.*?)\s*\(([^()]*)\)\s*$/);
  if (!match) return { name: raw.trim(), tags: [] };
  const tags = match[2].split(",").map((t) => t.trim()).filter(Boolean);
  if (tags.length === 0 || !tags.every((t) => DIETARY.test(t))) return { name: raw.trim(), tags: [] };
  return { name: match[1].trim(), tags: tags.map((t) => t.toUpperCase().replace("/O", "/o")) };
}
```

- [ ] **Step 5: Run tests, then build**

Run: `npm test && npm run build`
Expected: one test file, all green; build succeeds.

- [ ] **Step 6: Commit**

```bash
git add vitest.config.ts package.json package-lock.json src/lib/format.ts src/lib/format.test.ts
git commit -m "chore: add vitest and the price/slug/tag helpers"
```

### Task 2: Design tokens and fonts

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Produces: Tailwind utilities `bg-cream bg-sand bg-cocoa bg-teal bg-sun text-cocoa text-cocoa-soft text-teal text-teal-deep`, `font-display`, `font-body`, CSS vars `--gutter`, `--radius-card`, `--radius-photo`, utility classes `.display-1 .display-2 .display-3`, `.eyebrow`, `.section-gap`.

- [ ] **Step 1: Replace `globals.css`**

```css
@import "tailwindcss";

/*
  Revamp tokens — spec §4. Light-only by design.
  Cream/sand/cocoa carry the homey interior; teal is the signage accent.
*/
@theme {
  --color-cream: #f5f1e9;
  --color-sand: #e9e0d2;
  --color-cocoa: #5c3d2e;
  --color-cocoa-soft: #8a6a57;
  --color-teal: #18c1c0;
  --color-teal-deep: #0f8f8e;
  --color-sun: #f2b84b;
  --color-white: #ffffff;

  --font-display: var(--font-fira-condensed), Impact, "Arial Narrow", sans-serif;
  --font-body: var(--font-akshar), "Helvetica Neue", Arial, sans-serif;
}

:root {
  --gutter: 24px;
  --radius-card: 28px;
  --radius-photo: 24px;
}
@media (min-width: 768px) {
  :root { --gutter: 48px; --radius-card: 40px; --radius-photo: 32px; }
}
@media (min-width: 1280px) {
  :root { --gutter: max(64px, calc((100vw - 1440px) / 2 + 64px)); }
}

html { scroll-behavior: smooth; }

body {
  background: var(--color-cream);
  color: var(--color-cocoa);
  font-family: var(--font-body);
  font-size: 18px;
  line-height: 1.5;
}
@media (min-width: 1024px) { body { font-size: 20px; } }

/* Display scale — Fira Sans Extra Condensed 900, uppercase, tight. */
.display-1, .display-2, .display-3 {
  font-family: var(--font-display);
  font-weight: 900;
  text-transform: uppercase;
  line-height: 0.9;
  letter-spacing: -0.01em;
}
.display-1 { font-size: clamp(64px, 12vw, 176px); }
.display-2 { font-size: clamp(44px, 7vw, 104px); }
.display-3 { font-size: clamp(32px, 4vw, 56px); }

.eyebrow {
  font-family: var(--font-body);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.section-gap { margin-block-start: clamp(64px, 10vw, 140px); }

/* Scroll reveal — the Reveal component toggles .is-visible. */
[data-reveal] { opacity: 0; transform: translateY(24px); transition: opacity 600ms ease, transform 600ms ease; }
[data-reveal].is-visible { opacity: 1; transform: none; }

@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.float { animation: float 6s ease-in-out infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.spin-slow { animation: spin 20s linear infinite; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  [data-reveal] { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

:focus-visible { outline: 2px solid var(--color-teal); outline-offset: 3px; }

.skip-link {
  position: absolute; left: 0.5rem; top: -3rem; z-index: 100;
  background: var(--color-teal); color: var(--color-cocoa);
  padding: 0.5rem 1rem; font-weight: 600; font-size: 0.875rem;
  border-radius: 999px; transition: top 0.15s ease;
}
.skip-link:focus { top: 0.5rem; }

/* Hide scrollbars on horizontal card rails without disabling scrolling. */
.no-scrollbar { scrollbar-width: none; }
.no-scrollbar::-webkit-scrollbar { display: none; }
```

- [ ] **Step 2: Replace the fonts in `layout.tsx`**

Replace the five font imports and constants with:
```tsx
import { Akshar, Fira_Sans_Extra_Condensed } from "next/font/google";

const firaCondensed = Fira_Sans_Extra_Condensed({
  variable: "--font-fira-condensed",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});
const akshar = Akshar({
  variable: "--font-akshar",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});
```
Update the `<html className>` to `${firaCondensed.variable} ${akshar.variable} h-full antialiased`, and `<body className="flex min-h-full flex-col bg-cream text-cocoa">`. Rewrite `metadata.description`, `openGraph.description`, `twitter.description` to the spec §6.1 sentence:
"A plant-filled 1930s weatherboard house in South Yarra serving all-day brunch, St Ali coffee and ceremonial matcha. Dog-friendly deck and courtyard. Book a table."
Leave the `SiteHeader`/`SiteFooter` imports pointing at the old components for now; Task 4 swaps them.

- [ ] **Step 3: Build**

Run: `npm run build`
Expected: success. The old pages will look wrong (they reference removed tokens like `text-teal-bright`, which Tailwind now emits as no-ops) — that is expected until Phase 2.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: swap the Wix tokens for the revamp palette and type"
```

### Task 3: UI kit

**Files:**
- Create: `src/components/ui/container.tsx`, `button.tsx`, `pill.tsx`, `section-card.tsx`, `stickers.tsx`, `scroll-badge.tsx`, `reveal.tsx`, `stars.tsx`

**Interfaces:**
- Produces:
  - `Container({ children, className? })` — `max-w-[1440px] mx-auto px-[var(--gutter)]`
  - `Button({ href, children, variant?: "primary" | "secondary" | "dark", className? })`
  - `Pill({ children, tone?: "sand" | "teal" | "cream", tilt?: boolean, className? })`
  - `SectionCard({ children, tone: "cocoa" | "sand" | "teal" | "cream", id?, className? })`
  - `CoffeeSticker`, `BoneSticker`, `LeafSticker` — `({ className? })`
  - `ScrollBadge({ label?: string })`
  - `Reveal({ children, className?, as? })` — client
  - `Stars({ count?: number })`

- [ ] **Step 1: Write the components**

`container.tsx`:
```tsx
import type { ReactNode } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1440px] px-[var(--gutter)] ${className}`}>{children}</div>;
}
```

`button.tsx`:
```tsx
import Link from "next/link";
import type { ReactNode } from "react";

const variants = {
  primary: "bg-teal text-cocoa hover:bg-teal-deep",
  secondary: "border-2 border-cocoa text-cocoa hover:bg-cocoa hover:text-cream",
  dark: "bg-cocoa text-cream hover:bg-cocoa-soft",
} as const;

export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  const external = href.startsWith("http");
  const cls = `eyebrow inline-flex h-[52px] items-center gap-3 rounded-full px-6 transition-colors ${variants[variant]} ${className}`;
  const arrow = (
    <span aria-hidden="true" className="grid h-7 w-7 place-items-center rounded-full bg-cocoa/15">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 6h8M6 2l4 4-4 4" />
      </svg>
    </span>
  );
  return external ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>
      {children}
      {arrow}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
      {arrow}
    </Link>
  );
}
```

`pill.tsx`:
```tsx
import type { ReactNode } from "react";

const tones = {
  sand: "bg-sand text-cocoa",
  teal: "bg-teal text-cocoa",
  cream: "bg-cream text-cocoa",
} as const;

export function Pill({
  children,
  tone = "sand",
  tilt = true,
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof tones;
  tilt?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`eyebrow inline-block rounded-full px-5 py-2 ${tones[tone]} ${tilt ? "-rotate-3" : ""} ${className}`}
    >
      {children}
    </span>
  );
}
```

`section-card.tsx`:
```tsx
import type { ReactNode } from "react";

const tones = {
  cocoa: "bg-cocoa text-cream",
  sand: "bg-sand text-cocoa",
  teal: "bg-teal text-cocoa",
  cream: "bg-cream text-cocoa",
} as const;

/** The big rounded band inset from the viewport — Ferea's signature block. */
export function SectionCard({
  children,
  tone,
  id,
  className = "",
}: {
  children: ReactNode;
  tone: keyof typeof tones;
  id?: string;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-[var(--gutter)] rounded-[var(--radius-card)] px-6 py-16 md:px-12 md:py-24 ${tones[tone]} ${className}`}
    >
      {children}
    </section>
  );
}
```

`stickers.tsx` — three decorative inline SVGs. Each is `aria-hidden`, white fill with a cocoa stroke and a soft drop shadow so it reads as a sticker:
```tsx
const base = "drop-shadow-[0_6px_12px_rgba(92,61,46,0.25)]";

export function CoffeeSticker({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" className={`${base} ${className}`} fill="#fff" stroke="#5c3d2e" strokeWidth="3" strokeLinejoin="round">
      <path d="M18 34h48v22a20 20 0 0 1-20 20h-8a20 20 0 0 1-20-20V34z" />
      <path d="M66 40h8a8 8 0 0 1 0 16h-8" />
      <path d="M14 82h60" strokeLinecap="round" />
      <path d="M34 16c0 6-6 6-6 12M46 16c0 6-6 6-6 12" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BoneSticker({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 48" className={`${base} ${className}`} fill="#fff" stroke="#5c3d2e" strokeWidth="3" strokeLinejoin="round">
      <path d="M22 12a8 8 0 0 1 10 6h32a8 8 0 1 1 10 12 8 8 0 1 1-10 12H32a8 8 0 1 1-10-12 8 8 0 0 1 0-18z" />
    </svg>
  );
}

export function LeafSticker({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 96 96" className={`${base} ${className}`} fill="#fff" stroke="#5c3d2e" strokeWidth="3" strokeLinejoin="round">
      <path d="M16 80C16 40 40 16 80 16c0 40-24 64-64 64z" />
      <path d="M16 80L60 36" strokeLinecap="round" fill="none" />
    </svg>
  );
}
```

`scroll-badge.tsx`:
```tsx
/** Rotating "DISCOVER MORE" ring with a down arrow — decorative. */
export function ScrollBadge({ label = "Discover more • Discover more • " }: { label?: string }) {
  return (
    <div aria-hidden="true" className="relative mx-auto h-36 w-36">
      <svg viewBox="0 0 144 144" className="spin-slow h-full w-full">
        <defs>
          <path id="ring" d="M72 72m-56 0a56 56 0 1 1 112 0a56 56 0 1 1 -112 0" />
        </defs>
        <text className="eyebrow fill-current" style={{ fontSize: 15 }}>
          <textPath href="#ring">{label.repeat(2)}</textPath>
        </text>
      </svg>
      <svg viewBox="0 0 24 24" className="absolute inset-0 m-auto h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3v18M5 14l7 7 7-7" />
      </svg>
    </div>
  );
}
```

`reveal.tsx` (client):
```tsx
"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Fades children up on first entry into the viewport. CSS in globals.css. */
export function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (!("IntersectionObserver" in window)) {
      node.classList.add("is-visible");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            node.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
```

`stars.tsx`:
```tsx
export function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-1" aria-label={`${count} out of 5 stars`} role="img">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 20 20" className={`h-5 w-5 ${i < count ? "fill-current" : "fill-current opacity-30"}`} aria-hidden="true">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L10 14.9l-5.2 2.8 1-5.9L1.5 7.7l5.9-.8z" />
        </svg>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: success (unused components are fine).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui
git commit -m "feat: add the revamp ui kit"
```

### Task 4: Header, footer, nav

**Files:**
- Create: `src/components/chrome/site-header.tsx`, `src/components/chrome/site-footer.tsx`
- Modify: `src/lib/site.ts`, `src/app/layout.tsx`
- Delete: `src/components/site-header.tsx`, `src/components/site-footer.tsx`

**Interfaces:**
- Consumes: `nav`, `site`, `hours` from `@/lib/site`; `InstagramIcon`, `FacebookIcon` from `@/components/icons`; `Button` from `@/components/ui/button`.
- Produces: `site.peregrineUrl`, `nav` with new labels, `hoursSummary` string export.

- [ ] **Step 1: Update `site.ts`**

Replace `nav` with:
```ts
export const nav = [
  { href: "/", label: "Home" },
  { href: "/menu", label: "Menu" },
  { href: "/book-a-table", label: "Book a Table" },
  { href: "/contact-us", label: "Contact" },
] as const;
```
Add to `site`: `peregrineUrl: "https://www.peregrinepartners.space",` and add after `hours`:
```ts
/** "Mon–Fri 7am–3pm · Sat–Sun 8am–3pm" — the chip under the hero buttons. */
export const hoursSummary = `Mon–Fri ${hours.weekdays.display.replace(/ - /, "–")} · Sat–Sun ${hours.weekend.display.replace(/ - /, "–")}`;
```

- [ ] **Step 2: Write the header**

`src/components/chrome/site-header.tsx`:
```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { nav, site, hoursSummary } from "@/lib/site";
import { InstagramIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={`sticky top-0 z-50 bg-cream/85 backdrop-blur-md transition-shadow ${
        scrolled ? "shadow-[0_1px_0_rgba(92,61,46,0.1)]" : ""
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-[var(--gutter)]">
        <Link href="/" aria-label={`${site.name} — home`} className="shrink-0">
          <Image src="/images/logo.png" alt={site.name} width={190} height={27} priority className="h-6 w-auto lg:h-7" />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(item.href) ? "page" : undefined}
                  className={`eyebrow transition-colors hover:text-teal-deep ${isCurrent(item.href) ? "text-teal-deep" : "text-cocoa"}`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${site.shortName} on Instagram`}
            className="hidden text-cocoa transition-opacity hover:opacity-70 sm:block"
          >
            <InstagramIcon className="h-6 w-6" />
          </a>
          <div className="hidden lg:block">
            <Button href="/book-a-table">Book a table</Button>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex h-11 w-11 flex-col items-center justify-center gap-[5px] lg:hidden"
          >
            <span className={`block h-[2px] w-6 bg-cocoa transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block h-[2px] w-6 bg-cocoa transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block h-[2px] w-6 bg-cocoa transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      <nav
        id="mobile-nav"
        aria-label="Primary"
        hidden={!open}
        className="fixed inset-0 top-20 z-40 flex flex-col justify-between bg-cream px-[var(--gutter)] pb-10 pt-6 lg:hidden"
      >
        <ul className="flex flex-col gap-2">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isCurrent(item.href) ? "page" : undefined}
                className={`display-2 block py-2 ${isCurrent(item.href) ? "text-teal-deep" : "text-cocoa"}`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="space-y-4">
          <p className="text-cocoa-soft">{hoursSummary}</p>
          <Button href="/book-a-table" className="w-full justify-center">
            Book a table
          </Button>
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Write the footer**

`src/components/chrome/site-footer.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import { hours, nav, site } from "@/lib/site";
import { FacebookIcon, InstagramIcon } from "@/components/icons";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-[clamp(64px,10vw,140px)] bg-cocoa text-cream">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-[var(--gutter)] py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Image src="/images/logo.png" alt={site.name} width={190} height={27} className="h-6 w-auto brightness-0 invert" />
          <p className="text-cream/80">{site.strapline}</p>
        </div>

        <nav aria-label="Footer">
          <h2 className="eyebrow mb-4 text-cream/60">Pages</h2>
          <ul className="space-y-2">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-teal">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="eyebrow mb-4 text-cream/60">Hours</h2>
          <dl className="space-y-2">
            <div className="flex justify-between gap-4"><dt>Mon – Fri</dt><dd>{hours.weekdays.display}</dd></div>
            <div className="flex justify-between gap-4"><dt>Sat – Sun</dt><dd>{hours.weekend.display}</dd></div>
            <div className="flex justify-between gap-4"><dt>Public holidays</dt><dd>{hours.publicHolidays.display}</dd></div>
          </dl>
        </div>

        <address className="not-italic">
          <h2 className="eyebrow mb-4 text-cream/60">Find us</h2>
          <p>{site.street}<br />{site.suburb} {site.state} {site.postcode}</p>
          <p className="mt-3">
            <a href={site.phoneHref} className="hover:text-teal">{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`} className="hover:text-teal">{site.email}</a>
          </p>
          <div className="mt-4 flex gap-3">
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" aria-label={`${site.shortName} on Instagram`} className="hover:text-teal"><InstagramIcon className="h-6 w-6" /></a>
            <a href={site.facebook} target="_blank" rel="noopener noreferrer" aria-label={`${site.shortName} on Facebook`} className="hover:text-teal"><FacebookIcon className="h-6 w-6" /></a>
          </div>
        </address>
      </div>

      <div className="border-t border-cream/15">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-[var(--gutter)] py-6 text-sm text-cream/70">
          <p>© {year} {site.name}</p>
          <p>
            Site by{" "}
            <a href={site.peregrineUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-teal">
              Peregrine Partners
            </a>
          </p>
          <a href="#main" className="hover:text-teal">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Wire the layout and delete the old chrome**

In `layout.tsx` change the imports to `@/components/chrome/site-header` and `@/components/chrome/site-footer`. Then:
```bash
git rm src/components/site-header.tsx src/components/site-footer.tsx
```
Check `icons.tsx` exports `InstagramIcon` and `FacebookIcon` (it does) and that nothing else imported the deleted files (`grep -rn "components/site-" src`).

- [ ] **Step 5: Build and eyeball**

Run: `npm run build && npm run dev` — open http://localhost:3000, check header sticky/blur, drawer opens and locks scroll at 390px, footer columns stack. Stop the dev server.

- [ ] **Step 6: Commit**

```bash
git add -A src/components/chrome src/lib/site.ts src/app/layout.tsx
git commit -m "feat: new header and footer for the revamp"
```

---

## Phase 1 — Content and the Square menu layer

### Task 5: Content modules

**Files:**
- Create: `src/lib/content/copy.ts`, `src/lib/content/faq.ts`, `src/lib/content/reviews.ts`, `src/lib/content/instagram.ts`
- Modify: `src/lib/menu.ts` (add `image?` to `MenuItem`; add `day` to specials)

**Interfaces:**
- Produces:
  - `copy` object (exact shape below) consumed by every home/menu/book/contact section
  - `faq: { q: string; a: string }[]`
  - `reviews: Review[]` where `Review = { name: string; quote: string; when: string }`
  - `instagram: InstagramTile[]` where `InstagramTile = { src: string; alt: string; href: string }`
  - `MenuItem.image?: string`

- [ ] **Step 1: `copy.ts`** — every string is verbatim from spec §6. Do not edit wording.

```ts
/** All page copy, verbatim from docs/superpowers/specs/2026-09-21-peacock-revamp-design.md §6. */
export const copy = {
  home: {
    hero: {
      sticker: "South Yarra · Est. in a 1930s house",
      line1: "Good morning",
      line2: "South Yarra",
      eyebrow: "Our story",
      body:
        "A beautifully renovated 1930s weatherboard house in the heart of South Yarra, filled with plants and cosy corners. Brunch all day, coffee by St Ali, and a courtyard where your dog is as welcome as you are.",
      primary: "Book a table",
      secondary: "See the menu",
    },
    about: {
      pill: "About us",
      line1: "More than brunch",
      line2: "It's your local",
      body:
        "Whether you're meeting friends for a coffee or settling in over brunch, the menu caters to everyone, with a great range of vegetarian and vegan options. Grab a spot on the front deck, the rear courtyard or inside among the plants.",
    },
    highlights: {
      pill: "Our menu",
      title: "What we're known for",
      link: "View the full menu",
      cardLink: "See it on the menu",
    },
    values: {
      items: [
        {
          title: "All day, every day",
          body: "The whole menu runs from open to close. Hotcakes at 2pm is a perfectly reasonable decision.",
          image: "/images/hero-5.jpg",
          alt: "A seasonal dish from the all day menu",
        },
        {
          title: "St Ali coffee & ceremonial matcha",
          body: "Orthodox by St Ali on the machine, and ceremonial-grade matcha from Shizuoka, Japan.",
          image: "/images/cafe-menu-hero.jpg",
          alt: "A heart-topped latte between two salads",
        },
        {
          title: "Furbabies welcome",
          body: "Dogs are welcome on the front deck and in the rear courtyard. Shout them a housemade peanut butter doggo biscuit.",
          image: "/images/hero-1.jpg",
          alt: "A shared table of brunch dishes on the deck",
        },
      ],
    },
    place: {
      pill: "Our place",
      line1: "Where good",
      line2: "mornings begin",
      directions: "Get directions",
      photos: [
        { src: "/images/shopfront.jpg", alt: "The Peacock shopfront on River Street" },
        { src: "/images/hero-3.jpg", alt: "Inside the plant-filled dining room" },
        { src: "/images/peacock-sign.jpg", alt: "The Peacock sign on the greenery-covered fence" },
      ],
    },
    specials: {
      pill: "This week",
      title: "The regulars' tricks",
      cta: "Book a table",
      image: "/images/hero-2.jpg",
      alt: "French toast with strawberries and kiwi",
    },
    reviews: {
      pill: "Reviews",
      line1: "Hear from",
      line2: "the locals",
      source: "Google review",
      link: "Read more on Google",
    },
    faq: {
      pill: "FAQ",
      title: "Good to know",
      more: "Something else? Get in touch",
    },
    cta: {
      line1: "Come find",
      line2: "your new local",
      button: "Book a table",
    },
  },
  menu: {
    pill: "Menu",
    line1: "All day",
    line2: "Every day",
    intro:
      "Served all day, every day. Coffee is Orthodox by St Ali and our matcha is ceremonial grade from Shizuoka, Japan.",
    cta: "Book a table",
  },
  book: {
    pill: "Bookings",
    line1: "Save",
    line2: "your spot",
    beforeTitle: "Before you book",
    groups: "Groups over ten: call us on",
    mimosas: "Bottomless mimosas need a 1.5-hour sitting and start from 10am.",
    surcharge: "10% surcharge on weekends, 15% on public holidays.",
    nativeStub: "Online bookings are getting an upgrade. Call us on",
  },
  contact: {
    pill: "Contact",
    title: "Say hello",
    intro:
      "At The Peacock South Yarra, we love feedback! We're always looking for ways to improve our customer's experience and would love for you to get in touch.",
    success: "Thanks for getting in touch — we'll come back to you shortly.",
    directions: "Get directions",
    review: "Leave us a review on Google",
  },
} as const;
```

- [ ] **Step 2: `faq.ts`**

```ts
export type FaqEntry = { q: string; a: string };

/** Only facts already published on the Wix site or the menu boards. */
export const faq: FaqEntry[] = [
  { q: "Do you take bookings?", a: "Yes — book online for up to ten people. For groups larger than ten, call us on {phone}." },
  { q: "Can I bring my dog?", a: "Absolutely. Dogs are welcome on the front deck and in the rear courtyard, and there's a housemade peanut butter doggo biscuit with their name on it." },
  { q: "Do you have vegetarian, vegan or gluten-free options?", a: "Plenty. The menu marks vegetarian (V), vegan (VG), gluten-free (GF) and dairy-free (DF) dishes and options, and nuts (N)." },
  { q: "Is there a surcharge?", a: "A 10% surcharge applies on weekends and 15% on public holidays." },
  { q: "Can we split the bill?", a: "Sorry — we're unable to split bills on weekends or during busy periods." },
  { q: "Do you sell gift cards?", a: "Yes. Prepaid coffee cards are available at the counter and make an easy gift." },
];
```
`{phone}` is substituted with `site.phone` by the FAQ component (Task 12) so the number is never duplicated outside `site.ts`.

- [ ] **Step 3: `reviews.ts` and `instagram.ts`** — empty until Kayden supplies data (spec §13)

```ts
// reviews.ts
export type Review = { name: string; quote: string; when: string };

/** Curated Google reviews. Empty array = the Reviews section renders nothing. Supplied by Kayden. */
export const reviews: Review[] = [];
```
```ts
// instagram.ts
export type InstagramTile = { src: string; alt: string; href: string };

/** Curated tiles from @thepeacock_southyarra. Images live in public/images/instagram/. Supplied by Kayden. */
export const instagram: InstagramTile[] = [];
```

- [ ] **Step 4: Extend `menu.ts`**

Add to `MenuItem`: `/** Absolute or site-relative image URL when one exists. */ image?: string;`
Change `menuSpecials` entries to include a `day` label used by the home Specials rows:
```ts
export const menuSpecials = [
  { id: "hump-day", day: "Wednesday", title: "$5 Hump Day Hotcakes", detail: "$5 per hotcake, available Wednesday only." },
  { id: "j5-matcha", day: "Mon – Fri", title: "$5 Matcha", detail: "Excludes public holidays. Alternative milk additional." },
  { id: "bottomless-mimosas", day: "Every day from 10am", title: "Bottomless Mimosas", detail: "$49 per person for a choice of dish and 1.5 hours of mimosas." },
] as const;
```
The existing `/menu` page reads `special.title` and `special.detail`; it still compiles.

- [ ] **Step 5: Build and commit**

Run: `npm run build`
```bash
git add src/lib/content src/lib/menu.ts
git commit -m "feat: page copy, faq, and empty review/instagram modules"
```

### Task 6: Square client and dump script

**Files:**
- Create: `src/lib/square/types.ts`, `src/lib/square/client.ts`, `src/lib/square/client.test.ts`, `scripts/square-dump.mjs`
- Modify: `.env.example`

**Interfaces:**
- Produces: `listCatalog(opts?: { types?: string[]; fetchImpl?: typeof fetch }): Promise<SquareCatalogObject[]>`; `SquareConfigError`; the `SquareCatalogObject` union.

- [ ] **Step 1: Types**

`types.ts`:
```ts
export type SquareMoney = { amount: number; currency: string };

export type SquareItemVariation = {
  type: "ITEM_VARIATION";
  id: string;
  is_deleted?: boolean;
  item_variation_data: {
    item_id?: string;
    name?: string;
    ordinal?: number;
    pricing_type?: "FIXED_PRICING" | "VARIABLE_PRICING";
    price_money?: SquareMoney;
  };
};

export type SquareItem = {
  type: "ITEM";
  id: string;
  is_deleted?: boolean;
  present_at_all_locations?: boolean;
  present_at_location_ids?: string[];
  absent_at_location_ids?: string[];
  item_data: {
    name: string;
    description?: string;
    description_plaintext?: string;
    is_archived?: boolean;
    ordinal?: number;
    categories?: { id: string; ordinal?: number }[];
    reporting_category?: { id: string };
    image_ids?: string[];
    variations?: SquareItemVariation[];
  };
};

export type SquareCategory = {
  type: "CATEGORY";
  id: string;
  is_deleted?: boolean;
  category_data: { name: string; ordinal?: number };
};

export type SquareImage = {
  type: "IMAGE";
  id: string;
  is_deleted?: boolean;
  image_data: { name?: string; url?: string };
};

export type SquareOther = { type: string; id: string; is_deleted?: boolean };

export type SquareCatalogObject = SquareItem | SquareCategory | SquareImage | SquareOther;

export type ListCatalogResponse = {
  objects?: SquareCatalogObject[];
  cursor?: string;
  errors?: { category: string; code: string; detail?: string }[];
};
```

- [ ] **Step 2: Failing client test**

`client.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { listCatalog, SquareConfigError } from "./client";

const page = (objects: unknown[], cursor?: string) =>
  new Response(JSON.stringify({ objects, cursor }), { status: 200, headers: { "content-type": "application/json" } });

describe("listCatalog", () => {
  it("throws SquareConfigError without a token", async () => {
    await expect(listCatalog({ token: "" })).rejects.toBeInstanceOf(SquareConfigError);
  });

  it("follows cursors until exhausted and concatenates objects", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(page([{ type: "ITEM", id: "a" }], "c1"))
      .mockResolvedValueOnce(page([{ type: "ITEM", id: "b" }]));
    const objects = await listCatalog({ token: "t", fetchImpl });
    expect(objects.map((o) => o.id)).toEqual(["a", "b"]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const secondUrl = String(fetchImpl.mock.calls[1][0]);
    expect(secondUrl).toContain("cursor=c1");
    expect(secondUrl).toContain("types=ITEM%2CCATEGORY%2CIMAGE");
  });

  it("sends the bearer token and a pinned Square-Version", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(page([]));
    await listCatalog({ token: "t", fetchImpl });
    const init = fetchImpl.mock.calls[0][1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer t");
    expect(headers.get("square-version")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("throws on a non-2xx response with the Square error detail", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ errors: [{ category: "AUTHENTICATION_ERROR", code: "UNAUTHORIZED", detail: "bad token" }] }), { status: 401 }),
    );
    await expect(listCatalog({ token: "t", fetchImpl })).rejects.toThrow(/UNAUTHORIZED.*bad token/);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- src/lib/square/client.test.ts`
Expected: FAIL — cannot resolve `./client`.

- [ ] **Step 4: Implement the client**

`client.ts`:
```ts
import type { ListCatalogResponse, SquareCatalogObject } from "./types";

/**
 * Pinned so a Square API change never silently changes the menu shape.
 * Bump deliberately after checking https://developer.squareup.com/docs/build-basics/versioning-overview
 */
export const SQUARE_VERSION = "2025-08-20";
const BASE = "https://connect.squareup.com/v2";

export class SquareConfigError extends Error {
  constructor(message = "Square is not configured") {
    super(message);
    this.name = "SquareConfigError";
  }
}

export type ListCatalogOptions = {
  token?: string;
  types?: string[];
  fetchImpl?: typeof fetch;
};

/** GET /v2/catalog/list, following cursors until Square stops returning one. */
export async function listCatalog({
  token = process.env.SQUARE_ACCESS_TOKEN ?? "",
  types = ["ITEM", "CATEGORY", "IMAGE"],
  fetchImpl = fetch,
}: ListCatalogOptions = {}): Promise<SquareCatalogObject[]> {
  if (!token) throw new SquareConfigError("SQUARE_ACCESS_TOKEN is not set");

  const objects: SquareCatalogObject[] = [];
  let cursor: string | undefined;

  do {
    const url = new URL(`${BASE}/catalog/list`);
    url.searchParams.set("types", types.join(","));
    if (cursor) url.searchParams.set("cursor", cursor);

    const res = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Square-Version": process.env.SQUARE_API_VERSION ?? SQUARE_VERSION,
        Accept: "application/json",
      },
    });

    const body = (await res.json().catch(() => ({}))) as ListCatalogResponse;
    if (!res.ok) {
      const first = body.errors?.[0];
      throw new Error(`Square ${res.status}: ${first?.code ?? "UNKNOWN"} ${first?.detail ?? ""}`.trim());
    }

    objects.push(...(body.objects ?? []));
    cursor = body.cursor;
  } while (cursor);

  return objects;
}
```
Before committing, open https://developer.squareup.com/reference/square/catalog-api/list-catalog and confirm the path, the `types` query parameter and the current version date; update `SQUARE_VERSION` to the latest date listed.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all green.

- [ ] **Step 6: Dump script**

`scripts/square-dump.mjs` (plain Node, reads `.env.local` or `.dev.vars` if present):
```js
#!/usr/bin/env node
/**
 * Discovery: dump the whole Square catalog so the menu mapping is decided from
 * real data. Output: docs/research/square/catalog-YYYY-MM-DD.json
 *
 *   SQUARE_ACCESS_TOKEN=… node scripts/square-dump.mjs
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";

async function loadEnv() {
  for (const file of [".dev.vars", ".env.local"]) {
    try {
      const text = await readFile(file, "utf8");
      for (const line of text.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"#]*)"?\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
      }
    } catch {}
  }
}

await loadEnv();
const token = process.env.SQUARE_ACCESS_TOKEN;
if (!token) {
  console.error("SQUARE_ACCESS_TOKEN missing");
  process.exit(1);
}

const version = process.env.SQUARE_API_VERSION ?? "2025-08-20";
const objects = [];
let cursor;
do {
  const url = new URL("https://connect.squareup.com/v2/catalog/list");
  url.searchParams.set("types", "ITEM,CATEGORY,IMAGE,MODIFIER_LIST,CUSTOM_ATTRIBUTE_DEFINITION");
  if (cursor) url.searchParams.set("cursor", cursor);
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Square-Version": version } });
  const body = await res.json();
  if (!res.ok) {
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }
  objects.push(...(body.objects ?? []));
  cursor = body.cursor;
} while (cursor);

const date = new Date().toISOString().slice(0, 10);
await mkdir("docs/research/square", { recursive: true });
const out = `docs/research/square/catalog-${date}.json`;
await writeFile(out, JSON.stringify(objects, null, 2));

const counts = {};
for (const o of objects) counts[o.type] = (counts[o.type] ?? 0) + 1;
const categories = objects.filter((o) => o.type === "CATEGORY").map((o) => o.category_data?.name);
console.log(`wrote ${out}`);
console.log("counts", counts);
console.log("categories", categories);
```
Add `"square:dump": "node scripts/square-dump.mjs"` to `package.json` scripts.

- [ ] **Step 7: `.env.example`**

Append:
```
# Square Catalog — the menu source of truth (spec §7). Without these the site
# renders the snapshot in src/lib/menu.ts.
SQUARE_ACCESS_TOKEN=
SQUARE_LOCATION_ID=
# Optional override of the pinned Square-Version header.
SQUARE_API_VERSION=
```

- [ ] **Step 8: Commit**

```bash
git add src/lib/square/types.ts src/lib/square/client.ts src/lib/square/client.test.ts scripts/square-dump.mjs package.json .env.example
git commit -m "feat: square catalog client and discovery dump script"
```

### Task 7: Catalog → menu mapper

**Files:**
- Create: `src/lib/square/menu-map.ts`, `src/lib/square/map-catalog.ts`, `src/lib/square/map-catalog.test.ts`, `src/lib/square/featured.ts`

**Interfaces:**
- Consumes: `formatPrice`, `slugify`, `parseNameTags` from `@/lib/format`; `MenuBoard`, `MenuItem` from `@/lib/menu`; types from `./types`.
- Produces:
  - `menuMap: Record<string, { board: "food" | "drinks"; title: string; order: number; subtitle?: string }>` keyed by **lower-cased Square category name**
  - `mapCatalog(objects: SquareCatalogObject[], opts: { locationId: string; map?: typeof menuMap }): { food: MenuBoard; drinks: MenuBoard }`
  - `featuredNames: string[]`

- [ ] **Step 1: The initial map**

`menu-map.ts` — seeded from the section titles in `menu.ts`. **After the discovery dump (Task 8) the keys are corrected to the real Square category names.**
```ts
export type SectionTarget = { board: "food" | "drinks"; title: string; order: number; subtitle?: string };

/**
 * Square category name (lower-cased) → menu section. Anything not listed is
 * dropped, which is how retail, gift cards and modifiers stay off the menu.
 * Keys are corrected against docs/research/square/MAPPING.md after discovery.
 */
export const menuMap: Record<string, SectionTarget> = {
  "toast & bakery": { board: "food", title: "Toast & Bakery", order: 10 },
  breakfast: { board: "food", title: "Breakfast", order: 20 },
  "burgers & lunch": { board: "food", title: "Burgers & Lunch", order: 30 },
  kids: { board: "food", title: "Kids", order: 40 },
  sides: { board: "food", title: "Sides", order: 50 },
  coffee: { board: "drinks", title: "Coffee", order: 10, subtitle: "Orthodox by St Ali" },
  "something warm": { board: "drinks", title: "Something Warm", order: 20 },
  tea: { board: "drinks", title: "Tea", order: 30 },
  matcha: { board: "drinks", title: "Matcha", order: 40 },
  "iced drinks": { board: "drinks", title: "Iced Drinks", order: 50 },
  "something fizzy": { board: "drinks", title: "Something Fizzy", order: 60 },
  smoothies: { board: "drinks", title: "Smoothies", order: 70 },
  "cold pressed juice": { board: "drinks", title: "Cold Pressed Juice", order: 80 },
  cocktails: { board: "drinks", title: "Cocktails", order: 90 },
};
```

`featured.ts`:
```ts
/** Square item names (tag suffix stripped, case-insensitive) shown on the home carousel. */
export const featuredNames = [
  "Blueberry Honeycomb Hotcakes",
  "The Peacock",
  "Chilli Crab Scramble",
  "Truffle Mushrooms",
  "Peacock Dirty Chai",
  "Coconut Cloud Matcha Latte",
];
```

- [ ] **Step 2: Failing mapper tests**

`map-catalog.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mapCatalog } from "./map-catalog";
import type { SquareCatalogObject, SquareItem } from "./types";

const LOC = "L1";

const category = (id: string, name: string): SquareCatalogObject => ({ type: "CATEGORY", id, category_data: { name } });
const image = (id: string, url: string): SquareCatalogObject => ({ type: "IMAGE", id, image_data: { url } });

type ItemExtra = Partial<Omit<SquareItem, "type" | "id" | "item_data">> & { item_extra?: Partial<SquareItem["item_data"]> };

const item = (
  id: string,
  name: string,
  categoryId: string,
  variations: { name?: string; cents?: number }[],
  { item_extra = {}, ...extra }: ItemExtra = {},
): SquareItem => ({
  type: "ITEM",
  id,
  present_at_all_locations: true,
  ...extra,
  item_data: {
    name,
    categories: [{ id: categoryId }],
    variations: variations.map((v, i) => ({
      type: "ITEM_VARIATION" as const,
      id: `${id}-v${i}`,
      item_variation_data: { name: v.name, ordinal: i, ...(v.cents !== undefined ? { price_money: { amount: v.cents, currency: "AUD" } } : {}) },
    })),
    ...item_extra,
  },
});

describe("mapCatalog", () => {
  it("places items in the mapped section with formatted prices and parsed tags", () => {
    const out = mapCatalog([category("c1", "Breakfast"), item("i1", "Avocado Toast (V, GF/o)", "c1", [{ cents: 1850 }])], { locationId: LOC });
    expect(out.food.sections).toHaveLength(1);
    expect(out.food.sections[0]).toMatchObject({ id: "breakfast", title: "Breakfast" });
    expect(out.food.sections[0].items[0]).toEqual({ name: "Avocado Toast", price: "18.5", tags: ["V", "GF/o"] });
  });

  it("drops items whose category is not in the map", () => {
    const out = mapCatalog([category("c9", "Retail"), item("i1", "Tote Bag", "c9", [{ cents: 2500 }])], { locationId: LOC });
    expect(out.food.sections).toHaveLength(0);
    expect(out.drinks.sections).toHaveLength(0);
  });

  it("drops deleted, archived and absent-at-location items", () => {
    const objs = [
      category("c1", "Breakfast"),
      item("i1", "Gone", "c1", [{ cents: 100 }], { is_deleted: true }),
      item("i2", "Archived", "c1", [{ cents: 100 }], { item_extra: { is_archived: true } }),
      item("i3", "Elsewhere", "c1", [{ cents: 100 }], { present_at_all_locations: false, present_at_location_ids: ["L2"] }),
      item("i4", "Here", "c1", [{ cents: 100 }], { present_at_all_locations: false, present_at_location_ids: [LOC] }),
    ];
    const out = mapCatalog(objs, { locationId: LOC });
    expect(out.food.sections[0].items.map((i) => i.name)).toEqual(["Here"]);
  });

  it("uses the lowest price and a note for two or more variations", () => {
    const objs = [
      category("c1", "Coffee"),
      item("i1", "Latte", "c1", [{ name: "Small", cents: 500 }, { name: "Large", cents: 600 }]),
      item("i2", "Tea", "c1", [{ name: "Cup", cents: 450 }, { name: "Pot", cents: 700 }, { name: "Jug", cents: 900 }]),
    ];
    const out = mapCatalog(objs, { locationId: LOC });
    const [latte, tea] = out.drinks.sections[0].items;
    expect(latte).toMatchObject({ price: "5", note: "Small 5 · Large 6" });
    expect(tea).toMatchObject({ price: "4.5", note: "from" });
  });

  it("omits the price when no variation has one", () => {
    const out = mapCatalog([category("c1", "Cocktails"), item("i1", "Prosecco", "c1", [{}])], { locationId: LOC });
    expect(out.drinks.sections[0].items[0].price).toBeUndefined();
  });

  it("attaches the linked image url and description", () => {
    const objs = [
      category("c1", "Breakfast"),
      image("img1", "https://items-images-production.s3.amazonaws.com/x.jpg"),
      item("i1", "Benedict", "c1", [{ cents: 2200 }], { item_extra: { image_ids: ["img1"], description_plaintext: "Poached eggs" } }),
    ];
    const out = mapCatalog(objs, { locationId: LOC });
    expect(out.food.sections[0].items[0]).toMatchObject({ image: "https://items-images-production.s3.amazonaws.com/x.jpg", description: "Poached eggs" });
  });

  it("orders sections by map order and items by ordinal then name", () => {
    const objs = [
      category("c2", "Sides"),
      category("c1", "Breakfast"),
      item("i2", "Zucchini", "c1", [{ cents: 100 }], { item_extra: { ordinal: 2 } }),
      item("i1", "Avocado", "c1", [{ cents: 100 }], { item_extra: { ordinal: 1 } }),
      item("i3", "Bacon", "c2", [{ cents: 100 }]),
    ];
    const out = mapCatalog(objs, { locationId: LOC });
    expect(out.food.sections.map((s) => s.title)).toEqual(["Breakfast", "Sides"]);
    expect(out.food.sections[0].items.map((i) => i.name)).toEqual(["Avocado", "Zucchini"]);
  });
});
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- src/lib/square/map-catalog.test.ts`
Expected: FAIL — cannot resolve `./map-catalog`.

- [ ] **Step 4: Implement**

`map-catalog.ts`:
```ts
import { formatPrice, parseNameTags, slugify } from "@/lib/format";
import type { MenuBoard, MenuItem, MenuSection } from "@/lib/menu";
import { menuMap, type SectionTarget } from "./menu-map";
import type { SquareCatalogObject, SquareCategory, SquareImage, SquareItem } from "./types";

export type MappedMenu = { food: MenuBoard; drinks: MenuBoard };

type Opts = { locationId: string; map?: Record<string, SectionTarget> };

const isItem = (o: SquareCatalogObject): o is SquareItem => o.type === "ITEM";
const isCategory = (o: SquareCatalogObject): o is SquareCategory => o.type === "CATEGORY";
const isImage = (o: SquareCatalogObject): o is SquareImage => o.type === "IMAGE";

function presentAt(item: SquareItem, locationId: string): boolean {
  if (item.absent_at_location_ids?.includes(locationId)) return false;
  if (item.present_at_all_locations) return true;
  return item.present_at_location_ids?.includes(locationId) ?? false;
}

function priceFields(item: SquareItem): Pick<MenuItem, "price" | "note"> {
  const priced = (item.item_data.variations ?? [])
    .filter((v) => !v.is_deleted && v.item_variation_data.price_money?.amount !== undefined)
    .map((v) => ({ name: v.item_variation_data.name ?? "", cents: v.item_variation_data.price_money!.amount }))
    .sort((a, b) => a.cents - b.cents);

  if (priced.length === 0) return {};
  if (priced.length === 1) return { price: formatPrice(priced[0].cents) };
  if (priced.length === 2) {
    return {
      price: formatPrice(priced[0].cents),
      note: priced.map((p) => `${p.name} ${formatPrice(p.cents)}`.trim()).join(" · "),
    };
  }
  return { price: formatPrice(priced[0].cents), note: "from" };
}

/** Pure: Square catalog objects → the two menu boards the pages render. */
export function mapCatalog(objects: SquareCatalogObject[], { locationId, map = menuMap }: Opts): MappedMenu {
  const categories = new Map<string, string>();
  const images = new Map<string, string>();
  for (const o of objects) {
    if (o.is_deleted) continue;
    if (isCategory(o)) categories.set(o.id, o.category_data.name);
    if (isImage(o) && o.image_data.url) images.set(o.id, o.image_data.url);
  }

  const buckets = new Map<string, { target: SectionTarget; items: { item: MenuItem; ordinal: number }[] }>();

  for (const o of objects) {
    if (!isItem(o) || o.is_deleted || o.item_data.is_archived) continue;
    if (!presentAt(o, locationId)) continue;

    const categoryId = o.item_data.categories?.[0]?.id ?? o.item_data.reporting_category?.id;
    const categoryName = categoryId ? categories.get(categoryId) : undefined;
    const target = categoryName ? map[categoryName.toLowerCase()] : undefined;
    if (!target) continue;

    const { name, tags } = parseNameTags(o.item_data.name);
    const description = o.item_data.description_plaintext ?? o.item_data.description;
    const imageId = o.item_data.image_ids?.[0];
    const image = imageId ? images.get(imageId) : undefined;

    const item: MenuItem = {
      name,
      ...priceFields(o),
      ...(tags.length ? { tags } : {}),
      ...(description ? { description } : {}),
      ...(image ? { image } : {}),
    };

    const key = `${target.board}:${target.title}`;
    const bucket = buckets.get(key) ?? { target, items: [] };
    bucket.items.push({ item, ordinal: o.item_data.ordinal ?? Number.MAX_SAFE_INTEGER });
    buckets.set(key, bucket);
  }

  const toSections = (board: "food" | "drinks"): MenuSection[] =>
    [...buckets.values()]
      .filter((b) => b.target.board === board)
      .sort((a, b) => a.target.order - b.target.order)
      .map((b) => ({
        id: slugify(b.target.title),
        title: b.target.title,
        ...(b.target.subtitle ? { subtitle: b.target.subtitle } : {}),
        items: b.items
          .sort((a, b) => a.ordinal - b.ordinal || a.item.name.localeCompare(b.item.name))
          .map((x) => x.item),
      }));

  return {
    food: { id: "all-day", title: "All Day Menu", sections: toSections("food") },
    drinks: { id: "drinks", title: "Drinks", sections: toSections("drinks") },
  };
}
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all green. If the "orders items" test fails on tie-breaking, check that `ordinal` defaults to `MAX_SAFE_INTEGER` (unset ordinals sort last, then by name).

- [ ] **Step 6: Commit**

```bash
git add src/lib/square/menu-map.ts src/lib/square/map-catalog.ts src/lib/square/map-catalog.test.ts src/lib/square/featured.ts
git commit -m "feat: map square catalog objects onto the menu boards"
```

### Task 8: `getMenu()` with fallback, plus the snapshot script

**Files:**
- Create: `src/lib/square/catalog.ts`, `src/lib/square/catalog.test.ts`, `scripts/square-snapshot.mjs`

**Interfaces:**
- Consumes: `listCatalog`, `SquareConfigError` from `./client`; `mapCatalog` from `./map-catalog`; `featuredNames`; `foodMenu`, `drinksMenu` from `@/lib/menu`.
- Produces:
  - `getMenu(): Promise<{ food: MenuBoard; drinks: MenuBoard; source: "square" | "snapshot" }>` — wrapped in React `cache()`
  - `getFeaturedItems(menu: MappedMenu): FeaturedItem[]` where `FeaturedItem = MenuItem & { sectionId: string }`
  - `loadMenu(deps)` — the un-cached, injectable version used by tests

- [ ] **Step 1: Failing tests**

`catalog.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { getFeaturedItems, loadMenu } from "./catalog";
import { SquareConfigError } from "./client";
import type { SquareCatalogObject } from "./types";

const objs: SquareCatalogObject[] = [
  { type: "CATEGORY", id: "c1", category_data: { name: "Breakfast" } },
  {
    type: "ITEM",
    id: "i1",
    present_at_all_locations: true,
    item_data: {
      name: "Blueberry Honeycomb Hotcakes (V)",
      variations: [{ type: "ITEM_VARIATION", id: "v", item_variation_data: { price_money: { amount: 2400, currency: "AUD" } } }],
      categories: [{ id: "c1" }],
    },
  },
];

describe("loadMenu", () => {
  it("returns the mapped square menu when the fetch succeeds", async () => {
    const menu = await loadMenu({ list: async () => objs, locationId: "L1" });
    expect(menu.source).toBe("square");
    expect(menu.food.sections[0].items[0].name).toBe("Blueberry Honeycomb Hotcakes");
  });

  it("falls back to the snapshot when Square is not configured", async () => {
    const list = async () => { throw new SquareConfigError(); };
    const menu = await loadMenu({ list, locationId: "L1" });
    expect(menu.source).toBe("snapshot");
    expect(menu.food.sections.length).toBeGreaterThan(3);
  });

  it("falls back to the snapshot and logs when the fetch throws", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const menu = await loadMenu({ list: async () => { throw new Error("boom"); }, locationId: "L1" });
    expect(menu.source).toBe("snapshot");
    expect(error).toHaveBeenCalledOnce();
    error.mockRestore();
  });

  it("falls back when the location id is missing", async () => {
    const menu = await loadMenu({ list: async () => objs, locationId: "" });
    expect(menu.source).toBe("snapshot");
  });
});

describe("getFeaturedItems", () => {
  it("picks featured names case-insensitively and skips misses", async () => {
    const menu = await loadMenu({ list: async () => objs, locationId: "L1" });
    const featured = getFeaturedItems(menu);
    expect(featured).toHaveLength(1);
    expect(featured[0]).toMatchObject({ name: "Blueberry Honeycomb Hotcakes", sectionId: "breakfast" });
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/lib/square/catalog.test.ts`
Expected: FAIL — cannot resolve `./catalog`.

- [ ] **Step 3: Implement**

`catalog.ts`:
```ts
import { cache } from "react";
import { drinksMenu, foodMenu, type MenuItem } from "@/lib/menu";
import { listCatalog, SquareConfigError } from "./client";
import { featuredNames } from "./featured";
import { mapCatalog, type MappedMenu } from "./map-catalog";
import type { SquareCatalogObject } from "./types";

export type MenuSource = "square" | "snapshot";
export type SiteMenu = MappedMenu & { source: MenuSource };
export type FeaturedItem = MenuItem & { sectionId: string };

type Deps = { list: () => Promise<SquareCatalogObject[]>; locationId: string };

const snapshot = (): SiteMenu => ({ food: foodMenu, drinks: drinksMenu, source: "snapshot" });

/** Un-cached core so tests can inject the fetch. */
export async function loadMenu({ list, locationId }: Deps): Promise<SiteMenu> {
  if (!locationId) return snapshot();
  try {
    const objects = await list();
    return { ...mapCatalog(objects, { locationId }), source: "square" };
  } catch (error) {
    if (!(error instanceof SquareConfigError)) {
      console.error("Square menu fetch failed; serving snapshot", error);
    }
    return snapshot();
  }
}

/**
 * The menu the pages render. Square when configured, otherwise the snapshot
 * in src/lib/menu.ts — never an empty menu. Deduped per request with cache().
 */
export const getMenu = cache(() =>
  loadMenu({ list: () => listCatalog(), locationId: process.env.SQUARE_LOCATION_ID ?? "" }),
);

export function getFeaturedItems(menu: MappedMenu): FeaturedItem[] {
  const wanted = new Map(featuredNames.map((n, i) => [n.toLowerCase(), i]));
  const found: { item: FeaturedItem; order: number }[] = [];
  for (const board of [menu.food, menu.drinks]) {
    for (const section of board.sections) {
      for (const item of section.items) {
        const order = wanted.get(item.name.toLowerCase());
        if (order !== undefined) found.push({ item: { ...item, sectionId: section.id }, order });
      }
    }
  }
  return found.sort((a, b) => a.order - b.order).map((f) => f.item);
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all green.

- [ ] **Step 5: Snapshot script**

`scripts/square-snapshot.mjs` regenerates the fallback from Square. Because `mapCatalog` is TypeScript, the script shells out to `tsx` rather than reimplementing the mapper:
```bash
npm install -D tsx
```
```js
#!/usr/bin/env node
/**
 * Regenerate src/lib/menu.snapshot.json from Square so the fallback stays fresh.
 *   node scripts/square-snapshot.mjs
 */
import { execSync } from "node:child_process";
execSync("npx tsx scripts/square-snapshot.ts", { stdio: "inherit" });
```
`scripts/square-snapshot.ts`:
```ts
import { writeFile } from "node:fs/promises";
import { listCatalog } from "../src/lib/square/client";
import { mapCatalog } from "../src/lib/square/map-catalog";

const locationId = process.env.SQUARE_LOCATION_ID ?? "";
if (!locationId) throw new Error("SQUARE_LOCATION_ID missing");
const objects = await listCatalog();
const menu = mapCatalog(objects, { locationId });
await writeFile("src/lib/menu.snapshot.json", JSON.stringify(menu, null, 2) + "\n");
console.log(`snapshot: ${menu.food.sections.length} food sections, ${menu.drinks.sections.length} drink sections`);
```
Then make the snapshot the fallback's preferred source: in `catalog.ts`, replace `snapshot()` with
```ts
import snapshotJson from "@/lib/menu.snapshot.json";
const snapshot = (): SiteMenu => {
  const json = snapshotJson as Partial<MappedMenu>;
  const hasJson = json.food?.sections?.length && json.drinks?.sections?.length;
  return hasJson
    ? { food: json.food as MappedMenu["food"], drinks: json.drinks as MappedMenu["drinks"], source: "snapshot" }
    : { food: foodMenu, drinks: drinksMenu, source: "snapshot" };
};
```
and commit an initial `src/lib/menu.snapshot.json` containing `{ "food": { "id": "all-day", "title": "All Day Menu", "sections": [] }, "drinks": { "id": "drinks", "title": "Drinks", "sections": [] } }` so the transcribed `menu.ts` remains the fallback until a real snapshot is generated. Check `tsconfig.json` has `"resolveJsonModule": true` (it does). Add `"square:snapshot": "node scripts/square-snapshot.mjs"` to scripts. Re-run `npm test` — the fallback tests still pass because the JSON is empty.

- [ ] **Step 6: Build and commit**

Run: `npm test && npm run build`
```bash
git add src/lib/square/catalog.ts src/lib/square/catalog.test.ts src/lib/menu.snapshot.json scripts/square-snapshot.mjs scripts/square-snapshot.ts package.json package-lock.json
git commit -m "feat: getMenu with square-first, snapshot fallback"
```

### Task 9: Square discovery and mapping review (needs `SQUARE_ACCESS_TOKEN`)

**Files:**
- Create: `docs/research/square/catalog-<date>.json`, `docs/research/square/MAPPING.md`
- Modify: `src/lib/square/menu-map.ts`, possibly `src/lib/format.ts` (tag rule), `next.config.ts` (`images.remotePatterns`)

Skip this task entirely if Kayden has not yet supplied the token; note it in the PR description and move on. Return to it when the token arrives.

- [ ] **Step 1: Dump**

Put the token in `.dev.vars` (gitignored). Run `npm run square:dump`. Commit the JSON (it contains no secrets — prices and names only; if the dump includes anything sensitive like supplier costs, delete those fields before committing).

- [ ] **Step 2: Write `MAPPING.md`**

A table: every Square category name → item count → mapped section (or DROPPED) → notes. Below it, every item name that differs from `src/lib/menu.ts` (renamed, missing in Square, missing in menu.ts, price mismatch). Record: which field carries dietary tags (custom attribute vs name suffix), whether items have images and on which host, whether `categories[]` or `reporting_category` is populated, and the exact `SQUARE_LOCATION_ID`.

- [ ] **Step 3: Correct the mapper to reality**

Update `menuMap` keys to the real lower-cased category names. If tags are a custom attribute, add reading `custom_attribute_values` in `map-catalog.ts` (extend `SquareItem` in `types.ts` with `custom_attribute_values?: Record<string, { string_value?: string; selection_uid_values?: string[] }>`) with a test. If images are served from a host, add it to `next.config.ts`:
```ts
images: { remotePatterns: [{ protocol: "https", hostname: "items-images-production.s3.amazonaws.com" }] },
```
(replace the hostname with the one seen in the dump).

- [ ] **Step 4: Generate the real snapshot**

Run `SQUARE_LOCATION_ID=… npm run square:snapshot`, inspect `src/lib/menu.snapshot.json`, `npm test && npm run build`.

- [ ] **Step 5: Commit and flag for Kayden**

```bash
git add docs/research/square src/lib/square src/lib/menu.snapshot.json next.config.ts
git commit -m "docs: square catalog discovery and corrected menu mapping"
```
Kayden reviews `MAPPING.md` before launch (spec §7.7).

---

## Phase 2 — Pages

### Task 10: Home — Hero and About

**Files:**
- Create: `src/components/sections/home/hero.tsx`, `src/components/sections/home/about.tsx`
- Modify: `src/app/page.tsx`, `src/components/ui.tsx` (becomes a temporary shim)
- Delete: `src/components/hero-slideshow.tsx`

**Interfaces:**
- Consumes: `copy.home.hero`, `copy.home.about`; `hoursSummary`; `Button`, `Pill`, `SectionCard`, `Container`, `Reveal`, `ScrollBadge`, `CoffeeSticker`, `BoneSticker`.
- Produces: `<Hero />`, `<About />` — no props.

- [ ] **Step 1: Hero**

`hero.tsx`:
```tsx
import Image from "next/image";
import { copy } from "@/lib/content/copy";
import { hoursSummary } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { BoneSticker, CoffeeSticker } from "@/components/ui/stickers";

export function Hero() {
  const c = copy.home.hero;
  return (
    <Container className="pt-8 md:pt-12">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
        <div className="relative order-2 lg:order-1">
          <Pill tone="cream" className="mb-4 border border-cocoa/15">{c.sticker}</Pill>
          <h1 className="display-1 relative">
            <span className="block">{c.line1}</span>
            <span className="relative mt-2 inline-block">
              <span aria-hidden="true" className="absolute -inset-x-3 -inset-y-1 -rotate-[4deg] rounded-xl bg-teal" />
              <span className="relative px-3 text-cocoa">{c.line2}</span>
            </span>
            <CoffeeSticker className="float absolute -right-2 top-0 hidden h-20 w-20 md:block lg:-right-6" />
          </h1>

          <p className="eyebrow mt-10 text-cocoa-soft">{c.eyebrow}</p>
          <p className="mt-3 max-w-[52ch]">{c.body}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/book-a-table">{c.primary}</Button>
            <Button href="/menu" variant="secondary">{c.secondary}</Button>
          </div>
          <p className="mt-5 inline-block rounded-full bg-sand px-4 py-2 text-[15px] font-semibold text-cocoa-soft">
            {hoursSummary}
          </p>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-photo)]">
            <Image
              src="/images/hero-2.jpg"
              alt="French toast with strawberries and kiwi at The Peacock"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-4 hidden w-[42%] overflow-hidden rounded-[var(--radius-photo)] border-4 border-cream shadow-lg md:block">
            <div className="relative aspect-square">
              <Image src="/images/hero-4.jpg" alt="Coffee and a sweet dish" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
          <BoneSticker className="float absolute -right-3 -top-4 h-14 w-28 rotate-12" />
        </div>
      </div>
    </Container>
  );
}
```

- [ ] **Step 2: About**

`about.tsx`:
```tsx
import Image from "next/image";
import { copy } from "@/lib/content/copy";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { ScrollBadge } from "@/components/ui/scroll-badge";
import { SectionCard } from "@/components/ui/section-card";

export function About() {
  const c = copy.home.about;
  return (
    <SectionCard tone="cocoa" id="about" className="section-gap text-center">
      <Reveal className="mx-auto max-w-[900px]">
        <Pill tone="cream">{c.pill}</Pill>
        <h2 className="display-2 mt-6">
          <span className="block">{c.line1}</span>
          <span className="block">{c.line2}</span>
        </h2>
        <div className="relative mx-auto mt-10 aspect-[16/10] max-w-[720px] overflow-hidden rounded-[var(--radius-photo)]">
          <Image src="/images/hero-3.jpg" alt="Inside the plant-filled dining room at The Peacock" fill sizes="(max-width: 768px) 100vw, 720px" className="object-cover" />
        </div>
        <p className="mx-auto mt-10 max-w-[56ch] text-cream/90">{c.body}</p>
        <div className="mt-10 text-cream/80">
          <ScrollBadge />
        </div>
      </Reveal>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Rewrite `page.tsx` (partial — later tasks append sections)**

```tsx
import { Hero } from "@/components/sections/home/hero";
import { About } from "@/components/sections/home/about";
import { WebSiteSchema } from "@/components/structured-data";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <Hero />
      <About />
    </>
  );
}
```
```bash
git rm src/components/hero-slideshow.tsx
```
The old menu/book/contact pages still import `TealButton`/`SectionHeading` from `@/components/ui` and would break the build until Tasks 13–15 replace them. Keep every task green by turning `src/components/ui.tsx` into a shim — replace its whole content with:
```tsx
import type { ReactNode } from "react";
export { Button as TealButton } from "@/components/ui/button";
export function SectionHeading({ children }: { children: ReactNode }) {
  return <h2 className="display-3">{children}</h2>;
}
```
Task 15 deletes the shim once nothing imports it.

- [ ] **Step 4: Build, eyeball, commit**

Run: `npm run build && npm run dev` — check the hero at 390 and 1440. Confirm the teal tag block sits behind "SOUTH YARRA" and the stickers hide on mobile.
```bash
git add -A src/components/sections/home src/components/ui.tsx src/components/hero-slideshow.tsx src/app/page.tsx
git commit -m "feat: home hero and about band"
```

### Task 11: Home — Menu highlights, Values, Our place

**Files:**
- Create: `src/components/sections/home/menu-highlights.tsx`, `values.tsx`, `our-place.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `getMenu`, `getFeaturedItems`, `FeaturedItem` from `@/lib/square/catalog`; `copy.home.highlights`, `copy.home.values`, `copy.home.place`; `site.googleMapsQuery`, `site.addressLine`.
- Produces: `<MenuHighlights items={FeaturedItem[]} />`, `<Values />`, `<OurPlace />`.

- [ ] **Step 1: Menu highlights**

`menu-highlights.tsx`:
```tsx
import Image from "next/image";
import Link from "next/link";
import { copy } from "@/lib/content/copy";
import type { FeaturedItem } from "@/lib/square/catalog";
import { Container } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

export function MenuHighlights({ items }: { items: FeaturedItem[] }) {
  if (items.length === 0) return null;
  const c = copy.home.highlights;
  return (
    <section className="section-gap" aria-labelledby="highlights">
      <Container>
        <Reveal>
          <Pill>{c.pill}</Pill>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <h2 id="highlights" className="display-2">{c.title}</h2>
            <Link href="/menu" className="eyebrow underline underline-offset-4 hover:text-teal-deep">{c.link}</Link>
          </div>
        </Reveal>
      </Container>

      <div className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-[var(--gutter)] pb-4">
        {items.map((item) => (
          <article key={item.name} className="flex w-[280px] shrink-0 snap-start flex-col rounded-[var(--radius-photo)] bg-sand p-5 md:w-[340px]">
            {item.image ? (
              <div className="relative mb-5 aspect-square overflow-hidden rounded-2xl">
                <Image src={item.image} alt={item.name} fill sizes="340px" className="object-cover" />
              </div>
            ) : null}
            <h3 className="display-3">{item.name}</h3>
            {item.tags?.length ? <p className="eyebrow mt-2 text-teal-deep">{item.tags.join(" · ")}</p> : null}
            {item.description ? <p className="mt-3 text-cocoa-soft">{item.description}</p> : null}
            <div className="mt-auto flex items-center justify-between pt-6">
              {item.price ? <span className="font-display text-3xl font-black">${item.price}</span> : <span />}
              <Link href={`/menu#${item.sectionId}`} className="eyebrow underline underline-offset-4 hover:text-teal-deep">{c.cardLink}</Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Values**

`values.tsx`:
```tsx
import Image from "next/image";
import { copy } from "@/lib/content/copy";
import { Reveal } from "@/components/ui/reveal";
import { SectionCard } from "@/components/ui/section-card";

export function Values() {
  const { items } = copy.home.values;
  return (
    <SectionCard tone="sand" className="section-gap">
      <ul className="grid gap-8 md:grid-cols-3">
        {items.map((v) => (
          <li key={v.title}>
            <Reveal className="flex h-full flex-col overflow-hidden rounded-[var(--radius-photo)] bg-cream">
              <div className="relative aspect-[4/3]">
                <Image src={v.image} alt={v.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                <h3 className="display-3 absolute left-4 top-4 max-w-[80%] rounded-xl bg-cream px-3 py-1 text-cocoa shadow-md">{v.title}</h3>
              </div>
              <p className="p-6 text-cocoa-soft">{v.body}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Our place**

`our-place.tsx`:
```tsx
import Image from "next/image";
import { copy } from "@/lib/content/copy";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";

export function OurPlace() {
  const c = copy.home.place;
  const maps = `https://www.google.com/maps/search/?api=1&query=${site.googleMapsQuery}`;
  return (
    <section className="section-gap" aria-labelledby="place">
      <Container>
        <Reveal className="text-center">
          <Pill>{c.pill}</Pill>
          <h2 id="place" className="display-2 mt-6">
            <span className="block">{c.line1}</span>
            <span className="block">{c.line2}</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {c.photos.map((p) => (
            <div key={p.src} className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-photo)]">
              <Image src={p.src} alt={p.alt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
            </div>
          ))}
        </div>
        <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-cocoa-soft">
          <span>{site.street}, {site.suburb} {site.state} {site.postcode}</span>
          <a href={maps} target="_blank" rel="noopener noreferrer" className="eyebrow text-teal-deep underline underline-offset-4">{c.directions}</a>
        </p>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Wire into `page.tsx`**

```tsx
import { getFeaturedItems, getMenu } from "@/lib/square/catalog";
import { MenuHighlights } from "@/components/sections/home/menu-highlights";
import { Values } from "@/components/sections/home/values";
import { OurPlace } from "@/components/sections/home/our-place";

export default async function HomePage() {
  const menu = await getMenu();
  const featured = getFeaturedItems(menu);
  return (
    <>
      <WebSiteSchema />
      <Hero />
      <About />
      <MenuHighlights items={featured} />
      <Values />
      <OurPlace />
    </>
  );
}
```
Note: with no Square env the snapshot `menu.ts` supplies the featured items, so the carousel renders locally.

- [ ] **Step 5: Build, eyeball, commit**

Run: `npm run build && npm run dev` — carousel scroll-snaps at 390; three value cards; three photos.
```bash
git add src/components/sections/home src/app/page.tsx
git commit -m "feat: home menu highlights, values, and our place"
```

### Task 12: Home — Specials, Reviews, Instagram, FAQ, CTA

**Files:**
- Create: `src/components/sections/home/specials.tsx`, `reviews.tsx`, `instagram-grid.tsx`, `faq.tsx`, `faq-accordion.tsx`, `cta-band.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `menuSpecials` from `@/lib/menu`; `reviews`, `instagram`, `faq` from `@/lib/content/*`; `Stars`.
- Produces: `<Specials />`, `<Reviews />`, `<InstagramGrid />`, `<Faq />`, `<CtaBand />`.

- [ ] **Step 1: Specials**

`specials.tsx`:
```tsx
import Image from "next/image";
import { copy } from "@/lib/content/copy";
import { menuSpecials } from "@/lib/menu";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { SectionCard } from "@/components/ui/section-card";

export function Specials() {
  const c = copy.home.specials;
  return (
    <SectionCard tone="sand" className="section-gap">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[var(--radius-photo)]">
          <Image src={c.image} alt={c.alt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
        </div>
        <Reveal>
          <Pill tone="cream">{c.pill}</Pill>
          <h2 className="display-2 mt-6">{c.title}</h2>
          <ol className="mt-8 space-y-6">
            {menuSpecials.map((s, i) => (
              <li key={s.id} className="flex gap-4">
                <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-sun font-display text-2xl font-black">{i + 1}</span>
                <div>
                  <p className="eyebrow text-cocoa-soft">{s.day}</p>
                  <h3 className="display-3">{s.title}</h3>
                  <p className="mt-1 text-cocoa-soft">{s.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <Button href="/book-a-table" className="mt-10">{c.cta}</Button>
        </Reveal>
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 2: Reviews**

`reviews.tsx`:
```tsx
import { copy } from "@/lib/content/copy";
import { reviews } from "@/lib/content/reviews";
import { site } from "@/lib/site";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { SectionCard } from "@/components/ui/section-card";
import { Stars } from "@/components/ui/stars";
import { CoffeeSticker, LeafSticker } from "@/components/ui/stickers";

export function Reviews() {
  if (reviews.length === 0) return null;
  const c = copy.home.reviews;
  return (
    <SectionCard tone="cocoa" className="section-gap">
      <Reveal className="relative text-center">
        <LeafSticker className="float absolute left-0 top-0 hidden h-16 w-16 md:block" />
        <CoffeeSticker className="float absolute right-0 top-4 hidden h-16 w-16 md:block" />
        <Pill tone="cream">{c.pill}</Pill>
        <h2 className="display-2 mt-6">
          <span className="block">{c.line1}</span>
          <span className="block">{c.line2}</span>
        </h2>
      </Reveal>
      <ul className="no-scrollbar mt-12 flex snap-x gap-6 overflow-x-auto pb-4">
        {reviews.map((r) => (
          <li key={r.name + r.when} className="flex w-[300px] shrink-0 snap-start flex-col rounded-[var(--radius-photo)] bg-cream p-6 text-cocoa md:w-[380px]">
            <Stars />
            <blockquote className="mt-4 text-lg font-semibold">“{r.quote}”</blockquote>
            <p className="mt-auto pt-6 text-cocoa-soft">
              <span className="eyebrow block text-cocoa">{r.name}</span>
              {c.source} · {r.when}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-center">
        <a href={site.googleReview} target="_blank" rel="noopener noreferrer" className="eyebrow underline underline-offset-4 hover:text-teal">{c.link}</a>
      </p>
    </SectionCard>
  );
}
```

- [ ] **Step 3: Instagram grid**

`instagram-grid.tsx`:
```tsx
import Image from "next/image";
import { instagram } from "@/lib/content/instagram";
import { site } from "@/lib/site";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/reveal";

export function InstagramGrid() {
  if (instagram.length === 0) return null;
  return (
    <section className="section-gap" aria-labelledby="instagram">
      <Container>
        <Reveal className="text-center">
          <h2 id="instagram" className="display-2">
            <a href={site.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-teal-deep">@{site.instagramHandle}</a>
          </h2>
        </Reveal>
        <ul className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {instagram.slice(0, 6).map((t) => (
            <li key={t.href} className="relative aspect-square overflow-hidden rounded-2xl">
              <a href={t.href} target="_blank" rel="noopener noreferrer" aria-label={t.alt}>
                <Image src={t.src} alt={t.alt} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform hover:scale-105" />
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: FAQ**

`faq-accordion.tsx` (client — one open at a time):
```tsx
"use client";

import { useState } from "react";
import type { FaqEntry } from "@/lib/content/faq";

export function FaqAccordion({ entries }: { entries: FaqEntry[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-cocoa/15">
      {entries.map((e, i) => {
        const isOpen = open === i;
        const id = `faq-${i}`;
        return (
          <div key={e.q}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={id}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-5 text-left text-xl font-semibold hover:text-teal-deep"
              >
                {e.q}
                <span aria-hidden="true" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cream transition-transform ${isOpen ? "rotate-45" : ""}`}>+</span>
              </button>
            </h3>
            <div id={id} hidden={!isOpen} className="pb-6 pr-12 text-cocoa-soft">
              {e.a}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

`faq.tsx`:
```tsx
import Link from "next/link";
import { copy } from "@/lib/content/copy";
import { faq } from "@/lib/content/faq";
import { site } from "@/lib/site";
import { Pill } from "@/components/ui/pill";
import { Reveal } from "@/components/ui/reveal";
import { SectionCard } from "@/components/ui/section-card";
import { FaqAccordion } from "./faq-accordion";

export function Faq() {
  const c = copy.home.faq;
  const entries = faq.map((e) => ({ ...e, a: e.a.replace("{phone}", site.phone) }));
  return (
    <SectionCard tone="sand" id="faq" className="section-gap">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)]">
        <Reveal>
          <Pill tone="cream">{c.pill}</Pill>
          <h2 className="display-2 mt-6">{c.title}</h2>
          <Link href="/contact-us" className="eyebrow mt-6 inline-block underline underline-offset-4 hover:text-teal-deep">{c.more}</Link>
        </Reveal>
        <FaqAccordion entries={entries} />
      </div>
    </SectionCard>
  );
}
```

- [ ] **Step 5: CTA band**

`cta-band.tsx`:
```tsx
import { copy } from "@/lib/content/copy";
import { hoursSummary } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/reveal";
import { SectionCard } from "@/components/ui/section-card";

export function CtaBand() {
  const c = copy.home.cta;
  return (
    <SectionCard tone="teal" className="section-gap text-center">
      <Reveal>
        <h2 className="display-2">
          <span className="block">{c.line1}</span>
          <span className="block">{c.line2}</span>
        </h2>
        <p className="mt-6">{hoursSummary}</p>
        <Button href="/book-a-table" variant="dark" className="mt-8">{c.button}</Button>
      </Reveal>
    </SectionCard>
  );
}
```

- [ ] **Step 6: Finish `page.tsx`**

Append the five sections after `<OurPlace />` in this order: `<Specials />`, `<Reviews />`, `<InstagramGrid />`, `<Faq />`, `<CtaBand />`. Also, so the snapshot state is visible in page source (spec §7.6), render at the top of the fragment:
```tsx
{menu.source === "snapshot" ? <script type="text/plain" data-menu-source="snapshot" /> : null}
```
(React cannot emit raw HTML comments; an inert `text/plain` script tag is greppable in view-source. The menu page uses the same line.)

- [ ] **Step 7: Build, keyboard-check the accordion, commit**

Run: `npm run build && npm run dev` — Tab to each FAQ button, Enter toggles, only one open. Reviews and Instagram render nothing (empty data) without errors.
```bash
git add src/components/sections/home src/app/page.tsx
git commit -m "feat: home specials, reviews, instagram, faq, and cta"
```

### Task 13: Menu page

**Files:**
- Create: `src/components/sections/menu/menu-nav.tsx`, `menu-board.tsx`, `menu-row.tsx`, `specials-strip.tsx`
- Modify: `src/app/menu/page.tsx`, `src/components/structured-data.tsx`, `src/app/sitemap.ts`, `next.config.ts`
- Delete: `src/app/cafe-menu/page.tsx`

**Interfaces:**
- Consumes: `getMenu`; `copy.menu`; `dietaryLegend`, `menuFootnotes`, `menuSpecials`.
- Produces: `MenuSchema({ boards: MenuBoard[] })` (signature change), `<MenuNav sections={{ id, title }[]} />`, `<MenuBoardView board={MenuBoard} />`, `<MenuRow item={MenuItem} />`, `<SpecialsStrip />`.

- [ ] **Step 1: `MenuSchema` takes data**

In `structured-data.tsx`, remove the `drinksMenu, foodMenu` import and change:
```tsx
export function MenuSchema({ boards }: { boards: MenuBoard[] }) {
  // … same body, but:
  hasMenuSection: boards.flatMap((b) => b.sections).map((section) => ({ …unchanged… })),
```
Import `type MenuBoard` from `@/lib/menu`.

- [ ] **Step 2: Menu nav (client)**

`menu-nav.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";

export function MenuNav({ sections }: { sections: { id: string; title: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Menu sections" className="sticky top-20 z-40 -mx-[var(--gutter)] bg-cream/90 px-[var(--gutter)] py-3 backdrop-blur-md">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto">
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? "location" : undefined}
              className={`eyebrow inline-block rounded-full px-4 py-2 transition-colors ${active === s.id ? "bg-teal text-cocoa" : "bg-sand text-cocoa hover:bg-teal/40"}`}
            >
              {s.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 3: Board and row**

`menu-row.tsx`:
```tsx
import type { MenuItem } from "@/lib/menu";

export function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li className="py-3">
      <div className="flex items-baseline gap-3">
        <h4 className="text-lg font-bold uppercase tracking-wide">{item.name}</h4>
        {item.price ? (
          <>
            <span aria-hidden="true" className="h-px flex-1 border-b border-dotted border-cocoa/30" />
            <span className="font-display text-xl font-black">{item.price}</span>
          </>
        ) : null}
      </div>
      {item.tags?.length ? <p className="eyebrow mt-1 text-teal-deep">{item.tags.join(" · ")}</p> : null}
      {item.description ? <p className="mt-1 text-cocoa-soft">{item.description}</p> : null}
      {item.note ? <p className="mt-1 text-sm italic text-cocoa-soft">{item.note}</p> : null}
    </li>
  );
}
```

`menu-board.tsx`:
```tsx
import type { MenuBoard } from "@/lib/menu";
import { MenuRow } from "./menu-row";

export function MenuBoardView({ board }: { board: MenuBoard }) {
  return (
    <section aria-labelledby={board.id} className="section-gap">
      <h2 id={board.id} className="display-2 border-b-2 border-cocoa pb-4">{board.title}</h2>
      <div className="mt-8 grid gap-x-12 gap-y-10 lg:grid-cols-2">
        {board.sections.map((section) => (
          <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-40">
            <h3 id={`${section.id}-title`} className="display-3">
              {section.title}
              {section.subtitle ? <span className="ml-3 font-body text-base font-normal normal-case text-cocoa-soft">{section.subtitle}</span> : null}
            </h3>
            <ul className="mt-4 divide-y divide-cocoa/10">
              {section.items.map((item) => (
                <MenuRow key={item.name} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
```

`specials-strip.tsx`:
```tsx
import { menuSpecials } from "@/lib/menu";

export function SpecialsStrip() {
  return (
    <section aria-labelledby="specials" className="section-gap rounded-[var(--radius-card)] bg-teal px-6 py-8 md:px-10">
      <h2 id="specials" className="display-3">Specials</h2>
      <ul className="mt-5 grid gap-5 sm:grid-cols-3">
        {menuSpecials.map((s) => (
          <li key={s.id}>
            <p className="eyebrow text-cocoa/70">{s.day}</p>
            <h3 className="text-lg font-bold uppercase">{s.title}</h3>
            <p className="mt-1">{s.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Rewrite `menu/page.tsx`**

```tsx
import type { Metadata } from "next";
import { BreadcrumbSchema, MenuSchema } from "@/components/structured-data";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { MenuBoardView } from "@/components/sections/menu/menu-board";
import { MenuNav } from "@/components/sections/menu/menu-nav";
import { SpecialsStrip } from "@/components/sections/menu/specials-strip";
import { copy } from "@/lib/content/copy";
import { dietaryLegend, menuFootnotes } from "@/lib/menu";
import { getMenu } from "@/lib/square/catalog";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Menu",
  description:
    "The full Peacock South Yarra menu — all day breakfast and brunch, burgers, kids meals, sides, St Ali coffee, ceremonial matcha, smoothies, cold pressed juice and cocktails.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Menu | The Peacock South Yarra",
    description: "All day breakfast and brunch, St Ali coffee, ceremonial matcha, smoothies and cocktails.",
    url: "/menu",
  },
};

export default async function MenuPage() {
  const menu = await getMenu();
  const boards = [menu.food, menu.drinks];
  const sections = boards.flatMap((b) => b.sections.map((s) => ({ id: s.id, title: s.title })));
  const c = copy.menu;

  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "Menu", path: "/menu" }]} />
      <MenuSchema boards={boards} />
      {menu.source === "snapshot" ? <script type="text/plain" data-menu-source="snapshot" /> : null}

      <Container className="pt-8 md:pt-12">
        <header className="text-center">
          <Pill>{c.pill}</Pill>
          <h1 className="display-1 mt-6">
            <span className="block">{c.line1}</span>
            <span className="block text-teal-deep">{c.line2}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-[56ch]">{c.intro}</p>
          <Button href="/book-a-table" className="mt-8">{c.cta}</Button>
        </header>

        <div className="mt-12">
          <MenuNav sections={sections} />
        </div>

        {boards.map((board) => (
          <MenuBoardView key={board.id} board={board} />
        ))}

        <SpecialsStrip />

        <section aria-labelledby="legend" className="section-gap">
          <h2 id="legend" className="sr-only">Dietary codes and conditions</h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold text-teal-deep">
            {dietaryLegend.map((e) => (
              <li key={e.code}><span className="font-bold">{e.code}</span> — {e.meaning}</li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 text-cocoa-soft">
            {menuFootnotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      </Container>
    </>
  );
}
```

- [ ] **Step 5: Remove `/cafe-menu`, redirect it, fix the sitemap**

```bash
git rm -r src/app/cafe-menu
```
`next.config.ts` redirects — add `{ source: "/cafe-menu", destination: "/menu", permanent: true },`.
`sitemap.ts` — delete the `/cafe-menu` entry.
`grep -rn "cafe-menu" src` must return only the redirect and any image filename (`cafe-menu-hero.jpg` is fine).

- [ ] **Step 6: Build, check, commit**

Run: `npm run build && npm run dev` — chip nav highlights as you scroll; `curl -I http://localhost:3000/cafe-menu` → `308`/`301` to `/menu` (Next uses 308 for permanent redirects; that is acceptable for Google).
```bash
git add -A src/components/sections/menu src/app/menu src/app/cafe-menu src/components/structured-data.tsx src/app/sitemap.ts next.config.ts
git commit -m "feat: square-fed menu page with sticky section nav"
```

### Task 14: Booking slot for Jason

**Files:**
- Create: `src/features/booking/README.md`, `BookingWidget.tsx`, `ResosEmbed.tsx`, `NativeBooking.tsx`
- Modify: `src/app/book-a-table/page.tsx`, `.env.example`
- Delete: `docs/BOOKING_MIGRATION.md`

**Interfaces:**
- Produces: `<BookingWidget />` (no props). Env `NEXT_PUBLIC_BOOKING_PROVIDER` = `resos` | `native`.

- [ ] **Step 1: Components**

`ResosEmbed.tsx`:
```tsx
import { site } from "@/lib/site";

const RESOS_EMBED = "https://the-peacock-south-yarra.resos.com/booking";

/** The venue's live Resos booking flow. Unchanged from the Wix era. */
export function ResosEmbed() {
  return (
    <iframe
      src={RESOS_EMBED}
      title={`Book a table at ${site.name}`}
      loading="lazy"
      className="h-[708px] w-full rounded-2xl border-0 bg-white"
    />
  );
}
```

`NativeBooking.tsx`:
```tsx
import { copy } from "@/lib/content/copy";
import { site } from "@/lib/site";

/** Placeholder for the in-house booking system. Jason replaces this file. */
export function NativeBooking() {
  return (
    <div className="flex min-h-[708px] flex-col items-center justify-center rounded-2xl bg-cream p-8 text-center">
      <p className="text-lg">
        {copy.book.nativeStub}{" "}
        <a href={site.phoneHref} className="font-bold text-teal-deep underline underline-offset-4">{site.phone}</a>.
      </p>
    </div>
  );
}
```

`BookingWidget.tsx`:
```tsx
import { NativeBooking } from "./NativeBooking";
import { ResosEmbed } from "./ResosEmbed";

/**
 * The only thing /book-a-table mounts. Switch providers with
 * NEXT_PUBLIC_BOOKING_PROVIDER=resos|native — see README.md.
 */
export function BookingWidget() {
  const provider = process.env.NEXT_PUBLIC_BOOKING_PROVIDER === "native" ? "native" : "resos";
  return provider === "native" ? <NativeBooking /> : <ResosEmbed />;
}
```

- [ ] **Step 2: README (the contract)**

`src/features/booking/README.md`:
```md
# Booking feature — handover contract

Owner: Jason. Everything the booking system needs from the site is here; nothing
outside this folder should need to change when Resos is replaced.

## How the page uses this folder

`src/app/book-a-table/page.tsx` renders `<BookingWidget />` and nothing else from
here. `BookingWidget` reads `NEXT_PUBLIC_BOOKING_PROVIDER`:

- `resos` (default, and any unknown value) → `ResosEmbed.tsx`, the live iframe at
  https://the-peacock-south-yarra.resos.com/booking. Jenny's bookings run through
  this today. Keep it working until the native system is signed off.
- `native` → `NativeBooking.tsx`. Currently a stub. Replace its internals; keep the
  export name.

The slot is `width: 100%`, `min-height: 708px`, inside a sand card with 24px
padding. Anything inside is yours: server components, client components, server
actions, route handlers under `src/app/api/booking/*` if you need them.

## The flow to reproduce (so staff and regulars recognise it)

1. People — grid of 1–10, "More" disclosure beyond that
2. Date
3. Time
4. Submit — name, phone, email, notes

## Venue constraints

- Trading: Mon–Fri 07:00–15:00, Sat–Sun and public holidays 08:00–15:00
  (`hours` in `src/lib/site.ts` — never hardcode).
- Groups over ten go through the phone; the page already says so.
- Bottomless mimosas need a 1.5-hour sitting and start from 10am, so that
  booking type must reserve a longer slot.
- Surcharges (10% weekends, 15% public holidays) are disclosed at booking, not
  at the table.
- Keep Resos running in parallel during cutover; flip the env var per environment.

## Open decisions (yours)

- Storage: Cloudflare D1 is the default suggestion now that the site runs on
  Workers (`wrangler.jsonc` already has the DO/R2 bindings pattern to copy).
- Confirmation email: Resend is wired in `src/lib/mail.ts` — reuse `sendEnquiry`'s
  pattern with its own template.
- SMS: undecided.
- Handover to Peregrine's 006 Bookings agent, if any.
```
Delete the old doc: `git rm docs/BOOKING_MIGRATION.md`. Add `NEXT_PUBLIC_BOOKING_PROVIDER=resos` to `.env.example`.

- [ ] **Step 3: Rewrite `book-a-table/page.tsx`**

```tsx
import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/structured-data";
import { Container } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { BookingWidget } from "@/features/booking/BookingWidget";
import { copy } from "@/lib/content/copy";
import { hours, site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Table",
  description: "Book a table at The Peacock South Yarra for breakfast, brunch or bottomless mimosas.",
  alternates: { canonical: "/book-a-table" },
  openGraph: { title: "Book a Table | The Peacock South Yarra", description: "Secure your spot for breakfast or brunch.", url: "/book-a-table" },
};

export default function BookATablePage() {
  const c = copy.book;
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "Book a Table", path: "/book-a-table" }]} />
      <Container className="pt-8 md:pt-12">
        <header className="text-center">
          <Pill>{c.pill}</Pill>
          <h1 className="display-1 mt-6">
            <span className="block">{c.line1}</span>
            <span className="block text-teal-deep">{c.line2}</span>
          </h1>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="rounded-[var(--radius-card)] bg-sand p-6">
            <BookingWidget />
          </div>
          <aside className="rounded-[var(--radius-card)] bg-sand p-8">
            <h2 className="display-3">{c.beforeTitle}</h2>
            <ul className="mt-6 space-y-4 text-cocoa-soft">
              <li>{c.groups} <a href={site.phoneHref} className="font-bold text-teal-deep underline underline-offset-4">{site.phone}</a>.</li>
              <li>{c.mimosas}</li>
              <li>{c.surcharge}</li>
              <li>Mon–Fri {hours.weekdays.display} · Sat–Sun {hours.weekend.display} · Public holidays {hours.publicHolidays.display}</li>
            </ul>
          </aside>
        </div>
      </Container>
    </>
  );
}
```

- [ ] **Step 4: Build, test both providers, commit**

Run: `npm run build`; `NEXT_PUBLIC_BOOKING_PROVIDER=native npm run dev` shows the stub; without it shows Resos.
```bash
git add -A src/features/booking src/app/book-a-table docs/BOOKING_MIGRATION.md .env.example
git commit -m "feat: booking widget slot with resos default and native stub"
```

### Task 15: Contact page with Turnstile

**Files:**
- Create: `src/lib/turnstile.ts`, `src/lib/turnstile.test.ts`, `src/components/contact/turnstile-widget.tsx`, `src/components/sections/contact/contact-details.tsx`
- Modify: `src/app/contact-us/actions.ts`, `src/components/contact-form.tsx`, `src/app/contact-us/page.tsx`, `.env.example`
- Delete: `src/components/ui.tsx` (the shim from Task 10)

**Interfaces:**
- Produces: `verifyTurnstile({ token, secret, fetchImpl? }): Promise<boolean>`; `<TurnstileWidget siteKey />`; `<ContactDetails />`.

- [ ] **Step 1: Failing verification test**

`turnstile.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { verifyTurnstile } from "./turnstile";

const reply = (success: boolean) => new Response(JSON.stringify({ success }), { status: 200 });

describe("verifyTurnstile", () => {
  it("returns true when no secret is configured (local dev)", async () => {
    expect(await verifyTurnstile({ token: "", secret: "" })).toBe(true);
  });
  it("rejects an empty token when a secret is configured", async () => {
    const fetchImpl = vi.fn();
    expect(await verifyTurnstile({ token: "", secret: "s", fetchImpl })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("posts token and secret to siteverify and returns success", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(reply(true));
    expect(await verifyTurnstile({ token: "t", secret: "s", fetchImpl })).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    const body = init.body as URLSearchParams;
    expect(body.get("response")).toBe("t");
    expect(body.get("secret")).toBe("s");
  });
  it("returns false on a failed verification or network error", async () => {
    expect(await verifyTurnstile({ token: "t", secret: "s", fetchImpl: vi.fn().mockResolvedValueOnce(reply(false)) })).toBe(false);
    expect(await verifyTurnstile({ token: "t", secret: "s", fetchImpl: vi.fn().mockRejectedValueOnce(new Error("down")) })).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify failure, then implement**

`turnstile.ts`:
```ts
const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side Turnstile check. With no secret configured (local dev) it passes,
 * so the form keeps working without keys. Never call this from the client.
 */
export async function verifyTurnstile({
  token,
  secret = process.env.TURNSTILE_SECRET_KEY ?? "",
  fetchImpl = fetch,
}: {
  token: string;
  secret?: string;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  if (!secret) return true;
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    const res = await fetchImpl(SITEVERIFY, { method: "POST", body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
```
Run: `npm test` → green.

- [ ] **Step 3: Widget (client)**

`src/components/contact/turnstile-widget.tsx`:
```tsx
"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; remove: (id: string) => void };
  }
}

/** Renders the Turnstile challenge; the token lands in the hidden input Turnstile injects (name="cf-turnstile-response"). */
export function TurnstileWidget({ siteKey }: { siteKey: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const idRef = useRef<string | null>(null);

  const render = () => {
    if (!ref.current || !window.turnstile || idRef.current) return;
    idRef.current = window.turnstile.render(ref.current, { sitekey: siteKey, theme: "light" });
  };

  useEffect(() => {
    render();
    return () => {
      if (idRef.current && window.turnstile) window.turnstile.remove(idRef.current);
      idRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render} />
      <div ref={ref} className="mt-6" />
    </>
  );
}
```

- [ ] **Step 4: Action verifies the token**

In `actions.ts`, after the honeypot check and before field validation:
```ts
import { verifyTurnstile } from "@/lib/turnstile";
// …
const human = await verifyTurnstile({ token: String(formData.get("cf-turnstile-response") ?? "") });
if (!human) {
  return { status: "error", message: "We couldn't confirm you're not a robot. Please try again." };
}
```

- [ ] **Step 5: Restyle the form and add the widget**

In `contact-form.tsx`: accept `siteKey?: string` as a prop; render `<TurnstileWidget siteKey={siteKey} />` above the submit button when `siteKey` is truthy; success state becomes `rounded-[var(--radius-photo)] bg-sand px-6 py-5 text-center`; `Field` inputs become `w-full rounded-2xl border-2 border-cocoa/15 bg-cream px-4 py-3 focus:border-teal` with labels in `.eyebrow text-cocoa-soft`; submit button uses the same classes as `Button` primary (`eyebrow inline-flex h-[52px] items-center rounded-full bg-teal px-6 text-cocoa hover:bg-teal-deep disabled:opacity-60`). Use `copy.contact.success` for the success text. Keep the honeypot, `useActionState`, `useFormStatus` and error rendering.

- [ ] **Step 6: Details column**

`src/components/sections/contact/contact-details.tsx`:
```tsx
import Image from "next/image";
import { copy } from "@/lib/content/copy";
import { hours, site } from "@/lib/site";
import { FacebookIcon, InstagramIcon } from "@/components/icons";

export function ContactDetails() {
  const c = copy.contact;
  const maps = `https://www.google.com/maps/search/?api=1&query=${site.googleMapsQuery}`;
  return (
    <div className="rounded-[var(--radius-card)] bg-sand p-8">
      <address className="not-italic">
        <p className="text-lg font-semibold">{site.street}<br />{site.suburb} {site.state} {site.postcode}</p>
        <a href={maps} target="_blank" rel="noopener noreferrer" className="eyebrow mt-2 inline-block text-teal-deep underline underline-offset-4">{c.directions}</a>
        <p className="mt-6">
          <a href={site.phoneHref} className="font-semibold hover:text-teal-deep">{site.phone}</a><br />
          <a href={`mailto:${site.email}`} className="font-semibold hover:text-teal-deep">{site.email}</a>
        </p>
      </address>
      <dl className="mt-6 space-y-1 text-cocoa-soft">
        <div className="flex justify-between gap-4"><dt>Mon – Fri</dt><dd>{hours.weekdays.display}</dd></div>
        <div className="flex justify-between gap-4"><dt>Sat – Sun</dt><dd>{hours.weekend.display}</dd></div>
        <div className="flex justify-between gap-4"><dt>Public holidays</dt><dd>{hours.publicHolidays.display}</dd></div>
      </dl>
      <div className="mt-6 flex gap-3">
        <a href={site.instagram} target="_blank" rel="noopener noreferrer" aria-label={`${site.shortName} on Instagram`}><InstagramIcon className="h-6 w-6" /></a>
        <a href={site.facebook} target="_blank" rel="noopener noreferrer" aria-label={`${site.shortName} on Facebook`}><FacebookIcon className="h-6 w-6" /></a>
      </div>
      <a href={site.googleReview} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block">
        <Image src="/images/google-review.png" alt={c.review} width={173} height={50} className="h-[50px] w-auto" />
      </a>
    </div>
  );
}
```

- [ ] **Step 7: Rewrite `contact-us/page.tsx`**

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbSchema } from "@/components/structured-data";
import { ContactForm } from "@/components/contact-form";
import { ContactDetails } from "@/components/sections/contact/contact-details";
import { Container } from "@/components/ui/container";
import { Pill } from "@/components/ui/pill";
import { copy } from "@/lib/content/copy";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Have some feedback or need to get in touch with us? Leave your comments here.",
  alternates: { canonical: "/contact-us" },
  openGraph: { title: "Contact Us | The Peacock South Yarra", description: "Have some feedback or need to get in touch with us?", url: "/contact-us", images: [{ url: "/images/og-contact.jpg", width: 1470, height: 700 }] },
};

export default function ContactPage() {
  const c = copy.contact;
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "Contact", path: "/contact-us" }]} />
      <Container className="pt-8 md:pt-12">
        <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-card)] md:aspect-[1440/480]">
          <Image src="/images/shopfront.jpg" alt="The Peacock shopfront on River Street, South Yarra" fill priority sizes="100vw" className="object-cover object-[50%_30%]" />
        </div>

        <header className="mt-12 text-center">
          <Pill>{c.pill}</Pill>
          <h1 className="display-1 mt-6">{c.title}</h1>
          <p className="mx-auto mt-6 max-w-[56ch] text-cocoa-soft">{c.intro}</p>
        </header>

        <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="rounded-[var(--radius-card)] bg-sand p-6 md:p-10">
            <ContactForm siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
          </div>
          <ContactDetails />
        </div>

        <div className="section-gap overflow-hidden rounded-[var(--radius-card)]">
          <iframe
            title={`Map showing ${site.name} at ${site.street}, ${site.suburb}`}
            src={`https://www.google.com/maps?q=${site.googleMapsQuery}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[350px] w-full border-0"
          />
        </div>
      </Container>
    </>
  );
}
```
Remove the `src/components/ui.tsx` shim (`git rm src/components/ui.tsx`) and confirm `grep -rn 'components/ui"' src` is empty. Add to `.env.example`:
```
# Cloudflare Turnstile. Without a site key the widget is not rendered and
# verification is skipped (local dev).
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

- [ ] **Step 8: Build, test the form, commit**

Run: `npm test && npm run build && npm run dev`. With no keys: submit → mailto fallback message. With Cloudflare's test keys (`1x00000000000000000000AA` / `1x0000000000000000000000000000000AA`): widget renders and passes.
```bash
git add -A src/lib/turnstile.ts src/lib/turnstile.test.ts src/components/contact src/components/contact-form.tsx src/components/sections/contact src/app/contact-us src/components/ui.tsx .env.example
git commit -m "feat: contact page with turnstile-protected form"
```

---

## Phase 3 — Cloudflare, cutover, release

### Task 16: OpenNext on Cloudflare Workers

**Files:**
- Create: `wrangler.jsonc`, `open-next.config.ts`, `.dev.vars.example`, `docs/ops/DEPLOY.md`
- Modify: `package.json`, `.gitignore`, `next.config.ts`

**Interfaces:**
- Produces: `npm run preview` (local Workers runtime), `npm run deploy`, `npm run cf-typegen`.

- [ ] **Step 1: Install**

```bash
npm install @opennextjs/cloudflare@latest
npm install -D wrangler@latest
```
Confirm `npx wrangler --version` ≥ 3.99.

- [ ] **Step 2: `wrangler.jsonc`** (spec §10.1; set `compatibility_date` to today)

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "peacock-south-yarra",
  "main": ".open-next/worker.js",
  "compatibility_date": "2026-09-21",
  "compatibility_flags": ["nodejs_compat", "global_fetch_strictly_public"],
  "assets": { "directory": ".open-next/assets", "binding": "ASSETS" },
  "services": [{ "binding": "WORKER_SELF_REFERENCE", "service": "peacock-south-yarra" }],
  "r2_buckets": [{ "binding": "NEXT_INC_CACHE_R2_BUCKET", "bucket_name": "peacock-inc-cache" }],
  "durable_objects": {
    "bindings": [{ "name": "NEXT_CACHE_DO_QUEUE", "class_name": "DOQueueHandler" }]
  },
  "migrations": [{ "tag": "v1", "new_sqlite_classes": ["DOQueueHandler"] }],
  "images": { "binding": "IMAGES" },
  "observability": { "enabled": true },
  "vars": {
    "NEXTJS_ENV": "production",
    "NEXT_PUBLIC_BOOKING_PROVIDER": "resos",
    "CONTACT_TO_EMAIL": "hello@thepeacock.com.au",
    "CONTACT_FROM_EMAIL": "The Peacock <hello@thepeacock.com.au>",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY": ""
  }
  // "routes" are added at cutover — see docs/ops/CUTOVER.md step 4.
}
```
`NEXT_PUBLIC_*` values are inlined at build time by Next; for Workers Builds set them as build-time variables in the dashboard too (DEPLOY.md covers it).

- [ ] **Step 3: `open-next.config.ts`**

```ts
import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";

export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  queue: doQueue,
});
```

- [ ] **Step 4: `next.config.ts`, scripts, ignores**

Append to `next.config.ts` after the export:
```ts
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
```
(Keep `export default nextConfig` above it — the call must run at module load.)

`package.json` scripts:
```json
"preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
"deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
"upload": "opennextjs-cloudflare build && opennextjs-cloudflare upload",
"cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
```
`.gitignore` — add `.open-next`, `.dev.vars`, `cloudflare-env.d.ts`, `.wrangler`.

`.dev.vars.example`:
```
NEXTJS_ENV=development
SQUARE_ACCESS_TOKEN=
SQUARE_LOCATION_ID=
RESEND_API_KEY=
TURNSTILE_SECRET_KEY=
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
NEXT_PUBLIC_BOOKING_PROVIDER=resos
```

- [ ] **Step 5: Preview locally**

Run: `npm run preview` — all four routes load in the Workers runtime; the `/menu` page shows the snapshot (or Square if `.dev.vars` has the token); the contact form posts. If `next/image` errors locally on the `IMAGES` binding, note it — previews serve originals (spec §10.3); only if it errors *outright* switch to the custom loader:
```ts
// image-loader.ts
import type { ImageLoaderProps } from "next/image";
const normalize = (src: string) => (src.startsWith("/") ? src.slice(1) : src);
export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps) {
  const params = [`width=${width}`, `quality=${quality ?? 75}`, "format=auto"];
  return `/cdn-cgi/image/${params.join(",")}/${normalize(src)}`;
}
```
with `images: { loader: "custom", loaderFile: "./image-loader.ts" }` in `next.config.ts`, and remove the `images` binding from `wrangler.jsonc`.

- [ ] **Step 6: `docs/ops/DEPLOY.md`**

Write the runbook Kayden follows in the Cloudflare dashboard:
1. Create R2 bucket `peacock-inc-cache` (Workers & Pages → R2).
2. Workers & Pages → Create → Import a repository → `kaydendo42-web/peacock-south-yarra`. Build command `npx opennextjs-cloudflare build`, deploy command `npx opennextjs-cloudflare deploy`, production branch `main`. Enable preview deployments for non-production branches.
3. Settings → Variables and Secrets: add secrets `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` as a **build** variable as well as a runtime var.
4. First deploy runs the DO migration automatically. Confirm the `*.workers.dev` URL serves `/`, `/menu`, `/book-a-table`, `/contact-us`.
5. Record which image path (binding vs custom loader) shipped, and why.
6. Rollback: Deployments tab → previous version → Rollback.

- [ ] **Step 7: Build and commit**

Run: `npm test && npm run build`
```bash
git add wrangler.jsonc open-next.config.ts .dev.vars.example docs/ops/DEPLOY.md package.json package-lock.json .gitignore next.config.ts
git commit -m "chore: deploy to cloudflare workers with opennext"
```

### Task 17: Cutover runbook and DNS audit template

**Files:**
- Create: `docs/ops/CUTOVER.md`, `docs/ops/dns-before.md`

- [ ] **Step 1: `dns-before.md` template**

```md
# thepeacock.com.au — DNS before cutover

Exported from Crazy Domains on: ____
Nameservers before: ____

| Type | Host | Value | TTL | Purpose (Wix / mail / verification / unknown) |
|---|---|---|---|---|
| | | | | |

Mail host (from MX): ____
Mailbox provider for hello@ (Google Workspace via Wix / Google direct / other): ____
Screenshots: docs/ops/dns-before/*.png
```

- [ ] **Step 2: `CUTOVER.md`** — the seven steps of spec §11 written as a checklist with the exact Cloudflare screens:

```md
# Cutover: Wix → Cloudflare

Owner: Kayden. Do not start before Task 18 passes.

- [ ] 1. Audit. Fill docs/ops/dns-before.md from Crazy Domains → DNS settings. Identify MX, SPF (TXT v=spf1), DKIM (TXT *._domainkey), DMARC (TXT _dmarc), verification TXTs, Wix A (185.230.x.x) and CNAME (www → *.wixdns.net).
- [ ] 2. Cloudflare → Add a site → thepeacock.com.au → Free. Compare the scanned records with the audit line by line; add anything missing. Set MX-related hosts and every non-website host to DNS only (grey cloud).
- [ ] 3. Crazy Domains → Nameservers → replace with the two Cloudflare nameservers shown. Wait for the zone to show Active (check email from Cloudflare; up to 48h). The Wix site keeps serving meanwhile.
- [ ] 4. Zone active → in wrangler.jsonc add
      "routes": [
        { "pattern": "www.thepeacock.com.au", "custom_domain": true },
        { "pattern": "thepeacock.com.au", "custom_domain": true }
      ]
      commit to main (Workers Builds deploys). Cloudflare creates the DNS records for both hosts; delete the Wix A/CNAME first if it refuses.
- [ ] 5. Rules → Redirect Rules → "apex to www": if hostname eq "thepeacock.com.au" → dynamic redirect concat("https://www.thepeacock.com.au", http.request.uri.path), 301, preserve query string.
- [ ] 6. Resend → Domains → add thepeacock.com.au → copy the DKIM/SPF/MX records into Cloudflare DNS (DNS only) → verify. Set CONTACT_FROM_EMAIL to hello@thepeacock.com.au if not already.
- [ ] 7. Images → Transformations → enable for the zone. Analytics & Logs → Web Analytics → enable for thepeacock.com.au.
- [ ] 8. Turnstile → Add widget → hostname thepeacock.com.au → put the site key in NEXT_PUBLIC_TURNSTILE_SITE_KEY (build + runtime var) and the secret in TURNSTILE_SECRET_KEY → redeploy.
- [ ] 9. Email check: send from an outside address to hello@ and reply from hello@. If the mailbox is Google Workspace bought through Wix, move the subscription to direct Google billing before step 12.
- [ ] 10. Search Console: add property (DNS TXT verification via Cloudflare), submit https://www.thepeacock.com.au/sitemap.xml. Run:
      curl -I https://www.thepeacock.com.au/general-1
      curl -I https://www.thepeacock.com.au/book-online
      curl -I https://www.thepeacock.com.au/cafe-menu
      curl -I https://thepeacock.com.au/
      Expect 301/308 to /menu, /book-a-table, /menu, https://www.thepeacock.com.au/.
- [ ] 11. Confirm the menu source: view-source of /menu must NOT contain data-menu-source="snapshot" once Square secrets are set.
- [ ] 12. After 14 clean days: cancel the Wix premium plan. Keep the Wix account (free) for a further month in case assets are needed.
```

- [ ] **Step 3: Commit**

```bash
git add docs/ops/CUTOVER.md docs/ops/dns-before.md
git commit -m "docs: dns audit template and wix to cloudflare cutover runbook"
```

### Task 18: Release verification gate

**Files:**
- Create: `docs/research/revamp/` (screenshots), `docs/ops/RELEASE-CHECK.md` (results)

Spec §12. Every line must pass before Kayden runs CUTOVER.md.

- [ ] **Step 1: Build and preview**

`npm test && npm run build && npm run preview` — all four routes 200.

- [ ] **Step 2: Lighthouse (mobile) on `/` and `/menu`**

`npx lighthouse http://localhost:8787/ --preset=perf --form-factor=mobile --output=json --output-path=docs/ops/lh-home.json` and the same for `/menu`. Performance, Accessibility, Best Practices, SEO each ≥ 90. Fix and re-run until they are. Commit the JSON reports.

- [ ] **Step 3: axe**

`npx @axe-core/cli http://localhost:8787/ http://localhost:8787/menu http://localhost:8787/book-a-table http://localhost:8787/contact-us` — zero violations.

- [ ] **Step 4: Screenshots**

Playwright one-off (no dependency added to the repo — use `npx playwright screenshot`):
```bash
for w in 390 834 1440; do for p in "" menu book-a-table contact-us; do
  npx playwright screenshot --viewport-size="$w,900" --full-page "http://localhost:8787/$p" "docs/research/revamp/${p:-home}-$w.png"
done; done
```
Eyeball against https://fereacafe.framer.website for rhythm, radius, type scale. Fix what looks off.

- [ ] **Step 5: Redirects, schema, fallback**

- `curl -I` the three redirect routes on the preview → 301/308.
- Paste `view-source:` of `/` and `/menu` JSON-LD into https://search.google.com/test/rich-results — no errors.
- Stop preview; run again with `SQUARE_ACCESS_TOKEN` removed from `.dev.vars` → `/menu` source contains `data-menu-source="snapshot"` and the full menu renders.

- [ ] **Step 6: Contact form, motion, keyboard**

- Real Resend key to a Peregrine inbox + Turnstile test keys → email arrives with reply-to set.
- DevTools → Rendering → emulate `prefers-reduced-motion: reduce` → nothing moves on `/`.
- Keyboard only: skip link → nav → drawer (390) → hero buttons → carousel links → FAQ → footer. Focus ring visible everywhere.

- [ ] **Step 7: Record and commit**

Write `docs/ops/RELEASE-CHECK.md` with each line above, the result, and the date.
```bash
git add docs/research/revamp docs/ops/RELEASE-CHECK.md docs/ops/lh-*.json
git commit -m "docs: release verification results"
```

### Task 19: Docs and cleanup

**Files:**
- Modify: `README.md`, `CLAUDE.md`, `AGENTS.md`
- Delete: any unused file `grep` proves unreferenced (`src/components/icons.tsx` stays; `public/images/menu-food.jpg|webp`, `menu-drinks.jpg|webp` are no longer rendered but stay as archive; `public/file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg` go)

- [ ] **Step 1: README**

Replace "Live (Wix, still authoritative)" with the Cloudflare status, the stack line with `Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · Cloudflare Workers via OpenNext · Square Catalog`, the Layout tree with the new folders (`src/components/{ui,chrome,sections}`, `src/lib/{content,square}`, `src/features/booking`, `docs/ops`), a "Menu updates" section ("Edit items in Square; the site refreshes within an hour. To refresh the fallback snapshot run `npm run square:snapshot`."), a "Deploying" section pointing at `docs/ops/DEPLOY.md`, and "Still to do" → replace with links to `CUTOVER.md` and `src/features/booking/README.md`. Delete the "How the rebuild was made" and "Deliberate differences" sections (they describe the 1:1 migration; keep a one-line pointer to `docs/research/` for history).

- [ ] **Step 2: CLAUDE.md / AGENTS.md**

Both files carry the same ground rules; update both:
- Replace the design-token rule with: "Tokens are the eight colours and two fonts in `globals.css` `@theme`; see spec §4. Teal buttons use cocoa text."
- Replace the menu rule with: "The menu comes from Square (`src/lib/square/`). `src/lib/menu.ts` and `menu.snapshot.json` are the fallback — keep them in sync with `npm run square:snapshot`."
- Add: "Bookings: only `src/features/booking/` knows about Resos."
- Add: "Deploy: Cloudflare Workers via OpenNext — `npm run preview` before `npm run deploy`; never add `runtime = "edge"`."
- Verifying a change: `npm test && npm run build && npm run preview`.

- [ ] **Step 3: Remove the Create-Next-App SVGs and commit**

```bash
git rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
npm run build
git add README.md CLAUDE.md AGENTS.md
git commit -m "docs: readme and agent rules for the revamped site"
```

---

## Handover notes for Kayden

- Tasks 9 (Square discovery), 16 step 6 (Cloudflare dashboard), 17 (cutover) and 18 step 6 (real Resend key) need things only you have. Codex will do everything else and stop at those points with the state clearly described in the commit body.
- Review `docs/research/square/MAPPING.md` when it lands — it decides what Square categories become menu sections.
- Supply `reviews.ts` and `instagram.ts` data (spec §13) whenever ready; the sections switch on automatically.
- Jason picks up from `src/features/booking/README.md`.
