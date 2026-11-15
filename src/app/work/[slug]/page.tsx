import { notFound } from "next/navigation";

import { copy } from "@/content/copy";
import { getNextProject, getProject, getProjects } from "@/content/projects";
import LinkLine from "@/features/ui/LinkLine";
import NextProject from "@/features/ui/NextProject";
import PageFrame from "@/features/ui/PageFrame";
import Reveal from "@/features/ui/Reveal";
import { formatNumber } from "@/features/ui/editorial";
import { chapterFrame, displayTitle } from "@/features/ui/styles";
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

  return { title: project.title, description: project.tagline };
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
    <PageFrame
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,20vh,13rem)]`}
    >
      <article>
        <header className="chapter-open">
          <p className="ui-label m-0">{copy.project.caseStudy}</p>

          <h1 className={`${displayTitle} mt-[var(--space-2)]`}>
            {project.title}
          </h1>

          <p className="m-0 mt-[var(--space-3)] max-w-[44ch] text-[clamp(1.1rem,1.8vw,1.45rem)] leading-[1.6] text-warm">
            {project.tagline}
          </p>

          <dl
            className={`m-0 mt-[var(--space-5)] grid gap-[var(--space-3)] border-y border-[var(--line-hairline)] py-[var(--space-3)] ${
              project.stack.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <div className="flex flex-col gap-[0.35rem]">
              <dt className="ui-label">{copy.project.role}</dt>
              <dd className="m-0 text-t-16">{project.role}</dd>
            </div>
            <div className="flex flex-col gap-[0.35rem]">
              <dt className="ui-label">{copy.project.year}</dt>
              <dd className="m-0 text-t-16">{yearLabel}</dd>
            </div>
            {project.stack.length > 0 ? (
              <div className="flex flex-col gap-[0.35rem]">
                <dt className="ui-label">{copy.project.stack}</dt>
                <dd className="m-0 text-start text-t-16" dir="ltr">
                  {project.stack.join(" · ")}
                </dd>
              </div>
            ) : null}
          </dl>

          {project.url ? (
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-[var(--space-4)] inline-flex min-h-11 items-center gap-[var(--space-1)] rounded-full border border-[var(--line-strong)] px-[var(--space-4)] font-label text-t-14 uppercase tracking-[var(--track)] text-bone no-underline transition-colors duration-[var(--dur-base)] hover:border-lime hover:bg-lime hover:text-ink"
            >
              {copy.project.visit}
              <span aria-hidden="true">↗</span>
            </a>
          ) : null}
        </header>

        {project.media[0] ? (
          <Reveal delay={80}>
            <div className="-mx-[var(--inset-edge)] mt-[var(--space-6)]">
              <MediaBlock
                block={project.media[0]}
                title={project.title}
                url={project.url}
                priority
              />
            </div>
          </Reveal>
        ) : null}

        <div className="mt-[var(--space-8)] grid gap-[var(--space-7)]">
          {project.sections.map((section, index) => (
            <Reveal
              as="section"
              key={section.heading}
              className={
                index % 2 === 1 ? "ms-auto max-w-[42ch]" : "max-w-[58ch]"
              }
            >
              <span className="font-label text-t-14 tracking-[var(--track)] text-lime">
                {formatNumber(index + 1, { pad: 2 })}
              </span>

              <h2 className="mb-[0.9rem] mt-[var(--space-2)] font-display text-[clamp(1.7rem,3vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.025em]">
                {section.heading}
              </h2>

              <p className="m-0 text-[clamp(1.02rem,1.4vw,1.2rem)] leading-[1.8] text-bone/70">
                {section.body}
              </p>
            </Reveal>
          ))}
        </div>

        {project.media.length > 1 ? (
          <div className="mt-[var(--space-8)] grid grid-cols-[minmax(0,1fr)] gap-[var(--chapter-gap)]">
            {project.media.slice(1).map((block, i) => (
              <Reveal key={`${block.kind}-${i}`} delay={60}>
                <MediaBlock
                  block={block}
                  title={project.title}
                  url={project.url}
                  className={
                    block.kind === "browser" && i % 2 === 1
                      ? "lg:w-[78%] lg:ms-auto"
                      : undefined
                  }
                />
              </Reveal>
            ))}
          </div>
        ) : null}

        {project.url ? (
          <div className="mt-[var(--space-4)]">
            <LinkLine
              href={project.url}
              external
              className="inline-flex min-h-11 items-center text-[clamp(1.05rem,1.6vw,1.3rem)]"
            >
              {copy.project.visit}
            </LinkLine>
          </div>
        ) : null}
      </article>

      <div className="mt-[var(--space-8)]">
        <NextProject project={next} label={copy.project.next} />
      </div>
    </PageFrame>
  );
}
