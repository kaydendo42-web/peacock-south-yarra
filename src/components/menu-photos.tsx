import Image from "next/image";
import type { MenuBoard } from "@/lib/menu";
import { Reveal } from "./reveal";

const photography = [
  {
    name: "Porridge",
    image: "/images/instagram-porridge.webp",
    alt: "The Peacock’s porridge with banana and berries",
  },
  {
    name: "Benedict",
    image: "/images/instagram-eggs.webp",
    alt: "The Peacock’s Benedict with bacon, avocado and hollandaise",
  },
  {
    name: "Latte",
    image: "/images/instagram-coffee.webp",
    alt: "Swan latte art at The Peacock",
  },
];

export function MenuPhotos({ boards }: { boards: MenuBoard[] }) {
  const sections = boards.flatMap((board) => board.sections);
  const cards = photography.flatMap((photo) => {
    for (const section of sections) {
      const item = section.items.find(
        (item) =>
          (item.itemName || item.name).toLowerCase() ===
          photo.name.toLowerCase(),
      );
      if (item) return [{ ...photo, item, sectionId: section.id }];
    }
    return [];
  });
  if (!cards.length) return null;
  return (
    <>
      <div className="menu-featured">
        {cards.map((card, i) => (
          <Reveal key={card.name} delay={i * 90}>
            <a className="menu-featured-card" href={`#${card.sectionId}`}>
              <div className="menu-featured-photo">
                <Image
                  src={card.image}
                  alt={card.alt}
                  fill
                  sizes="(max-width:700px) 40vw, 33vw"
                />
              </div>
              <div className="menu-featured-caption">
                <h2>{card.name.toUpperCase()}</h2>
                <p>
                  {card.item.price ? `$${card.item.price}` : "Ask our team"}{" "}
                  <span aria-hidden="true">↘</span>
                </p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>
      <p className="menu-photo-note">
        From the Peacock photo album. Presentation and seasonal ingredients may
        vary. See the full menu below for sizes and options.
      </p>
    </>
  );
}
