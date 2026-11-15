import { notFound } from "next/navigation";

import { copy } from "@/content/copy";
import { getPost, getPosts } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import PageFrame from "@/features/ui/PageFrame";
import Prose from "@/features/ui/Prose";
import Reveal from "@/features/ui/Reveal";
import { chapterFrame, displayStatement } from "@/features/ui/styles";
import { pageMetadata } from "@/lib/seo";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);

  if (!post) return {};

  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${slug}`,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = getPost(slug);
  if (!post) notFound();

  const { Content } = post;

  return (
    <PageFrame
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <div className="chapter-open">
        <Reveal className="flex flex-col gap-[var(--space-3)]">
          <ChapterLabel index={2}>{copy.blogPage.label}</ChapterLabel>

          <h1 className={`${displayStatement} text-[clamp(2.2rem,5.4vw,4.5rem)]`}>
            {post.title}
          </h1>

          <time
            className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm"
            dateTime={post.date}
          >
            {formatPostDate(post.date)}
          </time>

          <p className="m-0 max-w-[52ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-[1.65] text-bone/65">
            {post.excerpt}
          </p>
        </Reveal>
      </div>

      <Prose className="mt-[var(--space-5)]">
        <Content />
      </Prose>

      <div className="chapter-open mt-[var(--space-4)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]">
        <LinkLine
          href="/blog"
          className="inline-flex min-h-11 items-center"
        >
          {copy.blogPost.back}
        </LinkLine>
      </div>
    </PageFrame>
  );
}
