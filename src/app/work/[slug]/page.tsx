import { notFound } from "next/navigation";

import { copy } from "@/content/copy";
import { getNextProject, getProject, getProjects } from "@/content/projects";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import NextProject from "@/features/ui/NextProject";
import PageFrame from "@/features/ui/PageFrame";
import DirectionalTransition from "@/features/transition/DirectionalTransition";
import TextReveal from "@/features/ui/TextReveal";
import { formatNumber } from "@/features/ui/editorial";
import { chapterFrame, displayTitle } from "@/features/ui/styles";
import PageTitle from "@/features/motion/PageTitle";
import { pageMetadata } from "@/lib/seo";
import MediaBlock from "@/features/work/MediaBlock";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);

  if (!project) return {};

  return pageMetadata({
    title: project.title,
    description: project.tagline,
    path: `/work/${slug}`,
  });
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;

  const project = getProject(slug);
  if (!project) notFound();

  const next = getNextProject(slug);
  const yearLabel = /^\d+$/.test(project.year)
    ? formatNumber(Number(project.year))
    : project.year;

  return (
    <DirectionalTransition>
    <PageFrame
      className={`${chapterFrame} section-pad`}
    >
      <article>
        <header>
          <div className="chapter-open">
          <ChapterLabel index={1}>{copy.project.caseStudy}</ChapterLabel>

          <PageTitle>
            <TextReveal as="h1" className={`${displayTitle} mt-[var(--space-2)]`}>
              {project.title}
            </TextReveal>
          </PageTitle>

          <TextReveal as="p" className="m-0 mt-[var(--space-3)] max-w-[44ch] text-lede leading-[1.6] text-warm">
            {project.tagline}
          </TextReveal>

          </div>

          <dl className="mt-[var(--space-5)] grid grid-cols-2 gap-x-[var(--space-3)] gap-y-[var(--space-4)] border-y border-[var(--line-hairline)] py-[var(--space-3)] md:grid-cols-4">
            <div className="flex flex-col gap-[var(--space-1)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">{copy.project.role}</TextReveal>
              </dt>
              <dd className="m-0">
                <TextReveal as="span" split="words">{project.role}</TextReveal>
              </dd>
            </div>
            <div className="flex flex-col gap-[var(--space-1)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">{copy.project.year}</TextReveal>
              </dt>
              <dd className="m-0">
                <TextReveal as="span" split="words">{yearLabel}</TextReveal>
              </dd>
            </div>
            <div className="flex flex-col gap-[var(--space-1)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">{copy.project.stack}</TextReveal>
              </dt>
              <dd className="m-0" dir="ltr">
                <TextReveal as="span" split="words">
                  {project.stack.length > 0 ? project.stack.join(" · ") : "—"}
                </TextReveal>
              </dd>
            </div>
            <div className="flex flex-col gap-[var(--space-1)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">Link</TextReveal>
              </dt>
              <dd className="m-0 min-h-11">
                {project.url ? (
                  <LinkLine
                    href={project.url}
                    external
                    className="inline-flex min-h-11 items-center gap-[var(--space-1)]"
                  >
                    <TextReveal as="span" split="words">
                      {copy.project.visit}
                    </TextReveal>
                    <span aria-hidden="true">↗</span>
                  </LinkLine>
                ) : (
                  "—"
                )}
              </dd>
            </div>
          </dl>

        </header>

        {project.media[0] ? (
          <div className="mt-[var(--space-6)]">
            <MediaBlock
              block={project.media[0]}
              title={project.title}
              url={project.url}
              priority
              bleed
            />
          </div>
        ) : null}

        <div className="mt-[var(--space-8)] grid gap-[var(--space-6)]">
          {project.sections.map((section, index) => (
            <section
              key={section.heading}
              className="max-w-[var(--measure-body)]"
            >
              <span className="font-label text-t-14 tracking-[var(--track)] text-warm">
                {formatNumber(index + 1, { pad: 2 })}
              </span>

              <TextReveal as="h2" className="mb-[0.9rem] mt-[var(--space-2)] font-display text-display-3 font-semibold">
                {section.heading}
              </TextReveal>

              <TextReveal as="p" className="m-0 text-body leading-[1.8] text-fg-muted">
                {section.body}
              </TextReveal>
            </section>
          ))}
        </div>

        {project.media.length > 1 ? (
          <div className="mt-[var(--space-6)] grid grid-cols-[minmax(0,1fr)] gap-[var(--space-6)]">
            {project.media.slice(1).map((block, i) => (
              <div key={`${block.kind}-${i}`}>
                <MediaBlock
                  block={block}
                  title={project.title}
                  url={project.url}
                />
              </div>
            ))}
          </div>
        ) : null}

        {/*
          The meta row scrolls away on a long case study, so the live site is
          repeated once at the end as a real action — not the 14px orphan the
          audit found.
        */}
        {project.url ? (
          <div className="mt-[var(--space-7)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]">
            <LinkLine
              href={project.url}
              external
              className="inline-flex min-h-11 items-center text-lede"
            >
              <TextReveal as="span" split="words">
                {copy.project.visit}
              </TextReveal>
              <span aria-hidden="true" className="ms-2">
                ↗
              </span>
            </LinkLine>
          </div>
        ) : null}
      </article>

      <div className="mt-[var(--space-8)]">
        <NextProject project={next} label={copy.project.next} />
      </div>
    </PageFrame>
    </DirectionalTransition>
  );
}
