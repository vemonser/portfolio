import { copy } from "@/content/copy";
import { getProjects } from "@/content/projects";
import ChapterLabel from "@/features/ui/ChapterLabel";
import PageFrame from "@/features/ui/PageFrame";
import ProjectIndex from "@/features/ui/ProjectIndex";
import DirectionalTransition from "@/features/transition/DirectionalTransition";
import TextReveal from "@/features/ui/TextReveal";
import { bodyMeasure, chapterFrame, displayTitle } from "@/features/ui/styles";
import PageTitle from "@/features/motion/PageTitle";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.workPage.title,
  description: copy.workPage.description,
  path: "/work",
});

export default function WorkPage() {
  const projects = getProjects();

  return (
    <DirectionalTransition>
    <PageFrame
      className={`${chapterFrame} section-pad`}
    >
      <div className="chapter-open">
        <ChapterLabel index={1}>{copy.workPage.label}</ChapterLabel>

        <PageTitle>
          <TextReveal as="h1" className={`${displayTitle} mt-[var(--space-3)]`}>
            {copy.workPage.title}
          </TextReveal>
        </PageTitle>

        <TextReveal
          as="p"
          className={`${bodyMeasure} mt-[var(--space-3)] text-lede`}
        >
          {copy.workPage.lede(projects.length)}
        </TextReveal>
      </div>

      <div className="mt-[var(--space-8)]">
        <ProjectIndex projects={projects} variant="archive" />
      </div>
    </PageFrame>
    </DirectionalTransition>
  );
}
