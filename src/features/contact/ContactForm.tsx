"use client";

import { useCallback, useState, type FormEvent } from "react";

import Turnstile from "@/features/contact/Turnstile";

import Field from "@/features/ui/Field";
import StatusMessage from "@/features/ui/StatusMessage";
import { roundButton } from "@/features/ui/styles";

type FieldName = "name" | "email" | "message";

type Labels = {
  name: string;
  email: string;
  message: string;
  send: string;
  hint: string;
  subjectPrefix: string;
  requiredName: string;
  requiredEmail: string;
  invalidEmail: string;
  requiredMessage: string;
  sending: string;
  sent: string;
  ready: string;
  openMail: string;
  failed: string;
  privacy: string;
  verifyRequired: string;
};

type Props = {
  to: string;
  /**
   * Same-origin route that delivers the message. The prop exists so tests can
   * point at a mock; the shipped value is the internal route. The UI never
   * changes when the transport does.
   */
  endpoint?: string;
  labels: Labels;
};

type Values = Record<FieldName, string>;
type Errors = Partial<Record<FieldName, string>>;
type Status = "idle" | "submitting" | "success" | "error";

const IDS: Record<FieldName, string> = {
  name: "contact-name",
  email: "contact-email",
  message: "contact-message",
};

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const controlClasses =
  "w-full rounded-none border-0 border-b border-bone/30 bg-transparent px-2 py-[0.95rem] font-body text-t-20 text-bone transition-colors duration-300 focus:border-lime aria-[invalid=true]:border-lime";

const EMPTY: Values = { name: "", email: "", message: "" };

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
  const [values, setValues] = useState<Values>(EMPTY);
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [mailto, setMailto] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [verificationError, setVerificationError] = useState(false);
  const turnstileRequired = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );

  const onTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token ?? "");
    setVerificationError(false);
  }, []);

  const fieldError = (field: FieldName, value: string): string | undefined => {
    const trimmed = value.trim();

    if (field === "name") {
      return trimmed ? undefined : labels.requiredName;
    }

    if (field === "email") {
      if (!trimmed) return labels.requiredEmail;
      return EMAIL_SHAPE.test(trimmed) ? undefined : labels.invalidEmail;
    }

    return trimmed ? undefined : labels.requiredMessage;
  };

  const validate = (): Errors => {
    const next: Errors = {};

    for (const field of Object.keys(IDS) as FieldName[]) {
      const error = fieldError(field, values[field]);
      if (error) next[field] = error;
    }

    return next;
  };

  const onChange = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));

    // Editing clears the old message; it does not validate untouched fields.
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  };

  const onBlur = (field: FieldName) => {
    setErrors((current) => ({
      ...current,
      [field]: fieldError(field, values[field]),
    }));
  };

  const composeMailto = (payload: Values) => {
    const subject = `${labels.subjectPrefix} ${payload.name}`;
    const body = `${payload.message}\n\n— ${payload.name} <${payload.email}>`;
    return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const target = (form.dataset.contactEndpoint ?? endpoint).trim();

    setStatus("idle");
    setMailto(null);

    const next = validate();
    setErrors(next);

    const firstInvalid = (Object.keys(IDS) as FieldName[]).find(
      (field) => next[field],
    );
    if (firstInvalid) {
      document.getElementById(IDS[firstInvalid])?.focus();
      return;
    }

    if (turnstileRequired && !turnstileToken) {
      setVerificationError(true);
      return;
    }

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    };

    setStatus("submitting");

    try {
      const response = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          company,
          turnstileToken,
        }),
      });

      // The route has no provider key yet: keep the message and hand it to the
      // visitor's mail app rather than reporting a delivery that did not happen.
      if (response.status === 503) {
        setMailto(composeMailto(values));
        setStatus("success");
        return;
      }

      if (!response.ok) throw new Error("contact endpoint rejected the message");

      setValues(EMPTY);
      setCompany("");
      setStatus("success");
    } catch {
      // Deliberately generic: the visitor gets an action, not a status code.
      setStatus("error");
    } finally {
      if (turnstileRequired) {
        setTurnstileToken("");
        setTurnstileReset((value) => value + 1);
      }
      setVerificationError(false);
    }
  };

  const submitting = status === "submitting";

  return (
    <form
      data-contact-form
      data-contact-endpoint={endpoint}
      aria-busy={submitting || undefined}
      className="grid w-full gap-[var(--space-3)]"
      onSubmit={onSubmit}
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
            onChange={(event) => onChange("name", event.target.value)}
            onBlur={() => onBlur("name")}
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
            onChange={(event) => onChange("email", event.target.value)}
            onBlur={() => onBlur("email")}
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
            onChange={(event) => onChange("message", event.target.value)}
            onBlur={() => onBlur("message")}
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

      <div className="mt-[var(--space-3)] grid gap-[var(--space-1)]">
        <p className="m-0 max-w-[26ch] text-t-14 leading-[1.6] text-warm">
          {labels.hint}
        </p>
        <p className="m-0 max-w-[34ch] text-t-14 leading-[1.6] text-fg-subtle">
          {labels.privacy}
        </p>
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

      <div className="mt-[var(--space-7)] flex justify-end">
        <button
          type="submit"
          data-magnetic
          disabled={submitting}
          className={`${roundButton} cursor-pointer border-0 disabled:cursor-wait disabled:opacity-70`}
        >
          <span>{submitting ? labels.sending : labels.send}</span>
        </button>
      </div>
    </form>
  );
}
