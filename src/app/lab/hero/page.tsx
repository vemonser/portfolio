import PageLoader from "@/features/loader/page-loader";
import ChrisHero from "@/features/lab/ChrisHero";
import IntroSection from "@/features/intro/IntroSection";
import PageFrame from "@/features/ui/PageFrame";
import SelectedWork from "@/features/work/SelectedWork";

export const metadata = {
  title: "Lab — Chris hero",
  robots: { index: false, follow: false },
};

/**
 * Review surface for the Chris-inspired hero. The loader is the site's own plate
 * so the hand-off matches every other route.
 */
export default function HeroLabPage() {
  return (
    <>
      <PageLoader />
      <PageFrame>
        <ChrisHero />
        <div id="intro">
          <IntroSection />
        </div>
        <SelectedWork />
      </PageFrame>
    </>
  );
}
