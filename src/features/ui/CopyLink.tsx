"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { setupTextReveal } from "@/features/motion/text-reveal";

import { ArrowUpRight } from "./Arrow";

type Props = {
  /** The mailto: or tel: URL — also what gets copied. */
  href: string;
  /** The visible text (email address or phone number). */
  children: string;
  className?: string;
  /** Reveal the text through the shared mask, without wrapping the link. */
  reveal?: boolean;
};

/**
 * A contact link that copies itself to the clipboard on click, with a brief
 * "Copied" label swap. The mailto:/tel: navigation is suppressed — one click
 * copies, and the visitor can paste or open their mail client themselves.
 */
export default function CopyLink({
  href,
  children,
  className,
  reveal = false,
}: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // The split happens on the text span, never on the link: replacing the
  // anchor's subtree mid-action would detach the element under the pointer.
  useEffect(() => {
    const node = textRef.current;
    if (!node || !reveal) return;
    return setupTextReveal(node, { split: "words" });
  }, [children, reveal]);

  const handleClick = useCallback(
    async (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      try {
        await navigator.clipboard.writeText(children);
        setCopied(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
      } catch {
        // Clipboard unavailable (insecure context, permissions): fall back
        // to the normal mailto:/tel: navigation.
        window.location.href = href;
      }
    },
    [children, href],
  );

  return (
    <a
      href={href}
      onClick={handleClick}
      className={className}
      data-cursor="hello"
      aria-label={copied ? "Copied to clipboard" : `Copy ${children}`}
    >
      <span
        ref={textRef}
        className="copy-link__text"
        data-copied={copied ? "true" : "false"}
      >
        {children}
      </span>
      {copied ? (
        <span className="copy-link__check" aria-hidden="true">
          <ArrowUpRight />
        </span>
      ) : null}
    </a>
  );
}