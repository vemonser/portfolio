"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

import { setupTextReveal } from "@/features/motion/text-reveal";

type Props = {
  children: ReactNode;
  className?: string;
};

/** Blocks that carry their own text and can be split on their own. */
const TEXT_BLOCKS =
  "p, h1, h2, h3, h4, h5, h6, blockquote, li, dt, dd";
/** Blocks that never carry text directly, only nested blocks. */
const CONTAINERS =
  "ul, ol, div, section, article, figure, table, thead, tbody, tr, td, th, dl, main, body";

/**
 * Collects the leaf text blocks of a prose tree. A list that holds paragraphs
 * reveals its paragraphs, not the <li> that wraps them; a list of plain items
 * reveals each item. Nesting is followed to the deepest block, so no element is
 * split twice. A block that mixes its own text with a nested list is left to
 * its nested blocks: splitting across a nested <ul> would break the list.
 */
function collectTextBlocks(root: HTMLElement): HTMLElement[] {
  const blocks: HTMLElement[] = [];
  const walk = (parent: Element) => {
    for (const child of Array.from(parent.children)) {
      const isBlock = child.matches(TEXT_BLOCKS);
      if (!isBlock) {
        if (child.matches(CONTAINERS)) walk(child);
        continue;
      }
      if (child.querySelector(TEXT_BLOCKS)) {
        walk(child);
        continue;
      }
      // A code block keeps its own layout and selection behaviour; splitting it
      // into masked lines would break both.
      if (child.querySelector("pre")) continue;
      if (child.textContent?.trim()) blocks.push(child as HTMLElement);
    }
  };
  walk(root);
  return blocks;
}

/**
 * Reading measure for MDX and argument copy. It wraps the content in an
 * <article> and styles elements that MDX emits — it never rewrites them, so
 * headings, links and lists keep their semantics.
 *
 * The prose blocks reveal themselves from below a mask, one line at a time,
 * through the same gate as every other reveal. The split happens in a layout
 * effect, before the browser paints, so the masks are already in place when the
 * page first appears: a reader never sees an unsplit block that then jumps.
 */
export default function Prose({ children, className }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    const cleanups = collectTextBlocks(root).map((block) => {
      const heading = /^H[234]$/.test(block.tagName);
      return setupTextReveal(block, { split: heading ? "words" : "lines" });
    });

    root.dataset.reveal = "ready";

    return () => {
      delete root.dataset.reveal;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [children]);

  const classes = className
    ? `prose-blog prose-editorial ${className}`
    : "prose-blog prose-editorial";

  return (
    <article ref={ref} data-reveal="pending" className={classes}>
      {children}
    </article>
  );
}