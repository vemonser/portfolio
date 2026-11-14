import Hero from "@/features/hero/Hero";
import IntroSection from "@/features/intro/IntroSection";
import SelectedWork from "@/features/work/SelectedWork";
import { setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main>
      <Hero />
      <IntroSection locale={locale} />
      <SelectedWork locale={locale} />
    </main>
  );
}
