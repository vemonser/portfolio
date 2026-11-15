import type { Project } from "@/content/projects/types";
import ProjectCard from "@/features/work/ProjectCard";

import Reveal from "./Reveal";

type Props = {
  projects: Project[];
  variant: "home" | "archive";
};

/**
 * The asymmetric Home sequence. Two cards share a row, so the spread reads as
 * a composition rather than one card per screen: a wide feature beside a
 * smaller companion, then a balanced pair inset from the reading edge. The
 * archive is calmer and denser because it is a catalogue, not a spread.
 */
const HOME_LAYOUT = [
  "lg:col-span-7",
  "lg:col-start-9 lg:col-span-4",
  "lg:col-start-2 lg:col-span-5",
  "lg:col-start-8 lg:col-span-5",
];

export default function ProjectIndex({ projects, variant }: Props) {
  if (variant === "archive") {
    return (
      <div className="grid gap-y-[var(--space-7)] md:grid-cols-2 md:gap-x-[var(--space-5)] lg:grid-cols-3 lg:gap-x-[var(--space-4)]">
        {projects.map((project, index) => (
          <Reveal as="article" key={project.slug} delay={(index % 3) * 60}>
            <ProjectCard
              project={project}
              index={index}
              href={`/work/${project.slug}`}
              variant="archive"
            />
          </Reveal>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-y-[var(--chapter-gap)] lg:grid-cols-12">
      {projects.map((project, index) => (
        <Reveal
          as="article"
          key={project.slug}
          className={HOME_LAYOUT[index % HOME_LAYOUT.length]}
        >
          <ProjectCard
            project={project}
            index={index}
            href={`/work/${project.slug}`}
            variant="home"
          />
        </Reveal>
      ))}
    </div>
  );
}
