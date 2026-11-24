import Link from "next/link";

import type { Project } from "@/content/projects/types";
import EditorialMedia from "@/features/ui/EditorialMedia";
import ImageReveal from "@/features/ui/ImageReveal";
import Parallax from "@/features/ui/Parallax";
import TextReveal from "@/features/ui/TextReveal";

import { COVER_ASPECT } from "./cover";

type Props = {
  project: Project;
  index: number;
  href: string;
};

/**
 * A project entry. One card shape everywhere: a 16:10 frame that clips a
 * 1.03 hover scale, then the same three-line caption. The whole card is the
 * link; the unified cursor reads `data-cursor="view"` and shows VIEW.
 */
export default function ProjectCard({ project, index, href }: Props) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col gap-[var(--space-3)]"
      data-project={project.slug}
      data-compression-target="project"
      data-cursor="view"
      transitionTypes={["nav-forward"]}
    >
      <ImageReveal
        frameClassName={COVER_ASPECT}
        className="relative block"
      >
        <Parallax
          className="absolute inset-0"
          scale="var(--parallax-scale)"
          travel={4}
        >
          <EditorialMedia
            project={project}
            index={index}
            priority={index === 0}
            hoverSrc={project.imageHover}
            className="block transition-transform duration-[var(--dur-slow)] ease-[var(--ease-editorial)] will-change-transform group-hover:scale-[1.03] group-focus-visible:scale-[1.03]"
          />
        </Parallax>
      </ImageReveal>

      <div className="flex flex-col gap-[var(--space-1)] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <TextReveal
          as="span"
          split="words"
          className="project-card__title font-display text-h2 font-semibold uppercase text-bone"
        >
          {project.title}
        </TextReveal>

        <TextReveal
          as="span"
          split="words"
          className="font-label text-label uppercase tracking-[var(--track)] text-warm"
        >
          {project.role} · {project.year}
        </TextReveal>

        <TextReveal
          as="span"
          split="words"
          title={project.tagline}
          className="line-clamp-1 max-w-[52ch] text-small text-fg-muted"
        >
          {project.tagline}
        </TextReveal>
      </div>
    </Link>
  );
}
