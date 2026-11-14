import { getTranslations, setRequestLocale } from "next-intl/server";

import Reveal from "@/features/ui/Reveal";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BlogPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "blogPage" });

  return (
    <main className="blog-index">
      <Reveal className="page-intro">
        <p className="ui-label">{t("label")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-lede">{t("lede")}</p>
      </Reveal>

      <p className="page-lede">{t("empty")}</p>
    </main>
  );
}
