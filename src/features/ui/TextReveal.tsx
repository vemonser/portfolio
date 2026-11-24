"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { setupTextReveal, type TextSplit } from "@/features/motion/text-reveal";

type Props = {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Lines for prose, words for display type. Chosen by tag by default. */
  split?: TextSplit;
  /** Stagger between units, in milliseconds. */
  stagger?: number;
  /** Optional native title, used by clamped captions. */
  title?: string;
  as?: "p" | "h1" | "h2" | "h3" | "h4" | "span" | "div" | "li";
};

const WORD_TAGS = new Set(["h1", "h2", "h3"]);

/**
 * Reveals its text from below a mask the first time it reaches the viewport.
 *
 * The element is hidden by CSS until the split is ready (`.text-reveal`), so a
 * slow hydration never paints an unsplit block that then jumps. The gate in
 * `reveal-gate` keeps every reveal parked under the loader and the route
 * curtain, and adds the empty beat before the rise.
 */
export default function TextReveal({
  children,
  className,
  id,
  split,
  stagger,
  title,
  as: Tag = "p",
}: Props) {
  const ref = useRef<HTMLElement>(null);

  // Only string/number children can change the split. Element children keep
  // their own identity, so depending on them would re-split on every render.
  const contentKey =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : null;

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const kind = split ?? (WORD_TAGS.has(Tag) ? "words" : "lines");
    return setupTextReveal(node, { split: kind, stagger });
  }, [contentKey, split, stagger, Tag]);

  return (
    <Tag
      ref={ref as never}
      id={id}
      title={title}
      className={className ? `text-reveal ${className}` : "text-reveal"}
    >
      {children}
    </Tag>
  );
}
