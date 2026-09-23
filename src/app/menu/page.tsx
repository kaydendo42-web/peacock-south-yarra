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
          <h1>
            our
            <br />
            <span className="angled-title">menu</span>
          </h1>
        </header>
        <div className="container menu-layout">
          {menu.source === "local" && (
            <p className="menu-notice">
              Menu and prices are being confirmed. Please check with the team
              before ordering.
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
              <h2>THE MENU ISN&rsquo;T LOADING.</h2>
              <p>
                Please try again soon, or give us a call.
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
