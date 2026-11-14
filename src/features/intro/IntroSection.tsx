import { copy } from "@/content/copy";
import ChapterLabel from "@/features/ui/ChapterLabel";
import Reveal from "@/features/ui/Reveal";

/**
 * The first chapter after the Hero: one statement, one supporting argument and
 * one quiet metadata line. The argument sits in a narrow right-hand column, so
 * the statement keeps the width and the page keeps its editorial tension.
 */
export default function IntroSection() {
  return (
    <section
      aria-labelledby="intro-title"
      data-section="intro"
      className="px-[var(--inset-edge)] pb-[var(--inset-chapter)] pt-[var(--inset-chapter-lg)]"
    >
      <Reveal className="border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <ChapterLabel index={0}>{copy.intro.label}</ChapterLabel>
      </Reveal>

      <div className="mt-[var(--space-6)] grid items-start gap-[var(--space-5)] lg:grid-cols-12 lg:gap-x-[var(--space-5)]">
        <Reveal className="lg:col-span-8">
          <h2
            id="intro-title"
            className="m-0 max-w-[22ch] font-display text-[clamp(1.9rem,4.2vw,4rem)] font-medium leading-[1.1] tracking-[-0.03em]"
          >
            {copy.intro.statement}
          </h2>
        </Reveal>

        <Reveal delay={120} className="lg:col-span-4 lg:col-start-9 lg:mt-[var(--space-5)]">
          <p className="m-0 max-w-[34ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-[1.75] text-bone/65">
            {copy.intro.body}
          </p>
        </Reveal>
      </div>

      <Reveal
        delay={180}
        className="mt-[var(--space-6)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-1)] border-t border-[var(--line-hairline)] pt-[var(--space-2)] font-label text-t-14 uppercase tracking-[var(--track)] text-warm"
      >
        <span>{copy.hero.location}</span>
        <span aria-hidden="true" className="text-bone/25">
          ·
        </span>
        <span className="inline-flex items-center gap-[0.45rem] text-bone/70">
          <span
            className="h-[6px] w-[6px] rounded-full bg-lime"
            aria-hidden="true"
          />
          {copy.hero.available}
        </span>
      </Reveal>
    </section>
  );
}
