"use client";

import type { FormEvent } from "react";

import { roundButton } from "@/features/ui/styles";

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

const controlClasses =
  "w-full rounded-none border-0 border-b border-bone/30 bg-transparent px-2 py-[0.95rem] font-body text-t-20 text-bone transition-colors duration-300 focus:border-lime";

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
    <form className="grid max-w-[40rem] gap-[1.6rem]" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-[0.6rem]">
        <span className="ui-label">{labels.name}</span>
        <input
          className={controlClasses}
          type="text"
          name="name"
          autoComplete="name"
          required
        />
      </label>

      <label className="flex flex-col gap-[0.6rem]">
        <span className="ui-label">{labels.email}</span>
        <input
          className={controlClasses}
          type="email"
          name="email"
          autoComplete="email"
          dir="ltr"
          required
        />
      </label>

      <label className="flex flex-col gap-[0.6rem]">
        <span className="ui-label">{labels.message}</span>
        <textarea
          className={`${controlClasses} min-h-36 resize-y`}
          name="message"
          rows={5}
          maxLength={2000}
          required
        />
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-6">
        <button
          type="submit"
          className={`${roundButton} cursor-pointer border-0`}
        >
          {labels.send}
        </button>
        <p className="m-0 max-w-[26ch] text-t-14 leading-[1.6] text-warm ar:text-t-16">
          {labels.hint}
        </p>
      </div>
    </form>
  );
}
