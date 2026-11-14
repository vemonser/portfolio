import { getTranslations, setRequestLocale } from "next-intl/server";

import { getPosts } from "@/content/blog/posts";
import ChapterLabel from "@/features/ui/ChapterLabel";
import PageFrame from "@/features/ui/PageFrame";
import PostIndex from "@/features/ui/PostIndex";
import Reveal from "@/features/ui/Reveal";
import { toLocale } from "@/features/ui/editorial";
import { bodyMeasure, chapterFrame, displayTitle } from "@/features/ui/styles";

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
  const typed = toLocale(locale);

  return (
    <PageFrame
      locale={typed}
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <Reveal className="chapter-open">
        <ChapterLabel locale={typed} index={2}>
          {t("label")}
        </ChapterLabel>

        <h1 className={`${displayTitle} mt-[var(--space-3)]`}>{t("title")}</h1>

        <p
          className={`${bodyMeasure} mt-[var(--space-3)] text-[clamp(1.05rem,1.5vw,1.3rem)]`}
        >
          {t("lede")}
        </p>
      </Reveal>

      <div className="mt-[var(--space-7)]">
        <PostIndex locale={typed} posts={posts} empty={t("empty")} />
      </div>
    </PageFrame>
  );
}
