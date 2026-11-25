import { notFound } from "next/navigation";

import { copy } from "@/content/copy";
import { getPost, getPosts } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import PageFrame from "@/features/ui/PageFrame";
import DirectionalTransition from "@/features/transition/DirectionalTransition";
import Prose from "@/features/ui/Prose";
import TextReveal from "@/features/ui/TextReveal";
import { chapterFrame, displayArticle } from "@/features/ui/styles";
import PageTitle from "@/features/motion/PageTitle";
import { pageMetadata } from "@/lib/seo";
import { siteUrl } from "@/lib/site";
import JsonLd from "@/features/seo/JsonLd";

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
    image: null,
    type: "article",
    publishedTime: post.date,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = getPost(slug);
  if (!post) notFound();

  const { Content } = post;

  return (
    <DirectionalTransition>
    <PageFrame
      className={`${chapterFrame} section-pad`}
    >
      <div className="max-w-[var(--measure-body)]">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Article",
            headline: post.title,
            description: post.excerpt,
            datePublished: post.date,
            author: { "@type": "Person", name: "Abdelrhman Samy" },
            publisher: { "@type": "Person", name: "Abdelrhman Samy" },
            mainEntityOfPage: `${siteUrl()}/blog/${post.slug}`,
            image: `${siteUrl()}/blog/${post.slug}/opengraph-image`,
          }}
        />
        <div className="chapter-open">
          <div className="flex flex-col gap-[var(--space-3)]">
            <ChapterLabel index={2}>{copy.blogPage.label}</ChapterLabel>

            <PageTitle>
              <TextReveal as="h1" className={`${displayArticle}`}>
                {post.title}
              </TextReveal>
            </PageTitle>

            <time
              className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm"
              dateTime={post.date}
            >
              <TextReveal as="span" split="words">
                {formatPostDate(post.date)}
              </TextReveal>
            </time>

            <TextReveal
              as="p"
              className="m-0 max-w-[52ch] text-lede text-fg-muted"
            >
              {post.excerpt}
            </TextReveal>
          </div>
        </div>

        <Prose className="mt-[var(--space-5)]">
          <Content />
        </Prose>

        <div className="mt-[var(--space-4)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]">
          <LinkLine
            href="/blog"
            className="inline-flex min-h-11 items-center"
            transitionType="nav-back"
          >
            {copy.blogPost.back}
          </LinkLine>
        </div>
      </div>
    </PageFrame>
    </DirectionalTransition>
  );
}
