import type { Metadata } from "next";
import Link from "next/link";
import { PolicyPage } from "@/components/policy-page";
import { policyUpdated } from "@/lib/policies";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: `How ${site.name} collects, uses and looks after your personal information.`,
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <PolicyPage
      title="Privacy policy"
      path="/privacy-policy"
      updated={policyUpdated.privacy}
    >
      <p>
        {site.name}, {site.street}, {site.suburb} {site.state} {site.postcode}{" "}
        (“we”, “us”) is responsible for the personal information you give us
        through this website. This policy explains what we collect, why, and
        what you can ask us to do with it.
      </p>

      <h2>What we collect</h2>
      <p>
        <strong>When you book a table:</strong> your name, phone number and
        email address; the date, time, group size and table you choose; and
        anything you add in the notes, such as allergies or a request for a
        high chair.
      </p>
      <p>
        <strong>When you send us a message:</strong> your name, email address
        and what you write.
      </p>
      <p>
        <strong>When you visit the site:</strong> our hosting provider keeps
        short-lived technical logs, such as your IP address, browser and the
        pages you requested, to keep the site running and secure.
      </p>
      <p>
        Allergy and dietary notes can say something about your health. We only
        use them to prepare your visit, and you don’t have to give them to book.
      </p>

      <h2>How we use it</h2>
      <ul>
        <li>to take, manage and confirm your booking, and contact you about it</li>
        <li>to reply to your messages</li>
        <li>to keep the website working and protect it from misuse</li>
      </ul>
      <p>
        We don’t sell your information, and we don’t use it for marketing
        unless you ask us to.
      </p>

      <h2>Who handles it for us</h2>
      <p>
        A small number of service providers store or process your information
        on our behalf, and only to provide their service to us:
      </p>
      <ul>
        <li>
          Peregrine Partners, who build and run our website and booking system
        </li>
        <li>Supabase, which stores bookings in Sydney, Australia</li>
        <li>Vercel, which hosts this website</li>
        <li>our email provider, which sends booking emails and enquiries</li>
      </ul>
      <p>
        Some of these providers are based overseas, including in the United
        States, and may process information there.
      </p>

      <h2>Cookies</h2>
      <p>
        We don’t use advertising or analytics cookies, and booking a table
        doesn’t set any. The map on our <Link href="/contact-us">Find us</Link>{" "}
        page is provided by Google, which may set its own cookies under{" "}
        <a
          href="https://policies.google.com/privacy"
          target="_blank"
          rel="noreferrer"
        >
          Google’s privacy policy ↗︎
        </a>
        .
      </p>

      <h2>How long we keep it</h2>
      <p>
        We keep your information only for as long as we need it to look after
        your booking or enquiry and to keep basic business records. After that
        we delete it.
      </p>

      <h2>Bookings made through Resos</h2>
      <p>
        Bookings made before we launched this system were taken through Resos,
        and any still to come have been moved into our own. How Resos handled your
        data is set out in the{" "}
        <a
          href="https://resos.com/privacy-policy"
          target="_blank"
          rel="noreferrer"
        >
          Resos privacy policy ↗︎
        </a>
        .
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see the personal information we hold about you, ask us
        to correct it, or ask us to delete it. Email{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> and we’ll respond
        within 30 days.
      </p>
      <p>
        If you’re unhappy with how we’ve handled your information, tell us
        first and we’ll try to put it right. You can also contact the{" "}
        <a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer">
          Office of the Australian Information Commissioner ↗︎
        </a>
        .
      </p>

      <h2>Changes</h2>
      <p>
        We’ll update this page if anything changes and show the date at the
        top. Read our <Link href="/booking-policy">booking policy</Link> for
        how table bookings work.
      </p>
    </PolicyPage>
  );
}
