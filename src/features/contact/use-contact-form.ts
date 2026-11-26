"use client";

import { useCallback, useState, type FormEvent } from "react";

import {
  CONTACT_IDS,
  EMPTY_CONTACT_VALUES,
  type ContactErrors,
  type ContactLabels,
  type ContactStatus,
  type ContactValues,
  type FieldName,
} from "./contact-types";
import {
  firstInvalidContactField,
  validateContactField,
  validateContactValues,
} from "./contact-validation";

type Params = {
  to: string;
  endpoint?: string;
  labels: ContactLabels;
};

const DEFAULT_ENDPOINT = "/api/contact";

const turnstileRequired = Boolean(
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
);

function composeMailto(
  to: string,
  labels: ContactLabels,
  payload: ContactValues,
): string {
  const subject = `${labels.subjectPrefix} ${payload.name}`;
  const body = `${payload.message}\n\n— ${payload.name} <${payload.email}>`;
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function useContactForm({ to, endpoint, labels }: Params) {
  const [values, setValues] = useState<ContactValues>({
    ...EMPTY_CONTACT_VALUES,
  });
  const [company, setCompany] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<ContactStatus>("idle");
  const [mailto, setMailto] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReset, setTurnstileReset] = useState(0);
  const [verificationError, setVerificationError] = useState(false);

  const resolvedEndpoint = (endpoint ?? DEFAULT_ENDPOINT).trim();

  const onTurnstile = useCallback((token: string | null) => {
    setTurnstileToken(token ?? "");
    setVerificationError(false);
  }, []);

  const changeField = useCallback((field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) =>
      current[field] ? { ...current, [field]: undefined } : current,
    );
  }, []);

  const blurField = useCallback((field: FieldName) => {
    setErrors((current) => ({
      ...current,
      [field]: validateContactField(field, values[field], labels),
    }));
  }, [values, labels]);

  const submit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const form = event.currentTarget;
      const target = (form?.dataset?.contactEndpoint ?? resolvedEndpoint).trim();

      setStatus("idle");
      setMailto(null);

      const next = validateContactValues(values, labels);
      setErrors(next);

      const firstInvalid = firstInvalidContactField(next);
      if (firstInvalid) {
        document.getElementById(CONTACT_IDS[firstInvalid])?.focus();
        return;
      }

      if (turnstileRequired && !turnstileToken) {
        setVerificationError(true);
        return;
      }

      const payload: ContactValues = {
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

        if (response.status === 503) {
          setMailto(composeMailto(to, labels, values));
          setStatus("success");
          return;
        }

        if (!response.ok) throw new Error("contact endpoint rejected the message");

        setValues({ ...EMPTY_CONTACT_VALUES });
        setCompany("");
        setStatus("success");
      } catch {
        setStatus("error");
      } finally {
        if (turnstileRequired) {
          setTurnstileToken("");
          setTurnstileReset((value) => value + 1);
        }
        setVerificationError(false);
      }
    },
    [values, labels, company, turnstileToken, to, resolvedEndpoint],
  );

  const submitting = status === "submitting";

  return {
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
  };
}

export default useContactForm;