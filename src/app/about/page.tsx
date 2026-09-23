import type { Metadata } from "next";
import { CafeFaq } from "@/components/cafe-sections";
import { CoffeeDrawing } from "@/components/cafe-art";
import { BreadcrumbSchema } from "@/components/structured-data";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
export const metadata: Metadata = {
  title: "Our place",
  description:
    "The Peacock is a café in a 1930s weatherboard house with all-day brunch, coffee and a dog-friendly courtyard.",
  alternates: { canonical: "/about" },
};
export default function AboutPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Our place", path: "/about" },
        ]}
      />
      <section className="place-intro container">
        <header className="place-intro-copy">
          <h1>
            A café in a
            <br />
            1930s weatherboard
            <br />
            <span>house.</span>
          </h1>
          <Link className="text-link" href="/menu">
            See our menu <span aria-hidden="true">↗</span>
          </Link>
        </header>
        <figure className="place-interior">
          <div className="place-interior-photo">
            <Image
              src="/images/peacock-interior.webp"
              alt="Hanging plants, white café chairs and customers enjoying coffee inside The Peacock"
              fill
              sizes="(max-width:700px) 90vw, 55vw"
              preload
              className="photo"
            />
          </div>
        </figure>
      </section>
      <Reveal className="container place-story">
        <div>
          <h2>our story</h2>
          <div className="place-story-columns">
            <p>
              The Peacock is in a 1930s weatherboard house full of plants. Come
              in for a coffee before work, brunch with friends, or a quiet table
              on your own.
            </p>
            <p>
              Sit inside under the hanging plants, out on the front deck, or in
              the rear courtyard. Dogs are welcome outside.
            </p>
          </div>
        </div>
      </Reveal>
      <section className="values-section">
        <div className="container section">
          <CoffeeDrawing className="values-coffee" />
          <h2>what we&rsquo;re about</h2>
          <div className="values-grid">
            <div>
              <h3>GOOD FOOD.</h3>
              <p>
                An all-day menu, from savoury breakfasts to something sweet in
                the afternoon.
              </p>
            </div>
            <div>
              <h3>GOOD COFFEE.</h3>
              <p>
                St. ALi coffee, our own sticky chai and ceremonial matcha.
              </p>
            </div>
            <div>
              <h3>EVERYONE’S WELCOME.</h3>
              <p>
                Friends, families, or just you. Dogs can join you on the deck or
                in the courtyard.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CafeFaq />
    </>
  );
}
