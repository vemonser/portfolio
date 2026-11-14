import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPost, getPosts } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import { localizedHref } from "@/features/navigation/nav";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import PageFrame from "@/features/ui/PageFrame";
import Prose from "@/features/ui/Prose";
import Reveal from "@/features/ui/Reveal";
import { toLocale } from "@/features/ui/editorial";
import { chapterFrame, displayTitle } from "@/features/ui/styles";

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams({
  params: { locale },
}: {
  params: { locale: string };
}) {
  return getPosts(locale).map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { locale, slug } = await params;
  const post = getPost(locale, slug);

  if (!post) return {};

  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = getPost(locale, slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blogPost" });
  const tPage = await getTranslations({ locale, namespace: "blogPage" });
  const typed = toLocale(locale);
  const { Content } = post;

  return (
    <PageFrame
      locale={typed}
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <div className="chapter-open">
        <Reveal className="flex flex-col gap-[var(--space-3)]">
          <ChapterLabel locale={typed} index={2}>
            {tPage("label")}
          </ChapterLabel>

          <h1
            className={`${displayTitle} text-[clamp(2.2rem,5.4vw,4.5rem)]`}
          >
            {post.title}
          </h1>

          <time
            className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm ar:text-t-16 ar:normal-case ar:tracking-normal"
            dateTime={post.date}
          >
            {formatPostDate(post.date, locale)}
          </time>

          <p className="m-0 max-w-[52ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-[1.65] text-bone/65 ar:leading-[1.9]">
            {post.excerpt}
          </p>
        </Reveal>
      </div>

      <Prose locale={typed} className="mt-[var(--space-5)]">
        <Content />
      </Prose>

      <div className="chapter-open mt-[var(--space-4)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]">
        <LinkLine
          href={localizedHref(locale, "/blog")}
          className="inline-flex min-h-11 items-center"
        >
          {t("back")}
        </LinkLine>
      </div>
    </PageFrame>
  );
}
