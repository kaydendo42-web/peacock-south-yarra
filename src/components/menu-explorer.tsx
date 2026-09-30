"use client";
import { useState } from "react";
import Image from "next/image";
import type { MenuBoard } from "@/lib/menu";
import { groupMenuItems } from "@/lib/menu-display";

export function MenuExplorer({
  boards,
  initialView = "food",
}: {
  boards: MenuBoard[];
  initialView?: string;
}) {
  const [view, setView] = useState(
    initialView === "drinks" ? "drinks" : "food",
  );
  const sections = boards
    .filter((b) => (view === "drinks" ? b.id === "drinks" : b.id !== "drinks"))
    .flatMap((b) => b.sections);
  return (
    <>
      <div className="menu-toolbar">
        <div className="menu-tabs" aria-label="Choose menu">
          {[
            ["food", "Food"],
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
      </div>
      <div className="menu-body">
        <div>
          {sections.map((s) => (
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
            ))}
        </div>
      </div>
    </>
  );
}
