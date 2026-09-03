import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Jost, Oswald, Raleway, Archivo_Black } from "next/font/google";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { LocalBusinessSchema } from "@/components/structured-data";
import { site } from "@/lib/site";
import "./globals.css";

/*
  The live site sets these in Wix-licensed faces (Avenir LT, Brandon Grotesque,
  DIN Neuzeit Grotesk, TT Lakes). Those cannot be redistributed, so each role is
  mapped to its closest free equivalent while the measured sizes, weights and
  line-heights are kept exactly. See docs/research/DESIGN_TOKENS.md.
*/
const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700", "800"],
  display: "swap",
});
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});
const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});
const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});
const archivoBlack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Best Brunch Cafe in South Yarra | The Peacock South Yarra",
    template: "%s | The Peacock South Yarra",
  },
  description:
    "We're a cozy cafe nestled on River St, South Yarra serving Melbourne's best breakfast and brunch. Visit us on weekends for our cocktails & tapas nights!",
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    siteName: site.name,
    url: site.url,
    title: "Best Brunch Cafe in South Yarra | The Peacock South Yarra",
    description:
      "The Peacock South Yarra is Melbourne's best brunch cafe to enjoy with friends and family. Join us today.",
    images: [{ url: "/images/cafe-menu-hero.jpg", width: 2560, height: 1708, alt: site.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Brunch Cafe in South Yarra | The Peacock South Yarra",
    description:
      "The Peacock South Yarra is Melbourne's best brunch cafe to enjoy with friends and family.",
    images: ["/images/cafe-menu-hero.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#18c1c0",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-AU"
      className={`${nunitoSans.variable} ${jost.variable} ${oswald.variable} ${raleway.variable} ${archivoBlack.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <LocalBusinessSchema />
      </body>
    </html>
  );
}
