import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getNextProject, getProject, getProjects } from "@/content/projects";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import { coverStyle } from "@/features/work/cover";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

/** The child segment is expanded once per locale the parent generates. */
export function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return getProjects(locale).map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const project = getProject(locale, slug);

  if (!project) return {};

  return { title: project.title, description: project.tagline };
}

export default async function ProjectPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const project = getProject(locale, slug);
  if (!project) notFound();

  const t = await getTranslations({ locale, namespace: "project" });
  const next = getNextProject(locale, slug);

  return (
    <main className="project-page">
      <article>
        <Reveal className="project-hero">
          <p className="ui-label">{t("caseStudy")}</p>
          <h1 className="project-hero__title">{project.title}</h1>
          <p className="project-hero__tagline">{project.tagline}</p>

          <dl className="project-meta">
            <div>
              <dt className="ui-label">{t("role")}</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt className="ui-label">{t("year")}</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt className="ui-label">{t("stack")}</dt>
              <dd dir="ltr">{project.stack.join(" · ")}</dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={80}>
          <div
            className="project-cover"
            style={{ background: coverStyle(project.cover) }}
            aria-hidden="true"
          />
        </Reveal>

        <div className="project-body">
          {project.sections.map((section) => (
            <Reveal as="section" key={section.heading} className="project-section">
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </Reveal>
          ))}
        </div>
      </article>

      <nav className="project-next" aria-label={t("next")}>
        <LinkLine href={localizedHref(locale, `/work/${next.slug}`)}>
          {t("next")} — {next.title}
        </LinkLine>
      </nav>
    </main>
  );
}
