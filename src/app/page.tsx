import { WebSiteSchema } from "@/components/structured-data";
import { CafeFaq, InstagramSection } from "@/components/cafe-sections";
import { CoffeeHero } from "@/components/coffee-hero";
import { DogRegulars } from "@/components/dog-regulars";
import { Reveal } from "@/components/reveal";

export default function HomePage() {
  return (
    <>
      <WebSiteSchema />
      <CoffeeHero />
      <DogRegulars />
      <Reveal>
        <InstagramSection />
      </Reveal>
      <Reveal>
        <CafeFaq />
      </Reveal>
    </>
  );
}
