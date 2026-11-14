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
 * The crz.studio card: two stacked duotone covers, the second rising over the
 * first on hover. Everything except the link is inert markup, so the whole
 * card behaves as one target.
 */
export default function ProjectCard({ project, index, href }: Props) {
  return (
    <Link href={href} className="group block" data-project={project.slug}>
      <span className="relative isolate block aspect-[4/3] overflow-hidden rounded-[2px] bg-ink">
        <span
          className="absolute inset-0 transition-transform duration-[950ms] ease-[cubic-bezier(0.7,0,0.2,1)] will-change-transform group-hover:scale-105 group-focus-visible:scale-105"
          style={{ background: coverStyle(project.cover) }}
        />
        <span
          className="absolute inset-0 scale-[1.07] opacity-0 transition-[opacity,transform] duration-[950ms] ease-[cubic-bezier(0.7,0,0.2,1)] will-change-[opacity,transform] group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
          style={{ background: coverStyle(project.coverAlt) }}
        />
        <span className="pointer-events-none absolute inset-0 z-[1] grid place-items-center font-display text-[clamp(6rem,17vw,13rem)] font-semibold leading-none tracking-[-0.04em] text-bone/15">
          {project.title.trim().charAt(0)}
        </span>
      </span>

      <span className="grid gap-[0.55rem] border-b border-bone/15 pb-[1.2rem] pt-4">
        <span className="flex items-baseline justify-between gap-4">
          <span className="font-display text-[clamp(1.05rem,1.5vw,1.35rem)] font-bold leading-[1.2] tracking-[-0.01em] en:uppercase en:tracking-[0.005em] ar:leading-[1.45] ar:tracking-normal">
            {project.title}
          </span>
          <span className="shrink-0 font-label text-t-14 tracking-[var(--track)] text-warm ar:tracking-normal">
            P / {formatIndex(index)}
          </span>
        </span>
        <span className="max-w-[44ch] text-[clamp(0.95rem,1.1vw,1.05rem)] leading-[1.6] text-bone/60 ar:leading-[1.8]">
          {project.tagline}
        </span>
      </span>
    </Link>
  );
}
