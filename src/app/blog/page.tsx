import { copy } from "@/content/copy";
import { getPosts } from "@/content/blog/posts";
import ChapterLabel from "@/features/ui/ChapterLabel";
import PageFrame from "@/features/ui/PageFrame";
import PostIndex from "@/features/ui/PostIndex";
import Reveal from "@/features/ui/Reveal";
import { bodyMeasure, chapterFrame, displayTitle } from "@/features/ui/styles";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.blogPage.title,
  description: copy.blogPage.lede,
  path: "/blog",
});

export default function BlogPage() {
  const posts = getPosts();

  return (
    <PageFrame
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <Reveal className="chapter-open">
        <ChapterLabel index={2}>{copy.blogPage.label}</ChapterLabel>

        <h1 className={`${displayTitle} mt-[var(--space-3)]`}>
          {copy.blogPage.title}
        </h1>

        <p
          className={`${bodyMeasure} mt-[var(--space-3)] text-lede`}
        >
          {copy.blogPage.lede}
        </p>
      </Reveal>

      <div className="mt-[var(--space-7)]">
        <PostIndex posts={posts} empty={copy.blogPage.empty} />
      </div>
    </PageFrame>
  );
}
