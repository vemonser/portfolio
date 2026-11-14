import type { ProjectCover } from "@/content/projects/types";

/** The two-layer duotone background shared by cards and case-study covers. */
export function coverStyle(cover: ProjectCover): string {
  return [
    "radial-gradient(120% 120% at 25% 15%, rgb(245 241 232 / 0.14), transparent 55%)",
    `linear-gradient(135deg, ${cover.from}, ${cover.to})`,
  ].join(", ");
}
