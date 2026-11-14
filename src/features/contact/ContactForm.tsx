"use client";

import type { FormEvent } from "react";

type Props = {
  to: string;
  labels: {
    name: string;
    email: string;
    message: string;
    send: string;
    hint: string;
    subjectPrefix: string;
  };
};

/**
 * v1 has no backend: submit composes a real message in the visitor's mail app.
 * The markup and validation are already what a POST endpoint needs, so swapping
 * this for an API route later touches only this file.
 */
export default function ContactForm({ to, labels }: Props) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const message = String(data.get("message") ?? "").trim();

    const subject = `${labels.subjectPrefix} ${name}`;
    const body = `${message}\n\n— ${name} <${email}>`;
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`;
  };

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="ui-label">{labels.name}</span>
        <input
          className="field__control"
          type="text"
          name="name"
          autoComplete="name"
          required
        />
      </label>

      <label className="field">
        <span className="ui-label">{labels.email}</span>
        <input
          className="field__control"
          type="email"
          name="email"
          autoComplete="email"
          dir="ltr"
          required
        />
      </label>

      <label className="field">
        <span className="ui-label">{labels.message}</span>
        <textarea
          className="field__control field__control--area"
          name="message"
          rows={5}
          maxLength={2000}
          required
        />
      </label>

      <div className="contact-form__footer">
        <button type="submit" className="round-button contact-form__submit">
          {labels.send}
        </button>
        <p className="contact-form__hint">{labels.hint}</p>
      </div>
    </form>
  );
}
