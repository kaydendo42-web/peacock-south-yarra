import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/structured-data";
import { DinnerOrder } from "@/dinners/DinnerOrder";
import { dietLabels, dinners, money } from "@/dinners/menu";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "$5 dinners",
  description: `Cooked dinners from $5, made in house at ${site.shortName}. Order and pay online by 9pm, collect the next day.`,
  alternates: { canonical: "/dinners" },
};

const days = [
  ["mon", "Monday"],
  ["tue", "Tuesday"],
  ["wed", "Wednesday"],
  ["thu", "Thursday"],
  ["fri", "Friday"],
] as const;

export default function DinnersPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "$5 dinners", path: "/dinners" },
        ]}
      />
      <header className="page-masthead container">
        <p className="eyebrow">Monday to Friday · order by 9pm the night before</p>
        <h1>
          $5
          <br />
          <span className="angled-title">dinners</span>
        </h1>
        <p>
          Made in house, fully cooked, ready to reheat. Order and pay here by
          9pm, then collect from the café the next day between{" "}
          {dinners.pickup.label}. {dinners.portionsPerDish} of each dish a day,
          so once they’re gone, they’re gone.
        </p>
      </header>

      <section className="container dinners-order" aria-labelledby="order-heading">
        <h2 id="order-heading" className="sr-only">
          Order dinners
        </h2>
        <DinnerOrder />
      </section>

      <section className="container dinners-rotation" aria-labelledby="rotation-heading">
        <h2 id="rotation-heading">The two-week menu</h2>
        <p className="dinners-key">
          {Object.entries(dietLabels).map(([k, v]) => (
            <span key={k}>
              <abbr title={v}>{k}</abbr> {v.toLowerCase()}
            </span>
          ))}
        </p>
        <div className="dinners-weeks">
          {dinners.weeks.map((week, i) => (
            <div key={i}>
              <h3 className="eyebrow">Week {i + 1}</h3>
              <dl>
                {days.map(([key, label]) => (
                  <div key={key}>
                    <dt>{label}</dt>
                    {week[key].map((d) => (
                      <dd key={d.id}>
                        <span className="dinners-price">{money(d.priceCents)}</span> {d.name}
                        {d.diet.length ? (
                          <span className="dinners-diet"> ({d.diet.join(" & ")})</span>
                        ) : null}
                      </dd>
                    ))}
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="dinners-fine">
          Orders for each day close at 9pm the night before and can be placed
          up to two weeks ahead. Dinners can sell out before the cut-off.
          Questions or allergies? Call us on{" "}
          <a href={site.phoneHref}>{site.phone}</a>.
        </p>
      </section>
    </>
  );
}
