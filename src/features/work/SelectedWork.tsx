import { getTranslations } from "next-intl/server";

import { getProjects } from "@/content/projects";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import SectionHeading from "@/features/ui/SectionHeading";

import ProjectCard from "./ProjectCard";

type Props = {
  locale: string;
};

const HOME_COUNT = 6;

/** Six projects in crz.studio's staggered grid, then a way into the archive. */
export default async function SelectedWork({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "workSection" });
  const projects = getProjects(locale).slice(0, HOME_COUNT);

  return (
    <section aria-labelledby="selected-work-title" className="selected-work">
      <Reveal>
        <SectionHeading label={t("label")} />
      </Reveal>
      <h2 id="selected-work-title" className="sr-only">
        {t("label")}
      </h2>

      <div className="work-grid">
        {projects.map((project, index) => (
          <Reveal
            as="article"
            key={project.slug}
            className="work-grid__cell"
            delay={(index % 2) * 70}
          >
            <ProjectCard
              project={project}
              index={index}
              href={localizedHref(locale, `/work/${project.slug}`)}
            />
          </Reveal>
        ))}
      </div>

      <Reveal delay={60} className="selected-work__more">
        <LinkLine href={localizedHref(locale, "/work")}>
          {t("more")}
        </LinkLine>
      </Reveal>
    </section>
  );
}
