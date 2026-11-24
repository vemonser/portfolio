import type { Project } from "@/content/projects/types";
import ProjectCard from "@/features/work/ProjectCard";

import { PROJECT_GRID } from "./home-layout";

type Props = {
  projects: Project[];
  variant: "home" | "archive";
};

/**
 * One grid for both surfaces: two equal columns, one 16:10 frame and one
 * caption block. Home may show fewer projects, but the rhythm is identical, so
 * the archive can never end in a 3+1 orphan row.
 *
 * No outer fade: the card stays visible and the image reveals on its own via
 * ImageReveal (clip-path), which is the editorial effect we want. A card-level
 * fade would compete with and mask the image reveal.
 */
export default function ProjectIndex({ projects, variant }: Props) {
  return (
    <div className={PROJECT_GRID} data-project-grid={variant}>
      {projects.map((project, index) => (
        <article key={project.slug}>
          <ProjectCard
            project={project}
            index={index}
            href={`/work/${project.slug}`}
          />
        </article>
      ))}
    </div>
  );
}
