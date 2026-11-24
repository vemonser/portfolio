import { copy } from "@/content/copy";
import { getProjects } from "@/content/projects";
import ChapterLabel from "@/features/ui/ChapterLabel";
import { HOME_COUNT } from "@/features/ui/home-layout";
import LinkLine from "@/features/ui/LinkLine";
import ProjectIndex from "@/features/ui/ProjectIndex";
import TextReveal from "@/features/ui/TextReveal";
import { displayTitle } from "@/features/ui/styles";

/**
 * The work chapter of Home: a display heading over an asymmetric sequence,
 * then one quiet route into the archive. The sequence lives in ProjectIndex so
 * the archive can share the card without sharing the rhythm.
 */
export default function SelectedWork() {
  const projects = getProjects().slice(0, HOME_COUNT);

  return (
    <section
      aria-labelledby="selected-work-title"
      data-section="selected-work"
      className="page-shell section-pad"
    >
      <div className="border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <ChapterLabel index={1}>{copy.nav.work}</ChapterLabel>

        <div className="mt-[var(--space-4)]">
          <TextReveal id="selected-work-title" as="h2" className={displayTitle}>
            {copy.workSection.label}
          </TextReveal>
        </div>
      </div>

      <div className="mt-[var(--space-7)]">
        <ProjectIndex projects={projects} variant="home" />
      </div>

      <div className="mt-[var(--space-7)] flex justify-end border-t border-[var(--line-hairline)] pt-[var(--space-4)]">
        <LinkLine
          href="/work"
          className="inline-flex min-h-11 items-center gap-2 text-lede"
        >
          <TextReveal as="span">{copy.workSection.more}</TextReveal>
          <span aria-hidden="true">↗</span>
        </LinkLine>
      </div>
    </section>
  );
}
