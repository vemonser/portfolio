import { getTranslations } from "next-intl/server";

import { getProjects } from "@/content/projects";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import { workGrid } from "@/features/ui/styles";

import ProjectCard from "./ProjectCard";

type Props = {
  locale: string;
};

const HOME_COUNT = 6;

/** Six projects in crz.studio's flat three-up grid, then a way into the archive. */
export default async function SelectedWork({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "workSection" });
  const projects = getProjects(locale).slice(0, HOME_COUNT);

  return (
    <section
      aria-labelledby="selected-work-title"
      data-section="selected-work"
      className="px-[var(--nav-inset)] pb-[clamp(6rem,13vh,10rem)] pt-[clamp(5rem,12vh,9rem)]"
    >
      <Reveal>
        <h2
          id="selected-work-title"
          className="m-0 font-display text-[clamp(2.6rem,6.4vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.04em] en:uppercase en:tracking-[-0.02em] ar:leading-[1.3] ar:tracking-normal"
        >
          {t("label")}
        </h2>
      </Reveal>

      <div className={`mt-[clamp(3.5rem,8vw,6rem)] ${workGrid}`}>
        {projects.map((project, index) => (
          <Reveal
            as="article"
            key={project.slug}
            delay={(index % 3) * 60}
          >
            <ProjectCard
              project={project}
              index={index}
              href={localizedHref(locale, `/work/${project.slug}`)}
            />
          </Reveal>
        ))}
      </div>

      <Reveal delay={60} className="mt-[clamp(4rem,9vw,6.5rem)] flex justify-center">
        <LinkLine
          href={localizedHref(locale, "/work")}
          className="text-[clamp(1.05rem,1.6vw,1.3rem)]"
        >
          {t("more")}
        </LinkLine>
      </Reveal>
    </section>
  );
}
