import Link from "next/link";
import { hours, nav, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-invitation">
          <h2>
            MAKE YOURSELF
            <br />
            AT HOME.
          </h2>
          <Link href="/book-a-table" className="button">
            See you for brunch <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="footer-grid">
          <div>
            <p className="eyebrow">Come on over</p>
            <address>
              {site.street}
              <br />
              {site.suburb}, {site.state} {site.postcode}
            </address>
            <a
              className="text-link"
              href={`https://www.google.com/maps/search/?api=1&query=${site.googleMapsQuery}`}
              target="_blank"
              rel="noreferrer"
            >
              Get directions ↗
            </a>
          </div>
          <div>
            <p className="eyebrow">Coffee’s on</p>
            <p>
              Monday–Friday <span>{hours.weekdays.display}</span>
            </p>
            <p>
              Saturday–Sunday <span>{hours.weekend.display}</span>
            </p>
            <p>
              Public holidays <span>{hours.publicHolidays.display}</span>
            </p>
          </div>
          <div>
            <p className="eyebrow">Say hello</p>
            <a href={site.phoneHref}>{site.phone}</a>
            <a href={`mailto:${site.email}`}>{site.email}</a>
            <a href={site.instagram} target="_blank" rel="noreferrer">
              Instagram ↗
            </a>
          </div>
          <nav aria-label="Footer">
            <p className="eyebrow">Take a look</p>
            {nav.map((item) => (
              <Link href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href="/book-a-table">Book a table</Link>
          </nav>
        </div>
        <p className="footer-wordmark" aria-hidden="true">
          THE PEACOCK
        </p>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {site.name}
          </span>
          <span>
            Made with care by{" "}
            <a
              href="https://www.peregrinepartners.space"
              target="_blank"
              rel="noreferrer"
            >
              Peregrine Partners ↗
            </a>
          </span>
          <a href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
