import { getTranslations, setRequestLocale } from "next-intl/server";

import { getProjects } from "@/content/projects";
import { localizedHref } from "@/features/navigation/nav";
import { toLocale } from "@/features/ui/editorial";
import Reveal from "@/features/ui/Reveal";
import { pageLede, pageShell, pageTitle, workGrid } from "@/features/ui/styles";

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
    <main className={pageShell}>
      <Reveal className="max-w-[60rem]">
        <p className="ui-label">{t("label")}</p>
        <h1 className={pageTitle}>{t("title")}</h1>
        <p className={pageLede}>{t("lede")}</p>
      </Reveal>

      <div
        className={`mt-[clamp(4rem,9vw,7rem)] pb-[clamp(5rem,12vh,9rem)] ${workGrid}`}
      >
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
              locale={toLocale(locale)}
              direction={locale === "ar" ? "rtl" : "ltr"}
              variant="archive"
            />
          </Reveal>
        ))}
      </div>
    </main>
  );
}
