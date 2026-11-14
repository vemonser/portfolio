/**
 * Shared page-level type. The inner pages (work, about, contact, blog) all
 * open the same way, so the classes live in one place instead of drifting.
 */
export const pageShell = "px-[var(--nav-inset)] pt-[clamp(9rem,24vh,15rem)]";

export const pageTitle =
  "mt-5 font-display text-[clamp(3rem,10vw,8rem)] font-semibold leading-[0.95] tracking-[-0.045em] ar:leading-[1.2] ar:tracking-normal";

export const pageLede =
  "mt-6 max-w-[46ch] text-t-20 leading-[1.7] text-bone/60 ar:leading-[1.9]";

export const workGrid =
  "grid gap-y-[clamp(3rem,5.5vw,4.75rem)] md:grid-cols-2 md:gap-x-[clamp(2.5rem,5vw,4.5rem)] lg:grid-cols-3 lg:gap-x-[clamp(2rem,3vw,3.5rem)]";

export const roundButton =
  "inline-grid aspect-square w-[clamp(9rem,13vw,11.5rem)] place-items-center gap-[0.45rem] rounded-full bg-lime p-5 text-center font-label text-t-14 uppercase leading-[1.3] tracking-[var(--track)] text-ink no-underline transition-[transform,background-color] duration-[450ms] ease-[cubic-bezier(0.7,0,0.2,1)] hover:scale-[1.045] hover:bg-lime/85 active:scale-[0.97] ar:text-t-16 ar:normal-case ar:tracking-normal ar:leading-[1.45]";

/*
 * Editorial chapter vocabulary. These strings describe structure only — the
 * locale-dependent values (measure, leading, spacing) come from the CSS
 * custom properties, so an English and an Arabic page can share one class and
 * still compose differently.
 */
export const chapterFrame = "px-[var(--inset-edge)]";

export const chapterSpacing = "py-[var(--inset-chapter)]";

export const chapterOpen = "chapter-open";

export const displayTitle =
  "m-0 font-display text-[clamp(2.75rem,7vw,var(--type-display-max))] font-semibold leading-[var(--display-lead,0.94)] tracking-[-0.045em] en:uppercase en:tracking-[-0.025em] ar:tracking-normal";

export const bodyMeasure =
  "max-w-[var(--measure-body)] leading-[1.75] text-bone/65 ar:leading-[var(--leading-arabic)]";

export const hairline = "border-t border-[var(--line-hairline)]";

