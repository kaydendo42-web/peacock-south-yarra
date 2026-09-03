import type { Metadata } from "next";
import Image from "next/image";
import { TealButton } from "@/components/ui";
import { BreadcrumbSchema } from "@/components/structured-data";

export const metadata: Metadata = {
  title: "Peacock Menu",
  description:
    "The Peacock South Yarra cafe menu. View online — coffee, breakfast, brunch and lunch items available daily.",
  alternates: { canonical: "/cafe-menu" },
  openGraph: {
    title: "Peacock Menu | The Peacock South Yarra | Brunch Cafe",
    description: "The Peacock South Yarra cafe menu. View online.",
    url: "/cafe-menu",
    images: [{ url: "/images/og-cafe-menu.jpg", width: 1600, height: 1055 }],
  },
};

export default function CafeMenuPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Cafe Menu", path: "/cafe-menu" },
        ]}
      />

      <section className="px-5 py-12 text-center lg:py-[56px]">
        <h1 className="sr-only">The Peacock South Yarra cafe menu</h1>
        <div className="flex flex-col items-center gap-[36px]">
          <TealButton href="/menu">MENU</TealButton>
          <TealButton href="/book-a-table">BOOK A TABLE</TealButton>
        </div>
      </section>

      <div className="relative aspect-[1440/400] w-full">
        <Image
          src="/images/cafe-menu-hero.jpg"
          alt="Salads and a heart-topped latte on a timber table at The Peacock"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>
    </>
  );
}
