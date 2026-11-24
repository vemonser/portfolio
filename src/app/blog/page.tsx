import { copy } from "@/content/copy";
import { getPosts } from "@/content/blog/posts";
import ChapterLabel from "@/features/ui/ChapterLabel";
import PageFrame from "@/features/ui/PageFrame";
import DirectionalTransition from "@/features/transition/DirectionalTransition";
import PostIndex from "@/features/ui/PostIndex";
import TextReveal from "@/features/ui/TextReveal";
import { bodyMeasure, chapterFrame, displayTitle } from "@/features/ui/styles";
import PageTitle from "@/features/motion/PageTitle";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.blogPage.title,
  description: copy.blogPage.lede,
  path: "/blog",
});

export default function BlogPage() {
  const posts = getPosts();

  return (
    <DirectionalTransition>
    <PageFrame
      className={`${chapterFrame} section-pad`}
    >
      <div className="chapter-open">
        <ChapterLabel index={2}>{copy.blogPage.label}</ChapterLabel>

        <PageTitle>
          <TextReveal as="h1" className={`${displayTitle} mt-[var(--space-3)]`}>
            {copy.blogPage.title}
          </TextReveal>
        </PageTitle>

        <TextReveal
          as="p"
          className={`${bodyMeasure} mt-[var(--space-3)] text-lede`}
        >
          {copy.blogPage.lede}
        </TextReveal>
      </div>

      <div className="mt-[var(--space-7)]">
        <PostIndex posts={posts} empty={copy.blogPage.empty} />
      </div>
    </PageFrame>
    </DirectionalTransition>
  );
}
