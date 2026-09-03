import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbSchema, MenuSchema } from "@/components/structured-data";
import { TealButton } from "@/components/ui";
import {
  dietaryLegend,
  drinksMenu,
  foodMenu,
  menuFootnotes,
  menuSpecials,
  type MenuBoard,
  type MenuItem,
} from "@/lib/menu";

export const metadata: Metadata = {
  title: "Menu",
  description:
    "The full Peacock South Yarra menu — all day breakfast and brunch, burgers, kids meals, sides, St Ali coffee, ceremonial matcha, smoothies, cold pressed juice and cocktails.",
  alternates: { canonical: "/menu" },
  openGraph: {
    title: "Menu | The Peacock South Yarra",
    description:
      "All day breakfast and brunch, St Ali coffee, ceremonial matcha, smoothies and cocktails.",
    url: "/menu",
  },
};

export default function MenuPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Menu", path: "/menu" },
        ]}
      />
      <MenuSchema />

      <div className="mx-auto max-w-[1180px] px-5 py-12 lg:py-16">
        <header className="text-center">
          <h1 className="font-sans text-[32px] leading-tight text-teal lg:text-[44px]">MENU</h1>
          <p className="mx-auto mt-4 max-w-[560px] font-body text-[17px] leading-[1.47] text-ink">
            Served all day, every day. Coffee is Orthodox by St Ali and our matcha is ceremonial
            grade from Shizuoka, Japan.
          </p>
          <TealButton href="/book-a-table" className="mt-8">
            BOOK A TABLE
          </TealButton>
        </header>

        <Board board={foodMenu} />
        <Board board={drinksMenu} />

        <section aria-labelledby="specials" className="mt-16 bg-teal px-6 py-8 text-white lg:px-10">
          <h2 id="specials" className="font-display text-[24px] font-semibold uppercase lg:text-[26px]">
            Specials
          </h2>
          <ul className="mt-5 grid gap-5 sm:grid-cols-3">
            {menuSpecials.map((special) => (
              <li key={special.id}>
                <h3 className="font-ui text-[15px] font-extrabold uppercase">{special.title}</h3>
                <p className="mt-1 font-body text-[15px] leading-[1.5] text-white/90">
                  {special.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="legend" className="mt-12">
          <h2 id="legend" className="sr-only">
            Dietary codes and conditions
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-ui text-[13px] font-semibold text-teal">
            {dietaryLegend.map((entry) => (
              <li key={entry.code}>
                <span className="font-extrabold">{entry.code}</span> — {entry.meaning}
              </li>
            ))}
          </ul>
          <ul className="mt-4 space-y-1 font-body text-[14px] text-ink-soft">
            {menuFootnotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="boards" className="mt-16">
          <h2 id="boards" className="font-display text-[20px] font-semibold text-teal-bright uppercase">
            The printed boards
          </h2>
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {[
              { src: "/images/menu-food.jpg", alt: "The Peacock all day food menu board" },
              { src: "/images/menu-drinks.jpg", alt: "The Peacock drinks menu board" },
            ].map((board) => (
              <div key={board.src} className="relative aspect-[842/596] w-full">
                <Image
                  src={board.src}
                  alt={board.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function Board({ board }: { board: MenuBoard }) {
  return (
    <section aria-labelledby={board.id} className="mt-16">
      <h2
        id={board.id}
        className="border-b-2 border-teal pb-3 font-display text-[26px] font-semibold text-teal uppercase lg:text-[32px]"
      >
        {board.title}
      </h2>

      <div className="mt-8 grid gap-x-12 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
        {board.sections.map((section) => (
          <section key={section.id} aria-labelledby={`${board.id}-${section.id}`} className="break-inside-avoid">
            <h3
              id={`${board.id}-${section.id}`}
              className="font-display text-[20px] font-semibold text-teal-bright uppercase"
            >
              {section.title}
              {section.subtitle ? (
                <span className="ml-2 font-body text-[14px] font-normal normal-case text-ink-soft">
                  {section.subtitle}
                </span>
              ) : null}
            </h3>
            <ul className="mt-4 space-y-4">
              {section.items.map((item) => (
                <MenuRow key={item.name} item={item} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

function MenuRow({ item }: { item: MenuItem }) {
  return (
    <li>
      <div className="flex items-baseline gap-3">
        <h4 className="font-ui text-[14px] font-extrabold uppercase text-ink">{item.name}</h4>
        {item.price ? (
          <>
            <span aria-hidden="true" className="h-px flex-1 border-b border-dotted border-black/25" />
            <span className="font-ui text-[14px] font-extrabold text-ink">{item.price}</span>
          </>
        ) : null}
      </div>
      {item.tags?.length ? (
        <p className="mt-1 font-ui text-[12px] font-semibold tracking-wide text-teal">
          {item.tags.join(" · ")}
        </p>
      ) : null}
      {item.description ? (
        <p className="mt-1 font-body text-[15px] leading-[1.45] text-ink-soft">{item.description}</p>
      ) : null}
      {item.note ? (
        <p className="mt-1 font-body text-[13px] leading-[1.45] italic text-ink-soft/80">{item.note}</p>
      ) : null}
    </li>
  );
}
