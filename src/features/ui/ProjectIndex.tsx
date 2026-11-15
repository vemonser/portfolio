import type { Project } from "@/content/projects/types";
import ProjectCard from "@/features/work/ProjectCard";

import { HOME_LAYOUT } from "./home-layout";
import Reveal from "./Reveal";

type Props = {
  projects: Project[];
  variant: "home" | "archive";
};

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
