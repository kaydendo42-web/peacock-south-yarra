"use client";
import { useState } from "react";
import Image from "next/image";
import type { MenuBoard } from "@/lib/menu";
import { groupMenuItems } from "@/lib/menu-display";

export function MenuExplorer({
  boards,
  initialView = "all",
}: {
  boards: MenuBoard[];
  initialView?: string;
}) {
  const [view, setView] = useState(
    ["food", "drinks"].includes(initialView) ? initialView : "all",
  );
  const [query, setQuery] = useState("");
  const selected = boards.filter(
    (b) =>
      view === "all" ||
      (view === "drinks" ? b.id === "drinks" : b.id !== "drinks"),
  );
  const sections = selected
    .flatMap((b) => b.sections)
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        `${item.name} ${item.description || ""} ${section.title}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    }))
    .filter((section) => section.items.length);
  return (
    <>
      <div className="menu-toolbar">
        <div className="menu-tabs" aria-label="Choose menu">
          {[
            ["all", "Everything"],
            ["food", "All-day food"],
            ["drinks", "Drinks"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <label>
          <span className="sr-only">Search the menu</span>
          <input
            className="menu-search"
            type="search"
            placeholder="Find your favourite…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <p className="sr-only" aria-live="polite">
        {sections.reduce((total, s) => total + s.items.length, 0)} menu items
        shown
      </p>
      <div className="menu-body">
        <nav className="menu-category-nav" aria-label="Menu categories">
          {sections.map((s) => (
            <a href={`#${s.id}`} key={s.id}>
              {s.title}
            </a>
          ))}
        </nav>
        <div>
          {sections.length ? (
            sections.map((s) => (
              <section className="menu-category" key={s.id} id={s.id}>
                <h2>{s.title.toUpperCase()}</h2>
                {s.subtitle && (
                  <p className="menu-category-subtitle">{s.subtitle}</p>
                )}
                <ul className="menu-items">
                  {groupMenuItems(s.items).map((item, i) => (
                    <li className="menu-item" key={`${item.name}-${i}`}>
                      {item.image && (
                        <div className="menu-catalog-photo">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            sizes="(max-width:700px) 90vw, 35vw"
                          />
                        </div>
                      )}
                      <div className="menu-item-heading">
                        <h3>{item.name}</h3>
                        {item.variations.length === 1 &&
                          item.variations[0].price && (
                            <span className="menu-item-price">
                              {item.variations[0].price.startsWith("+")
                                ? `+$${item.variations[0].price.slice(1)}`
                                : `$${item.variations[0].price}`}
                            </span>
                          )}
                      </div>
                      {item.variations[0].tags?.length ? (
                        <p className="menu-tags">
                          {item.variations[0].tags.join(" · ")}
                        </p>
                      ) : null}
                      {item.description && <p>{item.description}</p>}
                      {item.variations.length > 1 ? (
                        <dl className="menu-item-variants">
                          {item.variations.map((variation, j) => (
                            <div key={j}>
                              <dt>{variation.variationName || "Regular"}</dt>
                              <dd
                                className={!variation.price ? "ask-price" : ""}
                              >
                                {variation.price
                                  ? `$${variation.price}`
                                  : variation.note}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <>
                          {item.variations[0].variationName &&
                            !/^(regular|default|standard)$/i.test(
                              item.variations[0].variationName,
                            ) && (
                              <p className="menu-note">
                                {item.variations[0].variationName}
                              </p>
                            )}
                          {item.variations[0].note && (
                            <p className="menu-note">
                              {item.variations[0].note}
                            </p>
                          )}
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          ) : (
            <div className="empty-menu">
              <h2>NOTHING HERE JUST YET.</h2>
              <p>Try a different search or browse the full menu.</p>
              <button
                className="button"
                type="button"
                onClick={() => {
                  setQuery("");
                  setView("all");
                }}
              >
                Show everything <span aria-hidden="true">↗</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
