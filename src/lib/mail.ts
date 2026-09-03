import { site } from "@/lib/site";

export type Enquiry = { name: string; email: string; message: string };

export class MailNotConfiguredError extends Error {
  constructor() {
    super("No email provider is configured");
    this.name = "MailNotConfiguredError";
  }
}

/**
 * Delivers a contact-form enquiry to the venue inbox.
 *
 * Wix handled this internally; on our own hosting it needs a provider. The
 * adapter is env-gated so the form degrades to a mailto fallback rather than
 * silently dropping enquiries when the key is absent.
 */
export async function sendEnquiry({ name, email, message }: Enquiry): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (!apiKey || !from) throw new MailNotConfiguredError();

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [process.env.CONTACT_TO_EMAIL ?? site.email],
      reply_to: email,
      subject: `Website enquiry from ${name}`,
      text: `${message}\n\n—\n${name}\n${email}\nSent from ${site.url}/contact-us`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned ${response.status}: ${await response.text()}`);
  }
}
