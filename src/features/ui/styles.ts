/**
 * Shared page-level type. The inner pages (work, about, contact, blog) all
 * open the same way, so the classes live in one place instead of drifting.
 */
export const roundButton =
  "group inline-grid aspect-square w-40 place-items-center content-center gap-2 rounded-full bg-lime p-6 text-center font-label text-label uppercase tracking-[var(--track)] text-ink no-underline transition-[transform,background-color] duration-[var(--dur-slow)] ease-[var(--ease-editorial)] hover:scale-[1.03] hover:bg-lime/85 active:scale-[0.98]";

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

export const chapterFrame = "page-shell";

export const bodyMeasure = "max-w-[var(--measure-body)] text-fg-muted";
