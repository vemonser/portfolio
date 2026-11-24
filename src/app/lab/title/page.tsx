import { Instrument_Serif } from "next/font/google";

import IntroSection from "@/features/intro/IntroSection";
import TitleHero from "@/features/lab/TitleHero";
import PageFrame from "@/features/ui/PageFrame";
import SelectedWork from "@/features/work/SelectedWork";

const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

export const metadata = {
  title: "Lab — Title card",
  robots: { index: false, follow: false },
};

/**
 * Review surface for the title-card hero. The serif is scoped to this page:
 * the monogram is the only place it appears. The wrapper asks Lenis for the
 * Noho-length glide without changing the rest of the site.
 */
export default function TitleLabPage() {
  return (
    <div className={serif.variable} data-scroll-profile="noho">
      <PageFrame>
        <TitleHero />
        <IntroSection />
        <SelectedWork />
      </PageFrame>
    </div>
  );
}
