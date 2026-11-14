import type { CSSProperties } from "react";

import type { Project } from "@/content/projects/types";

import { formatNumber } from "./editorial";

type Props = {
  project: Project;
  /** Zero-based position in the sequence; rendered one-based. */
  index: number;
  className?: string;
};

/**
 * Deterministic composition seed. A project always gets the same media
 * treatment: the same slug must never look different on two visits, so this is
 * a hash of the slug, not a random or time-based value.
 */
function seed(slug: string): number {
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

const VARIANTS = 3;

/**
 * Project media built from the data that actually exists: the two cover
 * colours, the project's initial, its index and the first stack item. It is a
 * designed placeholder, not a fake screenshot — no image the owner has not
 * supplied is implied.
 *
 * Three deterministic compositions keep the sequence from reading as a grid of
 * identical tiles: a bloom, a horizon split and a contour field.
 */
export default function EditorialMedia({
  project,
  index,
  className,
}: Props) {
  const variant = seed(project.slug) % VARIANTS;
  const classes = [
    "editorial-media",
    `editorial-media--v${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      aria-hidden="true"
      className={classes}
      style={
        {
          "--cover-from": project.cover.from,
          "--cover-to": project.cover.to,
        } as CSSProperties
      }
    >
      <span className="editorial-media__wash" />
      <span className="editorial-media__index">
        {formatNumber(index + 1, { pad: 2 })}
      </span>
      <span className="editorial-media__initial">
        {project.title.trim().charAt(0)}
      </span>
      <span className="editorial-media__meta">
        {project.year} — {project.stack[0]}
      </span>
    </span>
  );
}
