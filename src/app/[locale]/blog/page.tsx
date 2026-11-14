import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPosts } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blogPage" });

  return { title: t("title"), description: t("lede") };
}

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "blogPage" });
  const posts = getPosts(locale);

  return (
    <main className="blog-index">
      <Reveal className="page-intro">
        <p className="ui-label">{t("label")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-lede">{t("lede")}</p>
      </Reveal>

      {posts.length === 0 ? (
        <p className="page-lede">{t("empty")}</p>
      ) : (
        <ul className="blog-list">
          {posts.map((post, index) => (
            <Reveal
              as="li"
              key={post.slug}
              className="blog-row"
              delay={index * 60}
            >
              <LinkLine
                href={localizedHref(locale, `/blog/${post.slug}`)}
                className="blog-row__link"
              >
                {post.title}
              </LinkLine>
              <time className="blog-row__date" dateTime={post.date}>
                {formatPostDate(post.date, locale)}
              </time>
              <p className="blog-row__excerpt">{post.excerpt}</p>
            </Reveal>
          ))}
        </ul>
      )}
    </main>
  );
}
