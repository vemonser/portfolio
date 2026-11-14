"use client";

import { useState, type FormEvent } from "react";

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
};

type Props = {
  to: string;
  /**
   * Optional JSON endpoint. When it is set the form POSTs there; when it is
   * absent it composes a mailto: message, which is the shipped behaviour. The
   * markup is the same either way, so wiring a backend never touches the UI.
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
 * The transport is one branch: `data-contact-endpoint` (or the prop) POSTs
 * JSON, otherwise the message is handed to the visitor's mail app through a
 * composed mailto link they can click — no hidden "send" that goes nowhere.
 */
export default function ContactForm({ to, endpoint, labels }: Props) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [mailto, setMailto] = useState<string | null>(null);

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

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const target = (form.dataset.contactEndpoint ?? endpoint ?? "").trim();

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

    const payload = {
      name: values.name.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
    };

    if (!target) {
      const subject = `${labels.subjectPrefix} ${payload.name}`;
      const body = `${payload.message}\n\n— ${payload.name} <${payload.email}>`;
      setMailto(
        `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
      );
      setStatus("success");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("contact endpoint rejected the message");
      setStatus("success");
    } catch {
      // Deliberately generic: the visitor gets an action, not a status code.
      setStatus("error");
    }
  };

  const submitting = status === "submitting";

  return (
    <form
      data-contact-form
      data-contact-endpoint={endpoint}
      aria-busy={submitting || undefined}
      className="grid max-w-[40rem] gap-[var(--space-3)]"
      onSubmit={onSubmit}
      noValidate
    >
      <Field id={IDS.name} label={labels.name} error={errors.name}>
        {(control) => (
          <input
            {...control}
            className={controlClasses}
            type="text"
            name="name"
            autoComplete="name"
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

      <div className="mt-[var(--space-1)] flex flex-wrap items-center gap-[var(--space-4)]">
        <button
          type="submit"
          disabled={submitting}
          className={`${roundButton} cursor-pointer border-0 disabled:cursor-wait disabled:opacity-70`}
        >
          {submitting ? labels.sending : labels.send}
        </button>

        <p className="m-0 max-w-[26ch] text-t-14 leading-[1.6] text-warm ar:text-t-16">
          {labels.hint}
        </p>
      </div>

      <div className="min-h-0">
        {status === "success" ? (
          <StatusMessage kind="success">
            <span>{mailto ? labels.ready : labels.sent}</span>
            {mailto ? (
              <a
                href={mailto}
                className="font-label text-t-14 uppercase tracking-[var(--track)] text-lime underline underline-offset-4 ar:text-t-16 ar:normal-case ar:tracking-normal"
              >
                {labels.openMail}
              </a>
            ) : null}
          </StatusMessage>
        ) : null}

        {status === "error" ? (
          <StatusMessage kind="error">{labels.failed}</StatusMessage>
        ) : null}
      </div>
    </form>
  );
}
