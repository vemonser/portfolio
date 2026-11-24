"use client";

import gsap from "gsap";
import { SplitText } from "gsap/SplitText";

import { whenRevealGateOpen } from "./reveal-gate";

gsap.registerPlugin(SplitText);

export type TextSplit = "lines" | "words";

type Options = {
  /** Lines suit prose; words suit display type. */
  split?: TextSplit;
  /** Stagger between units, in milliseconds. */
  stagger?: number;
};

// The same rise as the loading screen's letter entrance and the route
// curtain's label: one duration, one curve, so every masked arrival reads as
// the same gesture.
const DURATION = 1.1;
const EASE = "expo.out";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Splits one element into masked lines or words and reveals them from below
 * once it reaches the viewport.
 *
 * The mask is the block that clips (`overflow: clip`); the text inside is a
 * block for lines and an inline-block for words. It is parked one line below
 * the mask with `translateY(110%)` and rises to 0. No opacity is involved: the
 * mask keeps its height, so the empty line is the "before" state and a slow
 * font or hydration can never leave a blank hole.
 *
 * Returns a cleanup function. `autoSplit` re-splits on font load and resize;
 * the observer and tween are rebuilt around the new nodes each time.
 */
export function setupTextReveal(
  element: HTMLElement,
  { split = "lines", stagger }: Options = {},
): () => void {
  if (!element.textContent?.trim()) {
    // Nothing to split, but the block must not stay hidden behind the CSS
    // "prepared" gate.
    element.dataset.textReveal = "";
    element.dataset.prepared = "true";
    element.dataset.revealed = "true";
    return () => {
      delete element.dataset.textReveal;
      delete element.dataset.prepared;
      delete element.dataset.revealed;
    };
  }

  if (prefersReducedMotion()) {
    element.dataset.textReveal = "";
    element.dataset.prepared = "true";
    element.dataset.revealed = "true";
    return () => {
      delete element.dataset.textReveal;
      delete element.dataset.prepared;
      delete element.dataset.revealed;
    };
  }

  // The block stays invisible until the split exists. The attribute, not the
  // class, is what CSS keys on, so prose blocks get the same treatment without
  // having to carry the component's class name.
  element.dataset.textReveal = "";

  const step = (stagger ?? (split === "words" ? 30 : 70)) / 1000;
  // SplitText only sets a display when the wrapper tag is not a span, so the
  // spans this component uses are given theirs explicitly. Without it the
  // words are inline: transforms do not apply and `overflow: clip` does not
  // clip, so the reveal silently does nothing.
  const unitDisplay = split === "words" ? "inline-block" : "block";
  const applyDisplay = (nodes: ArrayLike<HTMLElement>) => {
    for (const node of Array.from(nodes)) node.style.display = unitDisplay;
  };
  let revealed = false;
  let observer: IntersectionObserver | null = null;
  let tween: gsap.core.Tween | null = null;
  let splitter: SplitText | null = null;

  const play = (targets: HTMLElement[]) => {
    if (revealed || targets.length === 0) return;
    revealed = true;

    whenRevealGateOpen().then(() => {
      if (!element.isConnected) return;
      // The units are still parked below the mask; the mask has kept the
      // height, so the reader sees the empty line the loader left behind and
      // then the rise. `data-prepared` is a marker for tests, not a visibility
      // switch.
      element.dataset.prepared = "true";
      tween = gsap.to(targets, {
        yPercent: 0,
        duration: DURATION,
        ease: EASE,
        stagger: step,
        overwrite: "auto",
        onComplete: () => {
          element.dataset.revealed = "true";
        },
      });
    });
  };

  const prepare = (targets: HTMLElement[]) => {
    applyDisplay(targets);
    observer?.disconnect();
    observer = null;
    tween?.kill();
    tween = null;

    if (targets.length === 0) {
      element.dataset.prepared = "true";
      element.dataset.revealed = "true";
      return;
    }

    if (revealed) {
      gsap.set(targets, { yPercent: 0 });
      return;
    }

    gsap.set(targets, { yPercent: 110 });

    if (!("IntersectionObserver" in window)) {
      play(targets);
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer?.disconnect();
        observer = null;
        play(targets);
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(element);
  };

  try {
    splitter = new SplitText(element, {
      type: split,
      mask: split,
      tag: "span",
      // The split nodes are still real text, so the element keeps its own
      // accessible name. "auto" would mirror the whole string into an
      // aria-label on the wrapper, which makes a plain label ("Email") look
      // like a second form control to assistive tech and to label queries.
      aria: "none",
      linesClass: "tr-line",
      wordsClass: "tr-word",
      autoSplit: true,
      onSplit(self) {
        applyDisplay(self.masks as unknown as HTMLElement[]);
        prepare((split === "words" ? self.words : self.lines) as HTMLElement[]);
      },
    });
  } catch {
    element.dataset.prepared = "true";
    element.dataset.revealed = "true";
  }

  return () => {
    observer?.disconnect();
    observer = null;
    tween?.kill();
    tween = null;
    // SplitText reverts the previous split itself before every re-split, so
    // this reverts the current one and leaves no mask nodes behind.
    splitter?.revert();
    splitter = null;
    delete element.dataset.textReveal;
    delete element.dataset.prepared;
    delete element.dataset.revealed;
  };
}
