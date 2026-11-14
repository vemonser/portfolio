import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPost, getPosts } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import { pageTitle } from "@/features/ui/styles";

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
    <main className="px-[var(--nav-inset)] pb-[clamp(3rem,8vh,6rem)] pt-[clamp(8rem,22vh,14rem)]">
      <Reveal className="mx-auto flex max-w-[44rem] flex-col gap-4">
        <time
          className="font-label text-t-14 tracking-[var(--track)] text-warm ar:tracking-normal"
          dateTime={post.date}
        >
          {formatPostDate(post.date, locale)}
        </time>
        <h1
          className={`${pageTitle} mt-0 text-[clamp(2.25rem,5.6vw,4.5rem)]`}
        >
          {post.title}
        </h1>
      </Reveal>

      <article className="prose-blog">
        <Content />
      </article>

      <div className="mx-auto max-w-[44rem] border-t border-bone/10 pb-[clamp(2rem,6vw,4rem)] pt-6">
        <LinkLine href={localizedHref(locale, "/blog")}>{t("back")}</LinkLine>
      </div>
    </main>
  );
}
