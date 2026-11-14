import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPosts } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import { pageLede, pageShell, pageTitle } from "@/features/ui/styles";

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
    <main className={`${pageShell} pb-[clamp(4rem,9vh,7rem)]`}>
      <Reveal className="max-w-[60rem]">
        <p className="ui-label">{t("label")}</p>
        <h1 className={pageTitle}>{t("title")}</h1>
        <p className={pageLede}>{t("lede")}</p>
      </Reveal>

      {posts.length === 0 ? (
        <p className={pageLede}>{t("empty")}</p>
      ) : (
        <ul className="m-0 mt-[clamp(3.5rem,8vw,6rem)] flex max-w-[52rem] list-none flex-col gap-[clamp(2.5rem,6vw,4rem)] p-0">
          {posts.map((post, index) => (
            <Reveal as="li" key={post.slug} delay={index * 60}>
              <LinkLine
                href={localizedHref(locale, `/blog/${post.slug}`)}
                className="font-display text-[clamp(1.5rem,3vw,2.25rem)] font-semibold leading-[1.2] tracking-[-0.02em] ar:leading-[1.45] ar:tracking-normal"
              >
                {post.title}
              </LinkLine>
              <time
                className="mt-2 block font-label text-t-14 tracking-[var(--track)] text-warm ar:tracking-normal"
                dateTime={post.date}
              >
                {formatPostDate(post.date, locale)}
              </time>
              <p className="mt-[0.6rem] max-w-[46ch] leading-[1.7] text-bone/60 ar:leading-[1.9]">
                {post.excerpt}
              </p>
            </Reveal>
          ))}
        </ul>
      )}
    </main>
  );
}
