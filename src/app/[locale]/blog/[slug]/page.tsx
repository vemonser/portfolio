import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPost, getPosts } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";

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
  const { Content } = post;

  return (
    <main className="blog-post">
      <Reveal className="blog-post-hero">
        <time className="blog-post-hero__date" dateTime={post.date}>
          {formatPostDate(post.date, locale)}
        </time>
        <h1 className="page-title">{post.title}</h1>
      </Reveal>

      <article className="prose-blog">
        <Content />
      </article>

      <div className="blog-post__back">
        <LinkLine href={localizedHref(locale, "/blog")}>{t("back")}</LinkLine>
      </div>
    </main>
  );
}
