import Link from "next/link";

import type { Project } from "@/content/projects/types";

import { formatNumber, type Locale } from "@/features/ui/editorial";
import EditorialMedia from "@/features/ui/EditorialMedia";

type Props = {
  project: Project;
  index: number;
  href: string;
  locale: Locale;
  /** Reading direction of the page; the Hero mirrors its fold axis with it. */
  direction: "ltr" | "rtl";
  variant: "home" | "archive";
};

/**
 * Project media ratios follow the sequence position, so the Home run breathes
 * unevenly on purpose. The archive keeps one ratio for comparison.
 */
const HOME_ASPECT = [
  "aspect-[16/10]",
  "aspect-[4/5]",
  "aspect-[5/4]",
  "aspect-[3/2]",
];

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
  locale,
  direction,
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
      data-compression-direction={direction}
    >
      <span className="relative block overflow-hidden">
        <EditorialMedia
          project={project}
          index={index}
          locale={locale}
          className={`${
            home ? HOME_ASPECT[index % HOME_ASPECT.length] : "aspect-[4/3]"
          } transition-transform duration-[var(--dur-slow)] ease-[var(--ease-editorial)] will-change-transform group-hover:scale-[1.015] group-focus-visible:scale-[1.015]`}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute z-[1] m-[var(--space-2)] grid h-11 w-11 translate-y-2 place-items-center rounded-full bg-bone/10 text-bone opacity-0 backdrop-blur-sm transition-[opacity,transform] duration-[var(--dur-base)] ease-[var(--ease-editorial)] group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [inset-block-end:0] [inset-inline-end:0]"
        >
          <span className={direction === "rtl" ? "-scale-x-100" : undefined}>
            ↗
          </span>
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
                ? "font-display text-[clamp(1.6rem,3.4vw,2.8rem)] font-semibold leading-[1.02] tracking-[-0.03em] en:uppercase en:tracking-[-0.015em] ar:leading-[1.35] ar:tracking-normal"
                : "font-display text-[clamp(1.15rem,1.6vw,1.45rem)] font-semibold leading-[1.2] tracking-[-0.02em] en:uppercase en:tracking-[-0.005em] ar:leading-[1.45] ar:tracking-normal"
            }
          >
            {project.title}
          </span>
          <span className="shrink-0 font-label text-t-14 tracking-[var(--track)] text-warm ar:tracking-normal">
            P / {formatNumber(index + 1, locale, { pad: 2 })}
          </span>
        </span>

        <span className="font-label text-t-14 uppercase tracking-[var(--track)] text-lime/75 ar:text-t-16 ar:normal-case ar:tracking-normal">
          {project.role} · {project.year}
        </span>

        <span
          className={
            home
              ? "max-w-[48ch] leading-[1.7] text-bone/60 ar:leading-[1.9]"
              : "max-w-[44ch] leading-[1.6] text-bone/60 ar:leading-[1.85]"
          }
        >
          {project.tagline}
        </span>
      </span>
    </Link>
  );
}
