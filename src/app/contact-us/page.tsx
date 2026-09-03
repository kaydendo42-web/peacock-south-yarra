import type { Metadata } from "next";
import Image from "next/image";
import { BreadcrumbSchema } from "@/components/structured-data";
import { ContactForm } from "@/components/contact-form";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Have some feedback or need to get in touch with us? Leave your comments here.",
  alternates: { canonical: "/contact-us" },
  openGraph: {
    title: "Contact Us | The Peacock South Yarra | Melbourne Brunch Cafe",
    description: "Have some feedback or need to get in touch with us? Leave your comments here.",
    url: "/contact-us",
    images: [{ url: "/images/og-contact.jpg", width: 1470, height: 700 }],
  },
};

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact-us" },
        ]}
      />

      <div className="relative aspect-[1440/500] w-full lg:aspect-[1440/340]">
        <Image
          src="/images/shopfront.jpg"
          alt="The Peacock shopfront on River Street, South Yarra"
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-12 lg:py-16">
        <h1 className="text-center font-sans text-[38px] leading-tight text-teal lg:text-[57px]">
          CONTACT US
        </h1>

        <p className="mx-auto mt-6 max-w-[384px] text-center font-ui text-[15px] leading-[1.5] text-ink-soft">
          At The Peacock South Yarra, we love feedback! We&apos;re always looking for ways to
          improve our customer&apos;s experience and would love for you to get in touch. Use the
          form below or alternatively, you can review us on{" "}
          <a
            href={site.googleReview}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:no-underline"
          >
            Google
          </a>
        </p>

        <ContactForm />

        <div className="mt-12 flex justify-center">
          <a href={site.googleReview} target="_blank" rel="noopener noreferrer">
            <Image
              src="/images/google-review.png"
              alt="Click here to leave us a review on Google"
              width={173}
              height={50}
              className="h-[50px] w-auto"
            />
          </a>
        </div>
      </div>

      <iframe
        title={`Map showing ${site.name} at ${site.street}, ${site.suburb}`}
        src={`https://www.google.com/maps?q=${site.googleMapsQuery}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-[350px] w-full border-0"
      />
    </>
  );
}
