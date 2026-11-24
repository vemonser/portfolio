import { copy } from "@/content/copy";
import { homeMetadata } from "@/lib/seo";
import ChrisHero from "@/features/lab/ChrisHero";
import IntroSection from "@/features/intro/IntroSection";
import SelectedWork from "@/features/work/SelectedWork";
import PageFrame from "@/features/ui/PageFrame";
import DirectionalTransition from "@/features/transition/DirectionalTransition";

export const metadata = homeMetadata(copy.meta.description);

export default function HomePage() {
  return (
    <DirectionalTransition>
      <PageFrame>
        <ChrisHero />
        <IntroSection />
        <SelectedWork />
      </PageFrame>
    </DirectionalTransition>
  );
}
