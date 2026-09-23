import Image from "next/image";
import { Reveal } from "./reveal";

const regulars = [
  {
    name: "Henry",
    photo: "henry",
    alt: "Henry the bulldog sitting on The Peacock’s deck beside a leafy plant",
  },
  {
    name: "Mango & friends",
    photo: "mango-friends",
    alt: "Mango and two friends sitting together beneath The Peacock sign",
  },
  {
    name: "Peppa",
    photo: "peppa",
    alt: "Peppa, a black-and-white dog, stretched out on the café deck",
  },
  {
    name: "Lochie & Hazel",
    photo: "lochie-hazel",
    alt: "Lochie and Hazel, two brown dogs, visiting the café together",
  },
  {
    name: "Frankie",
    photo: "frankie",
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
            <h2 id="dog-title">
              meet some of our
              <br />
              <span className="pink-highlight">regulars!</span>
            </h2>
          </div>
          <p>
            you may see them
            <br />
            on your visit...
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
                  <h3>{dog.name}</h3>
                  <span className="dog-signature" aria-hidden="true">
                    × paw of approval
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
