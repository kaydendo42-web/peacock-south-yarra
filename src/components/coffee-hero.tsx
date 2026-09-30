import Image from "next/image";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Home hero. Jenny's review (30 Sep 2026): keep the headline, the menu link and
 * the pets invite; lose the sticker, the cut-out coffee art and anything else
 * that reads as generated. The picture is one of her own photos.
 */
export function CoffeeHero() {
  return (
    <section className="coffee-hero" aria-labelledby="home-title">
      <div className="container coffee-hero-inner">
        <div className="coffee-hero-copy">
          <p className="eyebrow hero-enter">{site.suburb.toUpperCase()}</p>
          <div className="coffee-headline hero-enter">
            <h1 id="home-title">
              {site.suburb}&rsquo;s
              <br />
              <span className="angled-title">Best Brunch Spot!</span>
            </h1>
          </div>
          <div className="coffee-hero-intro hero-enter">
            <Link href="/menu" className="button hero-menu-button">
              See our menu<span aria-hidden="true">↗</span>
            </Link>
          </div>
          <a className="dog-invite hero-enter" href="#four-legged-regulars">
            <span className="dog-invite-photo">
              <Image
                src="/images/dog-fluffy-friend.webp"
                alt="A fluffy four-legged visitor at The Peacock"
                fill
                sizes="64px"
              />
            </span>
            <span>
              Pets welcome!
              <small>
                Meet our regulars <span aria-hidden="true">↘</span>
              </small>
            </span>
          </a>
        </div>
        <figure className="hero-photo hero-enter">
          <Image
            src="/images/hero-1.webp"
            alt="Brunch plates on a table among the plants at The Peacock"
            fill
            sizes="(max-width:700px) 100vw, 44vw"
            priority
          />
        </figure>
      </div>
    </section>
  );
}
