import type { Metadata } from "next";
import { BreadcrumbSchema, MenuSchema } from "@/components/structured-data";
import { MenuExplorer } from "@/components/menu-explorer";
import {
  dietaryLegend,
  getMenu,
  menuFootnotes,
  menuSpecials,
} from "@/lib/menu";
export const metadata: Metadata = {
  title: "The menu",
  description:
    "All-day breakfast, brunch, St. ALi coffee, ceremonial matcha and something sweet at The Peacock South Yarra.",
  alternates: { canonical: "/menu" },
};
export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const [menu, params] = await Promise.all([getMenu(), searchParams]);
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
        ]}
      />
      <MenuSchema
        boards={menu.boards}
        includePrices
      />
      <div className="illustrated-menu">
        <header className="page-masthead container menu-masthead">
          <h1>
            our
            <br />
            <span className="angled-title">menu</span>
          </h1>
        </header>
        <div className="container menu-layout">
          <p className="menu-notice">
            Prices in Australian dollars. Please let our team know about
            allergies and dietary requirements before ordering.
          </p>
          <MenuExplorer
            key={params.view || "food"}
            boards={menu.boards}
            initialView={params.view}
          />
          <ul className="menu-specials">
            {menuSpecials.map((special) => (
              <li key={special.id}>
                <h3>{special.title}</h3>
                <p>{special.detail}</p>
              </li>
            ))}
          </ul>
          <div className="menu-conditions">
            <p>
              {dietaryLegend
                .map((d) => `${d.code}: ${d.meaning}`)
                .join(" · ")}
            </p>
            <ul>
              {menuFootnotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
