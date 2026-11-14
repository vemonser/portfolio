import Hero from "@/features/hero/Hero";
import IntroSection from "@/features/intro/IntroSection";
import SelectedWork from "@/features/work/SelectedWork";
import PageFrame from "@/features/ui/PageFrame";
import { toLocale } from "@/features/ui/editorial";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <PageFrame locale={toLocale(locale)}>
      <Hero locale={locale} />
      <IntroSection locale={locale} />
      <SelectedWork locale={locale} />
    </PageFrame>
  );
}
