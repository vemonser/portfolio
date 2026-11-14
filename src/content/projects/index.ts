import { projects } from "./projects";
import type { Project } from "./types";

export type { Project } from "./types";

export function getProjects(): Project[] {
  return projects;
}

export function getProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}

/** The chain link at the end of a case study, wrapping around at the end. */
export function getNextProject(slug: string): Project {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
}
