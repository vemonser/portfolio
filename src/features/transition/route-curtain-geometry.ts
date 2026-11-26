import { copy } from "../../content/copy";
import { getPosts } from "../../content/blog/posts";
import { getProjects } from "../../content/projects";

/* Timing constants for the route curtain. Moved verbatim from RouteCurtain. */
export const COVER_S = 1.0;
export const REVEAL_S = 1.1;
export const LABEL_IN_S = 0.4;
export const LABEL_OUT_S = 0.4;
export const PUSH_AT = 0.5;
export const LABEL_START_AT = 0.35;
export const TRAIL_LAG = 0.1;
export const BULGE_RATIO = 0.6;
export const CTRL_X_RATIO = 0.27;
export const MAX_HOLD_S = 1.4;

export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

export const trailProgress = (t: number) =>
  t <= TRAIL_LAG ? 0 : (t - TRAIL_LAG) / (1 - TRAIL_LAG);

export const coverPath = (w: number, h: number, y: number, bulge: number) =>
  `M0 ${h} L0 ${y} Q${w * CTRL_X_RATIO} ${y - bulge} ${w} ${y} L${w} ${h} Z`;

export const revealPath = (w: number, h: number, y: number, bulge: number) =>
  `M0 0 L${w} 0 L${w} ${y} Q${w * CTRL_X_RATIO} ${y + bulge} 0 ${y} Z`;

export function labelFor(pathname: string): string {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (clean === "/") return copy.meta.title;

  const segments = clean.split("/").filter(Boolean);
  const [first, second] = segments;

  if (first === "work" && second) {
    const project = getProjects().find((p) => p.slug === second);
    if (project?.title) return project.title;
  }
  if (first === "blog" && second) {
    const post = getPosts().find((p) => p.slug === second);
    if (post?.title) return post.title;
  }

  const nav = copy.nav as Record<string, string>;
  const known: Record<string, string> = {
    work: nav.work ?? "Work",
    about: nav.about ?? "About",
    contact: nav.contact ?? "Contact",
    blog: nav.blog ?? "Blog",
  };
  return known[first] ?? first;
}