import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbSchema, MenuSchema } from "@/components/structured-data";
import { dietaryLegend, getMenu, menuFootnotes, menuSpecials } from "@/lib/menu";

export const metadata: Metadata = {
  title: "The menu",
  description:
    "All-day breakfast, brunch, St. ALi coffee, ceremonial matcha and something sweet at The Peacock South Yarra.",
  alternates: { canonical: "/menu" },
};

/** Jenny's printed menus, shown as she prints them rather than retyped. */
const SHEETS = [
  { id: "food", title: "Food menu", sub: "All day, every day", src: "/images/menu-food.jpg" },
  { id: "drinks", title: "Drinks menu", sub: "Coffee, matcha, juice and cocktails", src: "/images/menu-drinks.jpg" },
] as const;

const PHOTOS = [
  { src: "/images/hero-2.jpg", alt: "Blueberry honeycomb hotcakes with fresh fruit" },
  { src: "/images/instagram-eggs.webp", alt: "Folded eggs on sourdough" },
  { src: "/images/instagram-coffee.webp", alt: "A flat white with swan latte art" },
  { src: "/images/hero-3.jpg", alt: "A fruit and matcha bowl" },
  { src: "/images/instagram-porridge.webp", alt: "Peacock porridge with fruit" },
  { src: "/images/hero-4.jpg", alt: "A table of brunch dishes from above" },
] as const;

/**
 * Jenny asked for less: people want to see the food and the real menu, not a
 * retyped one to scroll. Photos first, then her two menus open full size (a
 * plain link, so a phone can pinch-zoom them), then the specials and the
 * fine print. The typed menu in `lib/menu.ts` still feeds the Menu schema.
 */
export default async function MenuPage() {
  const menu = await getMenu();
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
        ]}
      />
      <MenuSchema boards={menu.boards} includePrices />

      <header className="page-masthead container menu-masthead">
        <h1>
          our <span className="angled-title">menu</span>
        </h1>
        <p>All-day brunch, St. ALi coffee and ceremonial matcha.</p>
      </header>

      <section className="container menu-photos" aria-label="From the kitchen">
        {PHOTOS.map((p) => (
          <div className="menu-photo" key={p.src}>
            <Image src={p.src} alt={p.alt} fill priority sizes="(max-width:700px) 33vw, 16vw" className="photo" />
          </div>
        ))}
      </section>

      <section className="container menu-sheets" aria-label="Our menus">
        {SHEETS.map((s) => (
          <a key={s.id} className="menu-sheet" href={s.src} target="_blank" rel="noreferrer">
            <span className="menu-sheet__thumb">
              <Image src={s.src} alt={`The Peacock ${s.title.toLowerCase()}`} fill sizes="(max-width:700px) 100vw, 50vw" />
            </span>
            <span className="menu-sheet__label">
              <span className="menu-sheet__title">{s.title}</span>
              <span className="menu-sheet__sub">{s.sub}</span>
            </span>
            <span className="menu-sheet__open" aria-hidden="true">
              Open ↗︎
            </span>
          </a>
        ))}
      </section>

      <section className="container menu-after">
        <ul className="menu-specials">
          {menuSpecials.map((special) => (
            <li key={special.id}>
              <h3>{special.title}</h3>
              <p>{special.detail}</p>
            </li>
          ))}
        </ul>
        <div className="menu-conditions">
          <p>Prices in Australian dollars. Please tell our team about allergies and dietary requirements before ordering.</p>
          <p>{dietaryLegend.map((d) => `${d.code}: ${d.meaning}`).join(" · ")}</p>
          <ul>
            {menuFootnotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
