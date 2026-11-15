/**
 * Shared page-level type. The inner pages (work, about, contact, blog) all
 * open the same way, so the classes live in one place instead of drifting.
 */
export const roundButton =
  "inline-grid aspect-square w-[clamp(9rem,13vw,11.5rem)] place-items-center content-center gap-[0.45rem] rounded-full bg-lime p-5 text-center font-label text-t-14 uppercase leading-[1.3] tracking-[var(--track)] text-ink no-underline transition-[transform,background-color] duration-[450ms] ease-[cubic-bezier(0.7,0,0.2,1)] hover:scale-[1.045] hover:bg-lime/85 active:scale-[0.97]";

/*
 * Editorial chapter vocabulary. These strings describe structure only — the
 * measure, leading and spacing come from the CSS custom properties, so a page
 * composes from tokens rather than from numbers typed at the call site.
 */
export const chapterFrame = "px-[var(--inset-edge)]";

export const displayTitle =
  "m-0 font-display text-[clamp(2.75rem,7vw,var(--type-display-max))] font-semibold uppercase leading-[var(--display-lead,0.94)] tracking-[-0.025em]";

export const bodyMeasure =
  "max-w-[var(--measure-body)] leading-[1.75] text-bone/65";
