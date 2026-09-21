import Image from "next/image";
import Link from "next/link";
import { hours, site } from "@/lib/site";

export function StorySection({ full = false }: { full?: boolean }) {
  return (
    <section className="container section story-section">
      <div className="story-photo">
        <Image
          src="/images/shopfront.webp"
          alt="The Peacock’s weatherboard house with plants and a front deck"
          fill
          sizes="(max-width: 700px) 100vw, 50vw"
          className="photo"
        />
        <span className="photo-sticker">
          A LITTLE
          <br />
          GREEN ESCAPE
        </span>
      </div>
      <div className="story-copy">
        <p className="eyebrow">A house. A café. Your place.</p>
        <h2>
          A LITTLE HOUSE.
          <br />A LOT OF HEART.
        </h2>
        <p>
          Tucked into a 1930s weatherboard house in {site.suburb}, we’re a café
          that feels a little like coming home. Plants in every corner.
          Something good on the stove. Room for one more.
        </p>
        <p>
          Pull up a chair for all-day brunch, a proper coffee, or the catch-up
          that turns into the whole afternoon.
        </p>
        {full ? (
          <p>
            Find a cosy spot inside, settle on the front deck, or head out to
            the rear courtyard. Four-legged friends are welcome in our outdoor
            spaces, too.
          </p>
        ) : (
          <Link href="/about" className="text-link">
            A little more about us <span aria-hidden="true">↗</span>
          </Link>
        )}
      </div>
    </section>
  );
}
export function InstagramSection() {
  const photos = [
    {
      src: "/images/instagram-coffee.webp",
      alt: "Swan latte art in a coffee at The Peacock",
      post: "reel/DdXLJUkzxiD/",
    },
    {
      src: "/images/instagram-brunch.webp",
      alt: "A freshly plated brunch from The Peacock kitchen",
      post: "p/DcU5wLhgWbD/",
    },
    {
      src: "/images/instagram-eggs.webp",
      alt: "Poached eggs and toast at The Peacock",
      post: "p/DchrzBHBYLO/",
    },
    {
      src: "/images/instagram-porridge.webp",
      alt: "Porridge with banana and berries at The Peacock",
      post: "p/Db9XMl4Bg81/",
    },
  ];
  return (
    <section className="container section instagram-section">
      <div className="section-top">
        <div>
          <p className="eyebrow">A little taste of life here</p>
          <h2>THE PEACOCK, LATELY.</h2>
        </div>
        <a
          className="text-link"
          href={site.instagram}
          target="_blank"
          rel="noreferrer"
        >
          @{site.instagramHandle} ↗
        </a>
      </div>
      <div className="instagram-grid">
        {photos.map((photo) => (
          <a
            key={photo.src}
            href={`${site.instagram}${photo.post}`}
            target="_blank"
            rel="noreferrer"
            className="instagram-photo"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 700px) 50vw, 25vw"
              className="photo"
            />
            <span aria-hidden="true">↗</span>
          </a>
        ))}
      </div>
    </section>
  );
}
export function CafeFaq() {
  const faqs = [
    {
      q: "Can I bring my dog?",
      a: "Absolutely. Dogs are welcome on our front deck and in the rear courtyard. Ask the team about our housemade peanut butter doggo biscuits.",
    },
    {
      q: "What time can I pop in?",
      a: `We’re here ${hours.weekdays.display} Monday to Friday, ${hours.weekend.display} on weekends, and ${hours.publicHolidays.display} on public holidays.`,
    },
    {
      q: "Do you have vegetarian or vegan options?",
      a: "Yes, our all-day menu includes vegetarian and vegan options. Let the team know about dietary requirements or allergies when ordering so we can help you choose.",
    },
    {
      q: "How do I book a table?",
      a: (
        <>
          Online bookings are on their way. For a table or a larger group,
          call the team on <a href={site.phoneHref}>{site.phone}</a>.
        </>
      ),
    },
  ];
  return (
    <section className="container section faq-section">
      <div>
        <p className="eyebrow">Before you pop by</p>
        <h2>
          GOOD
          <br />
          TO KNOW.
        </h2>
        <Link href="/contact-us" className="text-link">
          Anything else? Say hello ↗
        </Link>
      </div>
      <div className="faq-list">
        {faqs.map((faq) => (
          <details key={faq.q}>
            <summary>
              {faq.q}
              <span aria-hidden="true">+</span>
            </summary>
            <div className="faq-answer">{faq.a}</div>
          </details>
        ))}
      </div>
    </section>
  );
}
