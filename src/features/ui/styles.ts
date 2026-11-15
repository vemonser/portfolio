/**
 * Shared page-level type. The inner pages (work, about, contact, blog) all
 * open the same way, so the classes live in one place instead of drifting.
 */
export const roundButton =
  "inline-grid aspect-square w-[clamp(9rem,13vw,11.5rem)] place-items-center content-center gap-[0.45rem] rounded-full bg-lime p-5 text-center font-label text-t-14 uppercase leading-[1.3] tracking-[var(--track)] text-ink no-underline transition-[transform,background-color] duration-[450ms] ease-[cubic-bezier(0.7,0,0.2,1)] hover:scale-[1.045] hover:bg-lime/85 active:scale-[0.97]";

/*
 * Editorial chapter vocabulary. These strings describe structure only.
 *
 * A heading picks a role:
 *   displayTitle    page title, a label read as a sign
 *   displayStatement the same at sentence case (contact h1)
 *   displayArticle  an article title, smaller than a page title
 *   displayCta      the closing statement
 *   displaySection  a section name inside a page
 * Size, leading and tracking come from the step itself, never the call site.
 */
const displayBase = "m-0 font-display font-semibold";

export const displayTitle = `${displayBase} text-display-1 uppercase`;
export const displayStatement = `${displayBase} text-display-1`;
export const displayArticle = `${displayBase} text-statement`;
export const displayCta = `${displayBase} text-display-2`;
export const displaySection = `${displayBase} text-display-3 uppercase`;

export const chapterFrame = "px-[var(--inset-edge)]";

export const bodyMeasure = "max-w-[var(--measure-body)] text-fg-muted";
