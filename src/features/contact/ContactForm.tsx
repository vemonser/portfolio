"use client";

import useContactForm from "@/features/contact/use-contact-form";
import { CONTACT_IDS as IDS } from "@/features/contact/contact-types";
import type { ContactLabels } from "@/features/contact/contact-types";

import Turnstile from "@/features/contact/Turnstile";

import Field from "@/features/ui/Field";
import StatusMessage from "@/features/ui/StatusMessage";
import { roundButton } from "@/features/ui/styles";

type Props = {
  to: string;
  /**
   * Same-origin route that delivers the message. The prop exists so tests can
   * point at a mock; the shipped value is the internal route. The UI never
   * changes when the transport does.
   */
  endpoint?: string;
  labels: ContactLabels;
};

const controlClasses =
  "w-full rounded-none border-0 border-b border-bone/30 bg-transparent px-2 py-[0.95rem] font-body text-t-20 text-bone transition-colors duration-300 focus:border-lime aria-[invalid=true]:border-lime";

/**
 * Contact form. Values are controlled, so an invalid submission keeps every
 * field exactly as typed. Validation runs on blur and on submit, never on each
 * keystroke; an existing error clears as soon as the field is edited.
 *
 * The transport is the internal `/api/contact` route. If the provider is not
 * configured the route answers 503 and the form composes a mailto instead, so
 * "Send" always has a real destination. A hidden honeypot travels with the
 * payload.
 */
export default function ContactForm({
  to,
  endpoint = "/api/contact",
  labels,
}: Props) {
  const {
    values,
    errors,
    status,
    mailto,
    company,
    setCompany,
    turnstileToken,
    turnstileReset,
    verificationError,
    submitting,
    onTurnstile,
    changeField,
    blurField,
    submit,
  } = useContactForm({ to, endpoint, labels });

  return (
    <form
      data-contact-form
      data-contact-endpoint={endpoint}
      aria-busy={submitting || undefined}
      className="grid w-full gap-[var(--space-3)]"
      onSubmit={submit}
      noValidate
    >
      {/*
        Honeypot: off-screen, not focusable, not announced. A person never fills
        it; a form-filling bot usually does, and the route then discards the
        submission while answering as if it succeeded.
      */}
      <div
        inert
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="contact-company">Company</label>
        <input
          id="contact-company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={company}
          onChange={(event) => setCompany(event.target.value)}
        />
      </div>

      <Field id={IDS.name} label={labels.name} error={errors.name}>
        {(control) => (
          <input
            {...control}
            className={controlClasses}
            type="text"
            name="name"
            autoComplete="name"
            maxLength={100}
            value={values.name}
            onChange={(event) => changeField("name", event.target.value)}
            onBlur={() => blurField("name")}
          />
        )}
      </Field>

      <Field id={IDS.email} label={labels.email} error={errors.email}>
        {(control) => (
          <input
            {...control}
            className={controlClasses}
            type="email"
            name="email"
            autoComplete="email"
            spellCheck={false}
            maxLength={200}
            dir="ltr"
            value={values.email}
            onChange={(event) => changeField("email", event.target.value)}
            onBlur={() => blurField("email")}
          />
        )}
      </Field>

      <Field id={IDS.message} label={labels.message} error={errors.message}>
        {(control) => (
          <textarea
            {...control}
            className={`${controlClasses} min-h-36 resize-y`}
            name="message"
            rows={5}
            maxLength={2000}
            value={values.message}
            onChange={(event) => changeField("message", event.target.value)}
            onBlur={() => blurField("message")}
          />
        )}
      </Field>

      <input
        type="hidden"
        name="turnstileToken"
        value={turnstileToken}
        readOnly
      />
      <Turnstile key={turnstileReset} onToken={onTurnstile} />
      {verificationError ? (
        <p
          id="contact-turnstile-error"
          role="alert"
          className="m-0 text-t-14 leading-[1.6] text-lime"
        >
          {labels.verifyRequired}
        </p>
      ) : null}

      <div className="mt-(--space-3)   gap-(--space-2) flex flex-col sm:flex-row items-start justify-between">
        <div className="">

        <p className="m-0  text-t-14 leading-[1.6] text-warm">
          {labels.hint}
        </p>
        <p className="m-0  text-t-14 leading-[1.6] text-fg-subtle">
          {labels.privacy}
        </p>
        </div>
        <div className="w-full sm:w-max justify-end flex">
        <button
          type="submit"
          data-magnetic
          disabled={submitting}
          className={`${roundButton} cursor-pointer border-0 disabled:cursor-wait disabled:opacity-70`}
        >
          <span>{submitting ? labels.sending : labels.send}</span>
        </button>
        </div>
      </div>
    <div className=" flex justify-end">
      </div>
      <div
        data-form-status-live
        aria-live="polite"
        aria-atomic="true"
        className="min-h-0"
      >
        {status === "success" ? (
          <StatusMessage kind="success">
            <span>{mailto ? labels.ready : labels.sent}</span>
            {mailto ? (
              <a
                href={mailto}
                className="font-label text-t-14 uppercase tracking-[var(--track)] text-lime underline underline-offset-4"
              >
                {labels.openMail}
              </a>
            ) : null}
          </StatusMessage>
        ) : null}
      </div>

      <div
        data-form-error-live
        aria-live="assertive"
        aria-atomic="true"
        className="min-h-0"
      >
        {status === "error" ? (
          <StatusMessage kind="error">{labels.failed}</StatusMessage>
        ) : null}
      </div>

  
    </form>
  );
}
