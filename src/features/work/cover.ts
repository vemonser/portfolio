import type { ProjectCover } from "@/content/projects/types";

/**
 * One cover ratio for every capture. The pipeline shoots 16:10 (2880x1800), so
 * any other frame crops the sides — which is what cut a marquee mid-word in the
 * archive. Cards, case-study media and future captures all use this.
 */
export const COVER_ASPECT = "aspect-[16/10]";

/** The two-layer duotone background shared by cards and case-study covers. */
export function coverStyle(cover: ProjectCover): string {
  return [
    "radial-gradient(120% 120% at 25% 15%, rgb(245 241 232 / 0.14), transparent 55%)",
    `linear-gradient(135deg, ${cover.from}, ${cover.to})`,
  ].join(", ");
}
