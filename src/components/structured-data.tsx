import { hours, site } from "@/lib/site";
import type { MenuBoard } from "@/lib/menu";

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Catalog text is external input: prevent closing the script element.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

/**
 * The Wix site emitted a bare LocalBusiness with no hours, geo, cuisine or
 * menu. This is the full CafeOrCoffeeShop shape Google actually reads.
 */
export function LocalBusinessSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "CafeOrCoffeeShop",
        "@id": `${site.url}/#business`,
        name: site.name,
        alternateName: site.shortName,
        url: site.url,
        image: [
          `${site.url}/images/cafe-menu-hero.jpg`,
          `${site.url}/images/shopfront.jpg`,
        ],
        logo: `${site.url}/images/logo.png`,
        telephone: site.phoneRaw,
        email: site.email,
        priceRange: site.priceRange,
        currenciesAccepted: "AUD",
        servesCuisine: ["Brunch", "Breakfast", "Cafe", "Australian"],
        hasMenu: `${site.url}/menu`,
        address: {
          "@type": "PostalAddress",
          streetAddress: site.street,
          addressLocality: site.suburb,
          addressRegion: site.state,
          postalCode: site.postcode,
          addressCountry: site.country,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: site.geo.lat,
          longitude: site.geo.lng,
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            opens: hours.weekdays.open,
            closes: hours.weekdays.close,
          },
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Saturday", "Sunday"],
            opens: hours.weekend.open,
            closes: hours.weekend.close,
          },
        ],
        acceptsReservations: `${site.url}/book-a-table`,
        sameAs: [site.instagram, site.facebook],
      }}
    />
  );
}

export function WebSiteSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        name: site.name,
        url: site.url,
        publisher: { "@id": `${site.url}/#business` },
        inLanguage: "en-AU",
      }}
    />
  );
}

/** Full Menu graph so the food and prices are machine-readable. */
export function MenuSchema({
  boards,
  includePrices = true,
}: {
  boards: MenuBoard[];
  includePrices?: boolean;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": `${site.url}/menu#menu`,
        name: `${site.name} menu`,
        url: `${site.url}/menu`,
        inLanguage: "en-AU",
        hasMenuSection: boards
          .flatMap((board) => board.sections)
          .map((section) => ({
            "@type": "MenuSection",
            name: section.title,
            description: section.subtitle,
            hasMenuItem: section.items.map((item) => ({
              "@type": "MenuItem",
              name: item.name,
              ...(item.description ? { description: item.description } : {}),
              ...(includePrices &&
              item.price &&
              /^\d+(\.\d+)?$/.test(item.price)
                ? {
                    offers: {
                      "@type": "Offer",
                      price: item.price.replace(/[^\d.]/g, ""),
                      priceCurrency: "AUD",
                    },
                  }
                : {}),
            })),
          })),
      }}
    />
  );
}

export function BreadcrumbSchema({
  items,
}: {
  items: { name: string; path: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: `${site.url}${item.path}`,
        })),
      }}
    />
  );
}
