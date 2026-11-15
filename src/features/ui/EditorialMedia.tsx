import Image from "next/image";
import type { CSSProperties } from "react";

import type { Project } from "@/content/projects/types";

import { formatNumber } from "./editorial";

type Props = {
  project: Project;
  /** Zero-based position in the sequence; rendered one-based. */
  index: number;
  className?: string;
  /** Load the first card eagerly; everything else waits for the viewport. */
  priority?: boolean;
  /** Second capture, crossfaded in on group hover/focus. */
  hoverSrc?: string;
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
 * Project media. Real work uses a capture of the live site; everything else
 * falls back to a designed field built from the project's own cover colours and
 * metadata. The fallback is a placeholder with intent, never an implied
 * screenshot.
 *
 * The image is decorative here: the card's link text names the project, so an
 * empty alt avoids announcing the title twice.
 */
export default function EditorialMedia({
  project,
  index,
  className,
  priority = false,
  hoverSrc,
}: Props) {
  if (project.image) {
    return (
      <span
        aria-hidden="true"
        className={`editorial-media editorial-media--image ${className ?? ""}`}
      >
        <Image
          src={project.image}
          alt=""
          fill
          loading={priority ? "eager" : "lazy"}
          sizes="(min-width: 1024px) 60vw, 100vw"
          quality={90}
          className="object-cover object-top opacity-100 transition-opacity duration-[var(--dur-slow)] ease-[var(--ease-editorial)] group-hover:opacity-0 group-focus-visible:opacity-0"
        />
        {hoverSrc ? (
          <Image
            src={hoverSrc}
            alt=""
            fill
            loading="lazy"
            fetchPriority="low"
            sizes="(min-width: 1024px) 40vw, 90vw"
            quality={90}
            className="absolute inset-0 object-cover object-top opacity-0 will-change-opacity transition-opacity duration-[var(--dur-slow)] ease-[var(--ease-editorial)] group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        ) : null}
        <span className="editorial-media__scrim" />
        <span className="editorial-media__index">
          {formatNumber(index + 1, { pad: 2 })}
        </span>
      </span>
    );
  }

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
        {project.year}
        {project.stack[0] ? ` — ${project.stack[0]}` : ""}
      </span>
    </span>
  );
}
