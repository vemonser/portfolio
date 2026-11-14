import Link from "next/link";

import type { Project } from "@/content/projects/types";

import { coverStyle } from "./cover";

type Props = {
  project: Project;
  index: number;
  href: string;
};

function formatIndex(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/**
 * The crz.studio card: two stacked duotone covers swapped on hover, with the
 * mark, index, title and one-line summary. Everything except the link is inert
 * markup, so the whole card behaves as one target.
 */
export default function ProjectCard({ project, index, href }: Props) {
  return (
    <Link href={href} className="project-card">
      <span className="project-card__media" aria-hidden="true">
        <span
          className="project-card__layer project-card__layer--a"
          style={{ background: coverStyle(project.cover) }}
        />
        <span
          className="project-card__layer project-card__layer--b"
          style={{ background: coverStyle(project.coverAlt) }}
        />
        <span className="project-card__mark">
          {project.title.trim().charAt(0)}
        </span>
      </span>

      <span className="project-card__meta">
        <span className="project-card__head">
          <span className="project-card__title">{project.title}</span>
          <span className="project-card__index">P / {formatIndex(index)}</span>
        </span>
        <span className="project-card__tagline">{project.tagline}</span>
      </span>
    </Link>
  );
}
