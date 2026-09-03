"use server";

import { MailNotConfiguredError, sendEnquiry } from "@/lib/mail";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function submitEnquiry(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Bots fill every field they find; humans never see this one.
  if (formData.get("company")) return { status: "success" };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Please tell us your name.";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "Please enter a valid email address.";
  if (message.length < 5) fieldErrors.message = "Please add a little more detail.";
  if (message.length > 4000) fieldErrors.message = "Please keep it under 4000 characters.";

  if (Object.keys(fieldErrors).length) {
    return { status: "error", message: "Please check the highlighted fields.", fieldErrors };
  }

  try {
    await sendEnquiry({ name, email, message });
    return { status: "success" };
  } catch (error) {
    if (error instanceof MailNotConfiguredError) {
      return {
        status: "error",
        message:
          "Our contact form isn't connected yet. Please email us directly and we'll get straight back to you.",
      };
    }
    console.error("Contact form send failed", error);
    return {
      status: "error",
      message: "Something went wrong sending your message. Please email or call us instead.",
    };
  }
}
