import type { ComponentType } from "react";

import CalmMotionAr from "./calm-motion.ar.mdx";
import CalmMotionEn from "./calm-motion.en.mdx";
import TwoDirectionsAr from "./two-directions.ar.mdx";
import TwoDirectionsEn from "./two-directions.en.mdx";

export type BlogPost = {
  slug: string;
  /** ISO date, sortable. Display formatting lives in features/blog/format. */
  date: string;
  title: string;
  excerpt: string;
  Content: ComponentType;
};

const en: BlogPost[] = [
  {
    slug: "two-directions",
    date: "2026-06-12",
    title: "Designing for two directions at once",
    excerpt:
      "What actually breaks when a site is mirrored into Arabic — and why the fix belongs in the component, not in a second stylesheet.",
    Content: TwoDirectionsEn,
  },
  {
    slug: "calm-motion",
    date: "2026-05-02",
    title: "Motion that settles",
    excerpt:
      "Calm motion is not the absence of animation. It is animation that knows when to stop.",
    Content: CalmMotionEn,
  },
];

const ar: BlogPost[] = [
  {
    slug: "two-directions",
    date: "2026-06-12",
    title: "التصميم لاتجاهين في نفس الوقت",
    excerpt:
      "إيه اللي بيبوظ فعلاً لما الموقع يتعكس للعربي — وليه الحل في المكوّن نفسه مش في ستايل شيت تاني.",
    Content: TwoDirectionsAr,
  },
  {
    slug: "calm-motion",
    date: "2026-05-02",
    title: "حركة بتستقر",
    excerpt:
      "الحركة الهادية مش غياب الأنيميشن. هي أنيميشن عارف يقف امتى.",
    Content: CalmMotionAr,
  },
];

function pick(locale: string): BlogPost[] {
  return locale === "ar" ? ar : en;
}

/** Newest first. */
export function getPosts(locale: string): BlogPost[] {
  return [...pick(locale)].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(locale: string, slug: string): BlogPost | undefined {
  return pick(locale).find((post) => post.slug === slug);
}
