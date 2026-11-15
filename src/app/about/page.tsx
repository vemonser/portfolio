import { aboutData } from "@/content/about";
import { copy } from "@/content/copy";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import PageFrame from "@/features/ui/PageFrame";
import Reveal from "@/features/ui/Reveal";
import SkillMatrix from "@/features/ui/SkillMatrix";
import { chapterFrame, displayTitle } from "@/features/ui/styles";
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
    <PageFrame
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <Reveal className="chapter-open">
        <ChapterLabel index={3}>{copy.about.label}</ChapterLabel>

        <h1 className={`${displayTitle} mt-[var(--space-3)]`}>
          {copy.about.title}
        </h1>

        <p className="m-0 mt-[var(--space-3)] max-w-[26ch] font-display text-[clamp(1.6rem,3.6vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.03em] text-bone/85">
          {copy.about.lede}
        </p>
      </Reveal>

      <div className="mt-[var(--space-8)] grid items-start gap-[var(--space-6)] lg:grid-cols-12">
        <Reveal className="lg:col-span-7 lg:col-start-1">
          <div className="flex flex-col gap-[var(--space-3)]">
            {copy.about.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={
                  index === 0
                    ? "m-0 max-w-[56ch] text-[clamp(1.15rem,1.8vw,1.45rem)] leading-[1.65] text-bone/80"
                    : "m-0 max-w-[56ch] text-[clamp(1rem,1.3vw,1.15rem)] leading-[1.8] text-bone/60"
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>

        {/*
          Not a portrait placeholder. The facts column gives the manifesto a
          second edge without pretending to be a photograph; a real portrait
          replaces it when one exists.
        */}
        <Reveal delay={120} className="lg:col-span-4 lg:col-start-9">
          <aside aria-label="At a glance" className="border-t border-[var(--line-hairline)]">
            <dl className="m-0 flex flex-col">
              <div className="flex items-baseline justify-between gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-2)]">
                <dt className="ui-label m-0">Based in</dt>
                <dd className="m-0 text-t-16">{copy.hero.location}</dd>
              </div>

              <div className="flex items-baseline justify-between gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-2)]">
                <dt className="ui-label m-0">Status</dt>
                <dd className="m-0 inline-flex items-center gap-[0.45rem] text-t-16">
                  <span className="h-[6px] w-[6px] rounded-full bg-lime" aria-hidden="true" />
                  {copy.hero.available}
                </dd>
              </div>

              <div className="flex items-baseline justify-between gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-2)]">
                <dt className="ui-label m-0">Focus</dt>
                <dd className="m-0 text-end text-t-16">{focus.join(", ")}</dd>
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
        </Reveal>
      </div>

      {experience.length > 0 ? (
        <section
          aria-labelledby="experience-title"
          data-section="experience"
          className="mt-[var(--space-8)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-3)]">
            <h2
              id="experience-title"
              className="m-0 font-display text-[clamp(1.8rem,3.6vw,3rem)] font-semibold uppercase leading-[1.05] tracking-[-0.015em]"
            >
              Experience
            </h2>
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
                <span className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm">
                  {entry.period}
                </span>

                <div>
                  <h3 className="m-0 font-display text-[clamp(1.15rem,2vw,1.6rem)] font-semibold tracking-[-0.02em]">
                    {entry.role} · {entry.company}
                  </h3>
                  <p className="m-0 mt-[var(--space-1)] max-w-[58ch] leading-[1.7] text-bone/60">
                    {entry.summary}
                  </p>
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
          <h2
            id="stack-title"
            className="m-0 font-display text-[clamp(1.8rem,3.6vw,3rem)] font-semibold uppercase leading-[1.05] tracking-[-0.015em]"
          >
            Stack
          </h2>

          <dl className="m-0 mt-[var(--space-5)] grid gap-[var(--space-4)] sm:grid-cols-2 lg:grid-cols-4">
            {stack.map((group) => (
              <div
                key={group.label}
                className="border-t border-[var(--line-hairline)] pt-[var(--space-2)]"
              >
                <dt className="ui-label m-0">{group.label}</dt>
                <dd className="m-0 mt-[var(--space-1)] text-t-16 leading-[1.6] text-bone/80">
                  {group.items.join(" · ")}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
    </PageFrame>
  );
}
