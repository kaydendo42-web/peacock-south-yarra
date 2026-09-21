import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbSchema } from "@/components/structured-data";
import { ContactForm } from "@/components/contact-form";
import { hours, site } from "@/lib/site";
export const metadata: Metadata = {
  title: "Find us & say hello",
  description:
    "Find The Peacock South Yarra, check opening hours, get directions or get in touch with our café team.",
  alternates: { canonical: "/contact-us" },
};
export const dynamic = "force-dynamic";
export default function ContactPage() {
  const emailReady = Boolean(
    process.env.RESEND_API_KEY && process.env.CONTACT_FROM_EMAIL,
  );
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Find us", path: "/contact-us" },
        ]}
      />
      <header className="page-masthead container">
        <p className="eyebrow">A little off the beaten track</p>
        <h1>
          FOLLOW THE
          <br />
          <span className="angled-title">SMELL OF COFFEE.</span>
        </h1>
        <p>
          You’ll find us among the plants in our little weatherboard house.
          <br />
          We’d love to see you.
        </p>
      </header>
      <section className="container visit-layout">
        <div className="visit-photo">
          <Image
            src="/images/shopfront.webp"
            alt="The Peacock café shopfront and leafy deck"
            fill
            sizes="(max-width:700px) 100vw,50vw"
            className="photo"
            priority
          />
        </div>
        <div className="visit-details">
          <h2>COME ON OVER.</h2>
          <address>
            {site.street}
            <br />
            {site.suburb}, {site.state} {site.postcode}
          </address>
          <a
            className="button"
            href={`https://www.google.com/maps/search/?api=1&query=${site.googleMapsQuery}`}
            target="_blank"
            rel="noreferrer"
          >
            Get directions <span aria-hidden="true">↗</span>
          </a>
          <p className="eyebrow">Opening hours</p>
          <dl className="hours-list">
            <dt>Monday–Friday</dt>
            <dd>{hours.weekdays.display}</dd>
            <dt>Saturday–Sunday</dt>
            <dd>{hours.weekend.display}</dd>
            <dt>Public holidays</dt>
            <dd>{hours.publicHolidays.display}</dd>
          </dl>
          <p className="eyebrow">Say hello</p>
          <p>
            <a href={site.phoneHref}>{site.phone}</a>
            <br />
            <a href={`mailto:${site.email}`}>{site.email}</a>
          </p>
          <p className="eyebrow">Bring your four-legged friend</p>
          <p>Our front deck and rear courtyard are dog-friendly.</p>
        </div>
      </section>
      <section className="contact-panel">
        <div className="contact-inner">
          <h2>DROP US A LINE.</h2>
          <p>
            A question, a bigger gathering, or a little feedback? We’d love to
            hear from you.
          </p>
          {emailReady ? (
            <ContactForm />
          ) : (
            <a className="button" href={`mailto:${site.email}`}>
              Email the team <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </section>
      <iframe
        title={`Map showing ${site.name} at ${site.street}, ${site.suburb}`}
        src={`https://www.google.com/maps?q=${site.googleMapsQuery}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="map-frame"
      />
    </>
  );
}
