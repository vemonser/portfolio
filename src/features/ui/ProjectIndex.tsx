import type { Project } from "@/content/projects/types";
import ProjectCard from "@/features/work/ProjectCard";

import Reveal from "./Reveal";

type Props = {
  projects: Project[];
  variant: "home" | "archive";
};

/**
 * The asymmetric Home sequence. Project entries get varied scale and entry
 * points, so the page reads as an editorial spread rather than a uniform grid;
 * the archive is calmer and denser because it is a catalogue, not a spread.
 */
const HOME_LAYOUT = [
  "lg:col-span-10",
  "lg:col-start-7 lg:col-span-6",
  "lg:col-start-2 lg:col-span-4",
  "lg:col-start-5 lg:col-span-8",
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
    <div className="grid grid-cols-1 gap-y-[var(--chapter-gap)] lg:grid-cols-12 lg:gap-y-[calc(var(--chapter-gap)*1.3)]">
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
