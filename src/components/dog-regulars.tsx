import Image from "next/image";
import { Reveal } from "./reveal";

const regulars = [
  {
    name: "Henry",
    role: "HEAD OF TOASTIE SUPERVISION",
    photo: "henry",
    quote: "Came for the company. Stayed to supervise the toasties.",
    alt: "Henry the bulldog sitting on The Peacock’s deck beside a leafy plant",
  },
  {
    name: "Mango & friends",
    role: "THE BRUNCH CLUB",
    photo: "mango-friends",
    quote: "We booked a catch-up. The humans came along.",
    alt: "Mango and two friends sitting together beneath The Peacock sign",
  },
  {
    name: "Peppa",
    role: "HEAD OF PEOPLE-WATCHING",
    photo: "peppa",
    quote: "Excellent people-watching. I’ll be on the deck.",
    alt: "Peppa, a black-and-white dog, stretched out on the café deck",
  },
  {
    name: "Lochie & Hazel",
    role: "THE DOUBLE ACT",
    photo: "lochie-hazel",
    quote: "One table. Two very good reasons to stay.",
    alt: "Lochie and Hazel, two brown dogs, visiting the café together",
  },
  {
    name: "Frankie",
    role: "SMALL PUP, BIG PLANS",
    photo: "frankie",
    quote: "New to the neighbourhood. Already a regular.",
    alt: "Frankie the puppy sitting on a striped cushion next to a plant",
  },
];

export function DogRegulars() {
  return (
    <section
      className="dog-section"
      id="four-legged-regulars"
      aria-labelledby="dog-title"
    >
      <div className="container section">
        <Reveal className="dog-section-heading">
          <div>
            <p className="eyebrow">THE UNOFFICIAL PEACOCK REVIEW PANEL</p>
            <h2 id="dog-title">
              FOUR-LEGGED.
              <br />
              <span className="pink-highlight">FIVE-STAR COMPANY.</span>
            </h2>
          </div>
          <p>
            Our regulars have a lot to say.
            <br />
            If only we spoke fluent woof.
          </p>
        </Reveal>
        <div className="dog-card-grid">
          {regulars.map((dog, i) => (
            <Reveal key={dog.name} delay={i * 90}>
              <figure className={`dog-card dog-card-${i}`}>
                <div
                  className={`dog-portrait dog-photo-${dog.photo} ${dog.photo === "mango-friends" ? "dog-group-photo" : ""}`}
                >
                  <Image
                    src={`/images/dog-${dog.photo}.webp`}
                    alt={dog.alt}
                    fill
                    sizes="(max-width:650px) 88vw, (max-width:1000px) 45vw, 30vw"
                  />
                </div>
                <figcaption>
                  <p className="dog-role">{dog.role}</p>
                  <h3>{dog.name}</h3>
                  <blockquote>“{dog.quote}”</blockquote>
                  <span className="dog-signature" aria-hidden="true">
                    × paw of approval
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="dog-disclaimer">
          Real Peacock visitors. Imagined reviews. Very good dogs.
        </p>
      </div>
    </section>
  );
}
