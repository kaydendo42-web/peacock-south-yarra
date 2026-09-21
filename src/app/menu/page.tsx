import type { Metadata } from "next";
import { BreadcrumbSchema, MenuSchema } from "@/components/structured-data";
import { MenuExplorer } from "@/components/menu-explorer";
import { dietaryLegend, getMenu, menuFootnotes } from "@/lib/menu";
import { site } from "@/lib/site";
import { MenuAtmosphere } from "@/components/menu-atmosphere";
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
        includePrices={menu.source === "square"}
      />
      <MenuAtmosphere>
        <header className="page-masthead container menu-masthead">
          <p className="eyebrow">Made for mornings. And a little longer.</p>
          <h1>
            WHAT ARE YOU
            <br />
            <span className="angled-title">IN THE MOOD FOR?</span>
          </h1>
          <p>
            All-day favourites, a proper coffee and something sweet.
            <br />
            Find your usual. Or find a new one.
          </p>
        </header>
        <div className="container menu-layout">
          {menu.source === "local" && (
            <p className="menu-notice">
              Menu and prices are being confirmed. This is our existing café
              menu; please check with the team before ordering.
            </p>
          )}
          {menu.source === "square" && (
            <p className="menu-notice">
              Prices in Australian dollars. Please let our team know about
              allergies and dietary requirements before ordering.
            </p>
          )}
          {menu.source === "unavailable" ? (
            <div className="empty-menu" role="status">
              <h2>OUR MENU IS TAKING A MOMENT.</h2>
              <p>
                Please refresh in a little while, or call us and we’ll help you
                with today’s dishes and prices.
              </p>
              <a className="button" href={site.phoneHref}>
                Call {site.phone} <span aria-hidden="true">↗</span>
              </a>
            </div>
          ) : (
            <MenuExplorer
              key={params.view || "all"}
              boards={menu.boards}
              initialView={params.view}
            />
          )}
          <div className="menu-conditions">
            {menu.source === "local" && (
              <p>
                {dietaryLegend
                  .map((d) => `${d.code}: ${d.meaning}`)
                  .join(" · ")}
              </p>
            )}
            <ul>
              {menuFootnotes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </MenuAtmosphere>
    </>
  );
}
