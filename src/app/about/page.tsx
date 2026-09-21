import type { Metadata } from "next";
import { CafeFaq } from "@/components/cafe-sections";
import { CoffeeDrawing } from "@/components/cafe-art";
import { BreadcrumbSchema } from "@/components/structured-data";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/reveal";
import { site } from "@/lib/site";
export const metadata: Metadata = {
  title: "Our place",
  description:
    "Meet the little weatherboard house behind The Peacock: plants, all-day brunch, coffee and a dog-friendly courtyard.",
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
          <p className="eyebrow">Come on in. Stay a little.</p>
          <h1>
            A LITTLE
            <br />
            HOUSE.
            <br />
            <span>
              A LOT OF
              <br />
              HEART.
            </span>
          </h1>
          <p className="place-lead">
            Plants overhead.
            <br />
            Coffee on the table.
            <br />
            Nowhere else you need to be.
          </p>
          <Link className="text-link" href="/menu">
            Find something you love <span aria-hidden="true">↗</span>
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
          <figcaption>YOUR WINDOW SEAT IS WAITING.</figcaption>
          <span className="place-photo-stamp" aria-hidden="true">
            MAKE
            <br />
            YOURSELF
            <br />
            AT HOME
          </span>
        </figure>
      </section>
      <Reveal className="container place-story">
        <p className="eyebrow">A house. A café. Your place.</p>
        <div>
          <h2>
            A LITTLE GREEN ESCAPE
            <br />
            IN {site.suburb.toUpperCase()}.
          </h2>
          <div className="place-story-columns">
            <p>
              Tucked into a 1930s weatherboard house, The Peacock is made for
              the everyday catch-ups. A coffee before work. A long brunch with
              friends. A quiet corner and a second cup.
            </p>
            <p>
              Settle in under the hanging plants, take a seat on the front deck,
              or find your spot in the rear courtyard. There’s room for one
              more—and your four-legged friend is welcome in our outdoor spaces.
            </p>
          </div>
        </div>
      </Reveal>
      <section className="values-section">
        <div className="container section">
          <CoffeeDrawing className="values-coffee" />
          <p className="eyebrow">The things we love</p>
          <h2>
            THE EVERYDAY,
            <br />A LITTLE BRIGHTER.
          </h2>
          <div className="values-grid">
            <div>
              <h3>GOOD THINGS ON A PLATE.</h3>
              <p>
                From a savoury breakfast to a sweet afternoon treat, our all-day
                menu leaves plenty of room to find your favourite.
              </p>
            </div>
            <div>
              <h3>A PROPER CUP.</h3>
              <p>
                St. ALi coffee, housemade sticky chai and ceremonial matcha.
                Something for the daily ritual, and something for a change.
              </p>
            </div>
            <div>
              <h3>EVERYONE’S WELCOME.</h3>
              <p>
                Friends, families, a quiet moment on your own. And yes, your dog
                can join you on the deck or in the courtyard.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CafeFaq />
    </>
  );
}
