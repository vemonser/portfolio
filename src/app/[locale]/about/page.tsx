import { getTranslations, setRequestLocale } from "next-intl/server";

import { localizedHref } from "@/features/navigation/nav";
import SectionStub from "@/features/stub/SectionStub";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const nav = await getTranslations({ locale, namespace: "nav" });
  const stub = await getTranslations({ locale, namespace: "stub" });

  return (
    <SectionStub
      title={nav("about")}
      body={stub("body")}
      back={stub("back")}
      backHref={localizedHref(locale, "/")}
    />
  );
}
