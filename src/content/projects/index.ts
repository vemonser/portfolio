import { projects as projectsAr } from "./projects.ar";
import { projects as projectsEn } from "./projects.en";
import type { Project } from "./types";

export type { Project } from "./types";

const byLocale: Record<"ar" | "en", Project[]> = {
  ar: projectsAr,
  en: projectsEn,
};

/** Arabic is the default; any other locale falls back to English. */
function catalogue(locale: string): Project[] {
  return locale === "ar" ? byLocale.ar : byLocale.en;
}

export function getProjects(locale: string): Project[] {
  return catalogue(locale);
}

export function getProject(locale: string, slug: string): Project | undefined {
  return catalogue(locale).find((project) => project.slug === slug);
}

/** The chain link at the end of a case study, wrapping around at the end. */
export function getNextProject(locale: string, slug: string): Project {
  const list = catalogue(locale);
  const index = list.findIndex((project) => project.slug === slug);
  return list[(index + 1) % list.length];
}
