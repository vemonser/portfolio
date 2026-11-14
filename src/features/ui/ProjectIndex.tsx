import type { Project } from "@/content/projects/types";
import { localizedHref } from "@/features/navigation/nav";
import ProjectCard from "@/features/work/ProjectCard";

import { type Locale } from "./editorial";
import Reveal from "./Reveal";

type Props = {
  locale: Locale;
  projects: Project[];
  variant: "home" | "archive";
};

/**
 * The asymmetric Home sequence, per locale. These are not mirrors of each
 * other: Arabic starts from its own reading edge and breaks the twelve-column
 * grid at different points, so the two compositions share a vocabulary rather
 * than a silhouette.
 */
const HOME_LAYOUT: Record<Locale, string[]> = {
  en: [
    "lg:col-span-12",
    "lg:col-start-6 lg:col-span-7",
    "lg:col-start-1 lg:col-span-5",
    "lg:col-start-4 lg:col-span-9",
  ],
  ar: [
    "lg:col-span-12",
    "lg:col-start-1 lg:col-span-8",
    "lg:col-start-9 lg:col-span-4",
    "lg:col-start-2 lg:col-span-10",
  ],
};

/**
 * One project sequence, two densities. Home gets the editorial rhythm — varied
 * scale, deliberate negative space, alternating entry points. The archive is
 * calmer and denser because it is a catalogue, not a spread.
 */
export default function ProjectIndex({ locale, projects, variant }: Props) {
  const direction = locale === "ar" ? "rtl" : "ltr";
  const layout = HOME_LAYOUT[locale];

  if (variant === "archive") {
    return (
      <div className="grid gap-y-[var(--space-7)] md:grid-cols-2 md:gap-x-[var(--space-5)] lg:grid-cols-3 lg:gap-x-[var(--space-4)]">
        {projects.map((project, index) => (
          <Reveal as="article" key={project.slug} delay={(index % 3) * 60}>
            <ProjectCard
              project={project}
              index={index}
              href={localizedHref(locale, `/work/${project.slug}`)}
              locale={locale}
              direction={direction}
              variant="archive"
            />
          </Reveal>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-y-[var(--chapter-gap)] lg:grid-cols-12 lg:gap-y-[calc(var(--chapter-gap)*1.3)]">
      {projects.map((project, index) => (
        <Reveal
          as="article"
          key={project.slug}
          className={layout[index % layout.length]}
        >
          <ProjectCard
            project={project}
            index={index}
            href={localizedHref(locale, `/work/${project.slug}`)}
            locale={locale}
            direction={direction}
            variant="home"
          />
        </Reveal>
      ))}
    </div>
  );
}
