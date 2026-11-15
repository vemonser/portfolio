import { copy } from "@/content/copy";
import { homeMetadata } from "@/lib/seo";
import Hero from "@/features/hero/Hero";
import IntroSection from "@/features/intro/IntroSection";
import SelectedWork from "@/features/work/SelectedWork";
import PageFrame from "@/features/ui/PageFrame";

export const metadata = homeMetadata(copy.meta.description);

export default function HomePage() {
  return (
    <PageFrame>
      <Hero />
      <IntroSection />
      <SelectedWork />
    </PageFrame>
  );
}
