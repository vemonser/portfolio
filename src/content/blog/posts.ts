import type { ComponentType } from "react";

import CalmMotion from "./calm-motion.mdx";
import TwoDirections from "./two-directions.mdx";

export type BlogPost = {
  slug: string;
  /** ISO date, sortable. Display formatting lives in features/blog/format. */
  date: string;
  title: string;
  excerpt: string;
  Content: ComponentType;
};

const posts: BlogPost[] = [
  {
    slug: "two-directions",
    date: "2026-06-12",
    title: "Designing for two directions at once",
    excerpt:
      "What actually breaks when a site is mirrored into Arabic — and why the fix belongs in the component, not in a second stylesheet.",
    Content: TwoDirections,
  },
  {
    slug: "calm-motion",
    date: "2026-05-02",
    title: "Motion that settles",
    excerpt:
      "Calm motion is not the absence of animation. It is animation that knows when to stop.",
    Content: CalmMotion,
  },
];

/** Newest first. */
export function getPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPost(slug: string): BlogPost | undefined {
  return posts.find((post) => post.slug === slug);
}
