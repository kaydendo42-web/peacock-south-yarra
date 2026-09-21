import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // The owner console and the booking API are not pages anyone should find
    // in a search result. `noindex` on the pages themselves is the part that
    // actually binds; this keeps crawlers from spending the request at all.
    rules: [{ userAgent: "*", allow: "/", disallow: ["/owners", "/api/"] }],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
