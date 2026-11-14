import { getTranslations, setRequestLocale } from "next-intl/server";

import { getProjects } from "@/content/projects";
import { localizedHref } from "@/features/navigation/nav";
import Reveal from "@/features/ui/Reveal";

import ProjectCard from "@/features/work/ProjectCard";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "workPage" });

  return { title: t("title"), description: t("lede") };
}

export default async function WorkPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "workPage" });
  const projects = getProjects(locale);

  return (
    <main className="work-index">
      <Reveal className="page-intro">
        <p className="ui-label">{t("label")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-lede">{t("lede")}</p>
      </Reveal>

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
    </main>
  );
}
