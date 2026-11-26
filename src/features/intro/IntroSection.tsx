import { copy } from "@/content/copy";
import ChapterLabel from "@/features/ui/ChapterLabel";
import TextReveal from "@/features/ui/TextReveal";

/**
 * The first chapter after the Hero: one statement, one supporting argument and
 * one quiet metadata line. The argument sits in a narrow right-hand column, so
 * the statement keeps the width and the page keeps its editorial tension.
 */
export default function IntroSection() {
  return (
    <section
      id="intro"
      aria-labelledby="intro-title"
      data-section="intro"
      className="page-shell section-pad"
    >
      <div className="border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <ChapterLabel index={0}>{copy.intro.label}</ChapterLabel>
      </div>

      <div className="grid-12 mt-[var(--space-5)] items-start">
        <div className="lg:col-span-8">
          <TextReveal
            id="intro-title"
            as="h2"
            className="m-0 max-w-[22ch] font-display text-statement font-medium"
          >
            {copy.intro.statement}
          </TextReveal>
        </div>

        <div className="lg:col-span-4 lg:col-start-9 lg:mt-[var(--space-5)]">
          <TextReveal as="p" cursor="emphasis" className="m-0 max-w-[34ch] text-lede text-fg-muted">
            {copy.intro.body}
          </TextReveal>
        </div>
      </div>
    </section>
  );
}
