import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getNextProject, getProject, getProjects } from "@/content/projects";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import { pageShell, pageTitle } from "@/features/ui/styles";
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
    <main className={pageShell}>
      <article>
        <Reveal className="flex max-w-[70rem] flex-col gap-4">
          <p className="ui-label">{t("caseStudy")}</p>
          <h1 className={`${pageTitle} mt-0`}>{project.title}</h1>
          <p className="m-0 max-w-[44ch] text-t-20 leading-[1.6] text-warm ar:leading-[1.9]">
            {project.tagline}
          </p>

          <dl className="mt-5 flex flex-wrap gap-x-12 gap-y-6">
            <div className="flex flex-col gap-[0.35rem]">
              <dt className="ui-label">{t("role")}</dt>
              <dd className="m-0 text-t-16">{project.role}</dd>
            </div>
            <div className="flex flex-col gap-[0.35rem]">
              <dt className="ui-label">{t("year")}</dt>
              <dd className="m-0 text-t-16">{project.year}</dd>
            </div>
            <div className="flex flex-col gap-[0.35rem]">
              <dt className="ui-label">{t("stack")}</dt>
              <dd className="m-0 text-t-16" dir="ltr">
                {project.stack.join(" · ")}
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={80}>
          <div
            aria-hidden="true"
            className="mt-[clamp(3rem,8vw,6rem)] aspect-[4/3] rounded-[2px] bg-ink md:aspect-[21/9]"
            style={{ background: coverStyle(project.cover) }}
          />
        </Reveal>

        <div className="mx-auto grid max-w-[46rem] gap-[clamp(3rem,7vw,5rem)] py-[clamp(4.5rem,11vw,8rem)]">
          {project.sections.map((section) => (
            <Reveal as="section" key={section.heading}>
              <h2 className="mb-[0.9rem] mt-0 font-display text-[clamp(1.35rem,2vw,1.75rem)] font-semibold tracking-[-0.02em] ar:tracking-normal">
                {section.heading}
              </h2>
              <p className="m-0 text-t-20 leading-[1.8] text-bone/70 ar:leading-[2]">
                {section.body}
              </p>
            </Reveal>
          ))}
        </div>
      </article>

      <nav
        aria-label={t("next")}
        className="flex justify-end border-t border-bone/10 pb-[clamp(3rem,8vw,5rem)] pt-[clamp(2rem,5vw,3.5rem)]"
      >
        <LinkLine
          href={localizedHref(locale, `/work/${next.slug}`)}
          className="text-[clamp(1.05rem,1.6vw,1.3rem)]"
        >
          {t("next")} — {next.title}
        </LinkLine>
      </nav>
    </main>
  );
}
