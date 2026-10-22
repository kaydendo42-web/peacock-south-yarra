import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/structured-data";
import { DinnerOrder } from "@/dinners/DinnerOrder";
import { dietLabels, dinners, money, pickupLabel } from "@/dinners/menu";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "$5 dinners",
  description: `This November, cooked dinners from $5, made in house at ${site.shortName}. Order and pay online by 9pm, collect the next day.`,
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
        <p className="eyebrow">This November · What the five?!</p>
        <h1>
          $5<span className="dinners-star">*</span>
          <br />
          <span className="angled-title">dinners</span>
        </h1>
        <p>
          Yes, really. Real dinners, real value, just five bucks. Made in
          house, fully cooked, ready to reheat. Order and pay here by 9pm, then
          collect from the café the next day between {dinners.pickup.label}.
          Limited numbers, so once they’re gone, they’re gone.
          <span className="dinners-star-note">
            *A $5 and a $10 dinner every weekday. A limited-time takeaway
            pop-up, Monday to Friday until{" "}
            {pickupLabel(dinners.lastDay ?? dinners.firstMonday)}.
          </span>
        </p>
      </header>

      <section className="container dinners-order" aria-labelledby="order-heading">
        <h2 id="order-heading" className="sr-only">
          Order dinners
        </h2>
        <DinnerOrder />
      </section>

      <section className="container dinners-rotation" aria-labelledby="rotation-heading">
        <h2 id="rotation-heading">The November menu</h2>
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
          {dinners.closed.length
            ? ` No dinners on ${dinners.closed.map(pickupLabel).join(" or ")}.`
            : null}{" "}
          Need to cancel? Use the link in your receipt up to{" "}
          {dinners.cancelHours} hours before pickup for a full refund.
          Questions or allergies? Call us on{" "}
          <a href={site.phoneHref}>{site.phone}</a>.
        </p>
      </section>
    </>
  );
}
