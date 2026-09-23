"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

export function CoffeeHero() {
  const art = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = art.current;
    if (!node) return;
    const preference = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const progress =
          paused || preference.matches ? 0 : Math.min(scrollY / 900, 1);
        node.style.setProperty("--coffee-shift", `${progress * 48}px`);
        node.style.setProperty("--coffee-turn", `${progress * 5}deg`);
      });
    };
    update();
    addEventListener("scroll", update, { passive: true });
    preference.addEventListener("change", update);
    return () => {
      removeEventListener("scroll", update);
      preference.removeEventListener("change", update);
      cancelAnimationFrame(frame);
    };
  }, [paused]);
  return (
    <section
      className={`coffee-hero ${paused ? "motion-paused" : ""}`}
      aria-labelledby="home-title"
    >
      <div className="container coffee-hero-inner">
        <div className="coffee-hero-copy">
          <p className="eyebrow hero-enter">
            {site.suburb.toUpperCase()}
          </p>
          <div className="coffee-headline hero-enter">
            <span className="good-mood-sticker" aria-hidden="true">
              GOOD
              <br />
              MOOD FOOD
            </span>
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
        <div className="coffee-art" ref={art}>
          <Image
            src="/images/coffee-hero-v2.webp"
            alt=""
            fill
            sizes="(max-width:700px) 100vw, 62vw"
            priority
            className="coffee-art-image"
          />
        </div>
        <button
          type="button"
          className="motion-toggle"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? "▶ Enable motion" : "Ⅱ Pause motion"}
        </button>
      </div>
      <div
        className="coffee-ribbon"
        aria-label="All-day brunch, pets welcome, fresh coffee"
      >
        <div className="coffee-ribbon-track" aria-hidden="true">
          {[0, 1].map((i) => (
            <div className="coffee-ribbon-copy" key={i}>
              <span>all-day brunch</span>
              <b>✳</b>
              <span>pets welcome</span>
              <b>✳</b>
              <span>fresh coffee</span>
              <b>✳</b>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
