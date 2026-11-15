/**
 * About-page data.
 *
 * The page renders only the sections that have data, so nothing here is a
 * placeholder on screen. Fill `experience` and `cv` when they are real; the
 * stack below is the toolset this site is built with.
 */
export type ExperienceEntry = {
  /** e.g. "2024 — Present" */
  period: string;
  role: string;
  company: string;
  summary: string;
};

export type StackGroup = {
  label: string;
  items: string[];
};

export const aboutData: {
  experience: ExperienceEntry[];
  stack: StackGroup[];
  /** Path to a PDF in /public, or "" to hide the link. */
  cv: string;
} = {
  experience: [],
  stack: [
    { label: "Framework", items: ["Next.js", "React"] },
    { label: "Language", items: ["TypeScript", "CSS"] },
    { label: "Motion", items: ["GSAP", "Lenis", "three.js"] },
    { label: "Styling", items: ["Tailwind CSS", "Design tokens"] },
  ],
  cv: "",
};
