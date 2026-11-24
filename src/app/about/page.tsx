import { aboutData } from "@/content/about";
import { copy } from "@/content/copy";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import PageFrame from "@/features/ui/PageFrame";
import DirectionalTransition from "@/features/transition/DirectionalTransition";
import SkillMatrix from "@/features/ui/SkillMatrix";
import TextReveal from "@/features/ui/TextReveal";
import { chapterFrame, displaySection, displayTitle } from "@/features/ui/styles";
import PageTitle from "@/features/motion/PageTitle";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.about.label,
  description: copy.about.lede,
  path: "/about",
});

const focus = ["Interfaces", "Motion", "Performance"];

export default function AboutPage() {
  const { experience, stack, cv } = aboutData;

  return (
    <DirectionalTransition>
    <PageFrame
      className={`${chapterFrame} section-pad`}
    >
      <div className="chapter-open">
        <ChapterLabel index={3}>{copy.about.label}</ChapterLabel>

        <PageTitle>
          <TextReveal as="h1" className={`${displayTitle} mt-[var(--space-3)]`}>
            {copy.about.title}
          </TextReveal>
        </PageTitle>

        <TextReveal as="p" className="m-0 mt-[var(--space-3)] max-w-[26ch] font-display text-statement font-medium text-fg">
          {copy.about.lede}
        </TextReveal>
      </div>

      <div className="grid-12 mt-[var(--space-6)] items-start">
        <div className="lg:col-span-7 lg:col-start-1">
          <div className="flex flex-col gap-[var(--space-3)]">
            {copy.about.paragraphs.map((paragraph, index) => (
              <TextReveal
                key={paragraph}
                as="p"
                className={
                  index === 0
                    ? "about-copy m-0 max-w-[var(--measure-body)] text-lede leading-[1.75] text-fg"
                    : "about-copy m-0 max-w-[var(--measure-body)] text-body leading-[1.8] text-fg-muted"
                }
              >
                {paragraph}
              </TextReveal>
            ))}
          </div>
        </div>

        {/*
          Not a portrait placeholder. The facts column gives the manifesto a
          second edge without pretending to be a photograph; a real portrait
          replaces it when one exists.
        */}
        <div className="lg:col-span-4 lg:col-start-9">
          <aside aria-label="At a glance" className="border-t border-[var(--line-hairline)]">
            <dl className="m-0 flex flex-col">
              <div className="flex items-baseline justify-between gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-2)]">
                <dt className="ui-label m-0">
                  <TextReveal as="span" split="words">Based in</TextReveal>
                </dt>
                <dd className="m-0 text-t-16">
                  <TextReveal as="span" split="words">{copy.hero.location}</TextReveal>
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-2)]">
                <dt className="ui-label m-0">
                  <TextReveal as="span" split="words">Status</TextReveal>
                </dt>
                <dd className="m-0 inline-flex items-center gap-[0.45rem] text-t-16">
                  <span className="h-[6px] w-[6px] rounded-full bg-lime" aria-hidden="true" />
                  <TextReveal as="span" split="words">{copy.hero.available}</TextReveal>
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-2)]">
                <dt className="ui-label m-0">
                  <TextReveal as="span" split="words">Focus</TextReveal>
                </dt>
                <dd className="m-0 text-end text-t-16">
                  <TextReveal as="span" split="words">{focus.join(", ")}</TextReveal>
                </dd>
              </div>
            </dl>

            {cv ? (
              <div className="mt-[var(--space-3)]">
                <LinkLine
                  href={cv}
                  external
                  className="inline-flex min-h-11 items-center text-t-16"
                >
                  Download CV (PDF)
                </LinkLine>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      {experience.length > 0 ? (
        <section
          aria-labelledby="experience-title"
          data-section="experience"
          className="mt-[var(--space-8)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-3)]">
            <TextReveal
              id="experience-title"
              as="h2"
              className={`${displaySection}`}
            >
              Experience
            </TextReveal>
            <span className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm">
              {String(experience.length).padStart(2, "0")}
            </span>
          </div>

          <ol className="m-0 mt-[var(--space-5)] grid list-none gap-0 p-0">
            {experience.map((entry) => (
              <li
                key={`${entry.company}-${entry.period}`}
                className="grid gap-[var(--space-1)] border-t border-[var(--line-hairline)] py-[var(--space-3)] md:grid-cols-[11rem_minmax(0,1fr)] md:gap-[var(--space-5)]"
              >
                <TextReveal as="span" split="words" className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm">
                  {entry.period}
                </TextReveal>

                <div>
                  <TextReveal as="h3" className="m-0 font-display text-title font-semibold">
                    {entry.role} · {entry.company}
                  </TextReveal>
                  <TextReveal as="p" className="m-0 mt-[var(--space-1)] max-w-[var(--measure-body)] text-body text-fg-muted">
                    {entry.summary}
                  </TextReveal>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="mt-[var(--space-8)]">
        <SkillMatrix groups={copy.about.services} label={copy.about.servicesLabel} />
      </div>

      {stack.length > 0 ? (
        <section
          aria-labelledby="stack-title"
          data-section="stack"
          className="mt-[var(--space-8)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]"
        >
          <TextReveal
            id="stack-title"
            as="h2"
            className={`${displaySection}`}
          >
            Stack
          </TextReveal>

          <dl className="m-0 mt-[var(--space-5)] grid gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-4">
            {stack.map((group) => (
              <div
                key={group.label}
                className="border-t border-[var(--line-hairline)] pt-[var(--space-2)]"
              >
                <dt className="ui-label m-0">
                  <TextReveal as="span" split="words">
                    {group.label}
                  </TextReveal>
                </dt>
                <dd className="m-0 mt-[var(--space-1)] text-t-16 leading-[1.6] text-fg">
                  <TextReveal as="span" split="lines">
                    {group.items.join(" · ")}
                  </TextReveal>
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </PageFrame>
    </DirectionalTransition>
  );
}
