import Hero from "@/features/hero/Hero";
import IntroSection from "@/features/intro/IntroSection";
import SelectedWork from "@/features/work/SelectedWork";
import PageFrame from "@/features/ui/PageFrame";

export default function HomePage() {
  return (
    <PageFrame>
      <Hero />
      <IntroSection />
      <SelectedWork />
    </PageFrame>
  );
}
