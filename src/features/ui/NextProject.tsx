import Link from "next/link";

import type { Project } from "@/content/projects/types";

type Props = {
  project: Project;
  label: string;
};

/**
 * The case study's closing chapter: the next project, at full width, as one
 * link. The arrow points forward, along the reading direction, while the
 * project identity stays fixed.
 */
export default function NextProject({ project, label }: Props) {
  return (
    <Link
      href={`/work/${project.slug}`}
      data-next-project
      className="next-project group block border-t border-[var(--line-hairline)] pb-[var(--space-5)] pt-[var(--space-4)] no-underline"
    >
      <span className="ui-label">{label}</span>

      <span className="mt-[var(--space-3)] flex flex-wrap items-end justify-between gap-[var(--space-3)]">
        <span className="font-display text-[clamp(2rem,5.4vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] transition-colors duration-[var(--dur-base)] group-hover:text-lime">
          {project.title}
        </span>

        <span
          aria-hidden="true"
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-bone/20 transition-[transform,background-color,border-color] duration-[var(--dur-base)] ease-[var(--ease-editorial)] group-hover:border-lime group-hover:bg-lime group-hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            focusable="false"
          >
            <path d="M4 12h15M13 6l6 6-6 6" />
          </svg>
        </span>
      </span>

      <span className="mt-[var(--space-2)] block font-label text-t-14 uppercase tracking-[var(--track)] text-warm">
        {project.role} · {project.year}
      </span>
    </Link>
  );
}
