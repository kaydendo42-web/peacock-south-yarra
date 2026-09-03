import Image from "next/image";
import { HeroSlideshow, type Slide } from "@/components/hero-slideshow";
import { SectionHeading, TealButton } from "@/components/ui";
import { WebSiteSchema } from "@/components/structured-data";
import { site } from "@/lib/site";

const slides: Slide[] = [
  { src: "/images/hero-1.jpg", alt: "A shared table of brunch dishes at The Peacock South Yarra" },
  { src: "/images/hero-2.jpg", alt: "Brunch plating at The Peacock South Yarra" },
  { src: "/images/hero-3.jpg", alt: "Inside the plant-filled dining room at The Peacock" },
  { src: "/images/hero-4.jpg", alt: "Coffee and a sweet dish at The Peacock South Yarra" },
  { src: "/images/hero-5.jpg", alt: "A seasonal dish from the all day menu" },
];

export default function HomePage() {
  return (
    <>
      <WebSiteSchema />

      <HeroSlideshow slides={slides} />

      <section className="px-5 pt-8 pb-12 text-center lg:pt-[10px] lg:pb-[88px]">
        <h1 className="font-sans text-[30px] leading-[1.25] text-teal lg:text-[44px]">
          THE PEACOCK SOUTH YARRA
        </h1>
        <TealButton href="/book-a-table" className="mt-6 lg:mt-2">
          BOOK A TABLE
        </TealButton>
      </section>

      <section className="mx-auto grid max-w-[1440px] items-start gap-10 pb-12 lg:grid-cols-[minmax(0,1fr)_619px] lg:gap-16 lg:pb-10 lg:pl-[131px]">
        <div className="px-5 lg:max-w-[580px] lg:px-0">
          <SectionHeading>South Yarra Brunch Cafe</SectionHeading>
          <div className="mt-8 space-y-6 font-body text-[17px] leading-[1.47] text-ink">
            <p>
              Located in the heart of South Yarra, The Peacock occupies a beautifully renovated
              1930&apos;s weatherboard house, and has a variety of cosy seating options which has
              quickly become a favourite hotspot with the locals and is one of the most popular
              cafes in South Yarra. Offering beautiful food in a beautiful plant-filled setting,
              whether you meeting friends for a coffee, or catching up over brunch, our menu caters
              to everyone including a great range of vegetarian and vegan options.
            </p>
            <p>
              Furbabies are very welcome on the front deck or rear courtyard...make sure you shout
              them a house made peanut butter doggo biscuit :)
            </p>
            <p>Stuck for a gift idea? Buy a prepaid coffee card!</p>
            <p className="pt-4">
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="font-display text-[26px] text-teal transition-opacity hover:opacity-75 lg:text-[30px]"
              >
                {site.instagramHandle}
              </a>
            </p>
          </div>
        </div>

        <div className="relative aspect-[619/592] w-full lg:aspect-auto lg:h-[592px]">
          <Image
            src="/images/peacock-sign.jpg"
            alt="The Peacock signage on the greenery-covered front fence"
            fill
            sizes="(max-width: 1024px) 100vw, 619px"
            className="object-cover"
          />
        </div>
      </section>
    </>
  );
}
