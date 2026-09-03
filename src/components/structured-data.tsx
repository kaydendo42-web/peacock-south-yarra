import { hours, site } from "@/lib/site";
import { drinksMenu, foodMenu } from "@/lib/menu";

function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Values are all authored in this repo, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
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
        image: [`${site.url}/images/cafe-menu-hero.jpg`, `${site.url}/images/shopfront.jpg`],
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
export function MenuSchema() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Menu",
        "@id": `${site.url}/menu#menu`,
        name: `${site.name} menu`,
        url: `${site.url}/menu`,
        inLanguage: "en-AU",
        hasMenuSection: [...foodMenu.sections, ...drinksMenu.sections].map((section) => ({
          "@type": "MenuSection",
          name: section.title,
          description: section.subtitle,
          hasMenuItem: section.items.map((item) => ({
            "@type": "MenuItem",
            name: item.name,
            ...(item.description ? { description: item.description } : {}),
            ...(item.price && /^\+?[\d.]+/.test(item.price)
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

export function BreadcrumbSchema({ items }: { items: { name: string; path: string }[] }) {
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
