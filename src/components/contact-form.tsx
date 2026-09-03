"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { submitEnquiry, type ContactState } from "@/app/contact-us/actions";
import { site } from "@/lib/site";

const initial: ContactState = { status: "idle" };

/**
 * Underline-only fields with teal placeholders, matching the Wix form —
 * with real labels, validation and error messaging added.
 */
export function ContactForm() {
  const [state, formAction] = useActionState(submitEnquiry, initial);

  if (state.status === "success") {
    return (
      <p
        role="status"
        className="mx-auto mt-10 max-w-[384px] bg-teal px-6 py-5 text-center font-ui text-[15px] text-white"
      >
        Thanks for getting in touch — we&apos;ll come back to you shortly.
      </p>
    );
  }

  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="mx-auto mt-10 w-full max-w-[384px]">
      <p aria-hidden="true" className="absolute -left-[9999px]">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </p>

      <Field id="name" label="Name" autoComplete="name" error={errors.name} />
      <Field id="email" label="Email" type="email" autoComplete="email" error={errors.email} />
      <Field id="message" label="Your Message" multiline error={errors.message} />

      {state.status === "error" && !state.fieldErrors ? (
        <p role="alert" className="mt-4 font-ui text-[14px] text-ink-soft">
          {state.message}{" "}
          <a href={`mailto:${site.email}`} className="text-teal underline underline-offset-2">
            {site.email}
          </a>
        </p>
      ) : null}

      <div className="mt-8 flex justify-center">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 min-w-[97px] items-center justify-center bg-teal px-6 font-button text-[15px] leading-[21px] text-white transition-colors hover:bg-teal-dark disabled:opacity-60"
    >
      {pending ? "Sending…" : "Submit"}
    </button>
  );
}

function Field({
  id,
  label,
  type = "text",
  multiline = false,
  autoComplete,
  error,
}: {
  id: string;
  label: string;
  type?: string;
  multiline?: boolean;
  autoComplete?: string;
  error?: string;
}) {
  const shared =
    "w-full border-0 border-b border-teal bg-transparent py-2 font-ui text-[15px] text-ink placeholder:text-teal focus:border-teal focus:outline-none";

  return (
    <div className="mt-6 first:mt-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          name={id}
          rows={3}
          placeholder={label}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${shared} resize-y`}
        />
      ) : (
        <input
          id={id}
          name={id}
          type={type}
          placeholder={label}
          autoComplete={autoComplete}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={shared}
        />
      )}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1 font-ui text-[13px] text-ink-soft">
          {error}
        </p>
      ) : null}
    </div>
  );
}
