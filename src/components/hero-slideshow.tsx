"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type Slide = { src: string; alt: string };

const ADVANCE_MS = 5000;

/**
 * Full-bleed crossfading slideshow, matching the 1440×541 band on the source
 * site: chevrons at the vertical centre, dot pagination bottom-centre.
 * Auto-advance pauses on hover/focus and is disabled under reduced motion.
 */
export function HeroSlideshow({ slides, priority = true }: { slides: Slide[]; priority?: boolean }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  const go = useCallback(
    (delta: number) => setIndex((i) => (i + delta + slides.length) % slides.length),
    [slides.length],
  );

  useEffect(() => {
    if (paused || reduced.current || slides.length < 2) return;
    const id = setInterval(() => go(1), ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, go, slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="The Peacock South Yarra"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      className="relative aspect-[390/500] w-full overflow-hidden bg-black sm:aspect-[1440/541]"
    >
      {slides.map((slide, i) => (
        <div
          key={slide.src}
          aria-hidden={i !== index}
          className={`absolute inset-0 transition-opacity duration-700 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={i === index ? slide.alt : ""}
            fill
            sizes="100vw"
            priority={priority && i === 0}
            className="object-cover"
          />
        </div>
      ))}

      <SlideArrow direction="prev" onClick={() => go(-1)} />
      <SlideArrow direction="next" onClick={() => go(1)} />

      <div className="absolute inset-x-0 bottom-5 flex justify-center gap-[9px]">
        {slides.map((slide, i) => (
          <button
            key={slide.src}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1} of ${slides.length}`}
            aria-current={i === index}
            className={`h-[7px] w-[7px] rounded-full border border-white transition-colors ${
              i === index ? "bg-white" : "bg-transparent"
            }`}
          />
        ))}
      </div>
    </section>
  );
}

function SlideArrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const isNext = direction === "next";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isNext ? "Next slide" : "Previous slide"}
      className={`absolute top-1/2 z-10 flex h-14 w-14 -translate-y-1/2 items-center justify-center text-white transition-opacity hover:opacity-70 ${
        isNext ? "right-2 sm:right-6" : "left-2 sm:left-6"
      }`}
    >
      <svg viewBox="0 0 24 44" aria-hidden="true" className="h-11 w-6" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d={isNext ? "M2 2l20 20L2 42" : "M22 2L2 22l20 20"} />
      </svg>
    </button>
  );
}
