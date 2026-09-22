import type { Metadata, Viewport } from "next";
import { Fira_Sans_Extra_Condensed, Jost } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LocalBusinessSchema } from "@/components/structured-data";
import { site } from "@/lib/site";
import "./globals.css";
import "./redesign.css";
import "./third-pass.css";
import "./booking.css";

const display = Fira_Sans_Extra_Condensed({
  variable: "--font-fira",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});
const body = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.shortName} | Brunch, Coffee & Good Company in ${site.suburb}`,
    template: `%s | ${site.name}`,
  },
  description: `All-day brunch, St. ALi coffee and a little green escape in ${site.suburb}. Find your favourite corner at ${site.shortName}, with a dog-friendly deck and courtyard.`,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: site.name,
    url: site.url,
    title: site.name,
    description:
      "Your daily happy place. All-day brunch, coffee and good company.",
    images: [
      {
        url: "/images/hero-1.jpg",
        width: 2560,
        height: 1708,
        alt: "Brunch at The Peacock",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    images: ["/images/hero-1.jpg"],
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  themeColor: "#fff9ed",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-AU" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
        <LocalBusinessSchema />
      </body>
    </html>
  );
}
