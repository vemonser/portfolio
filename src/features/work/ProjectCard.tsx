import Link from "next/link";

import type { Project } from "@/content/projects/types";

import { formatNumber } from "@/features/ui/editorial";
import EditorialMedia from "@/features/ui/EditorialMedia";

type Props = {
  project: Project;
  index: number;
  href: string;
  variant: "home" | "archive";
};

/**
 * Project media ratios follow the sequence position, so the Home run breathes
 * unevenly on purpose. The archive keeps one ratio for comparison.
 */
const HOME_ASPECT = "aspect-[16/10]";

/**
 * A project entry. The whole card is the link, the media is a designed field
 * built from real project metadata, and hover reveals the one action the card
 * has: open the case study. Nothing here talks to the Hero — the
 * `data-compression-target` attribute is the only contract between them.
 */
export default function ProjectCard({
  project,
  index,
  href,
  variant,
}: Props) {
  const home = variant === "home";

  return (
    <Link
      href={href}
      className={`group flex h-full flex-col ${
        home ? "gap-[var(--space-3)]" : "gap-[var(--space-2)]"
      }`}
      data-project={project.slug}
      data-compression-target="project"
    >
      <span className="relative block overflow-hidden">
        <EditorialMedia
          project={project}
          index={index}
          priority={index === 0}
          className={`${
            home ? HOME_ASPECT : "aspect-[4/3]"
          } transition-transform duration-[var(--dur-slow)] ease-[var(--ease-editorial)] will-change-transform group-hover:scale-[1.015] group-focus-visible:scale-[1.015]`}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] m-[var(--space-2)] grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-bone/10 text-bone opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-editorial)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [inset-block-end:0] [inset-inline-end:0]"
        >
          <span>↗</span>
        </span>
      </span>

      <span
        className={`flex flex-col border-t border-[var(--line-hairline)] ${
          home
            ? "gap-[0.6rem] pt-[var(--space-2)]"
            : "gap-[0.4rem] pt-[var(--space-1)]"
        }`}
      >
        <span className="flex items-baseline justify-between gap-[var(--space-3)]">
          <span
            className={
              home
                ? "font-display text-[clamp(1.6rem,3.4vw,2.8rem)] font-semibold leading-[1.02] uppercase tracking-[-0.015em]"
                : "font-display text-[clamp(1.15rem,1.6vw,1.45rem)] font-semibold leading-[1.2] uppercase tracking-[-0.005em]"
            }
          >
            {project.title}
          </span>
          <span className="shrink-0 font-label text-t-14 tracking-[var(--track)] text-warm">
            P / {formatNumber(index + 1, { pad: 2 })}
          </span>
        </span>

        <span className="font-label text-t-14 uppercase tracking-[var(--track)] text-lime/75">
          {project.role} · {project.year}
        </span>

        <span
          className={
            home
              ? "max-w-[48ch] leading-[1.7] text-bone/60"
              : "max-w-[44ch] leading-[1.6] text-bone/60"
          }
        >
          {project.tagline}
        </span>
      </span>
    </Link>
  );
}
