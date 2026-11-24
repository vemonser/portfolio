import {
  AbsoluteFill,
  OffthreadVideo,
  staticFile,
} from "remotion";
import type { CalculateMetadataFunction } from "remotion";

import { BrowserFrame } from "./components/BrowserFrame";
import { ErrorCard } from "./components/ErrorCard";
import { ShowcaseFonts } from "./components/Fonts";
import {
  SCROLL_LAYOUT,
  getDisplayUrl,
  getProject,
  getScroll,
} from "./data";

export type DesktopLiveProps = {
  slug: string;
  routeKey: string;
};

export const desktopLiveMetadata: CalculateMetadataFunction<
  DesktopLiveProps
> = ({ props }) => {
  const scroll = getScroll(props.slug, props.routeKey);
  return {
    durationInFrames: scroll
      ? Math.max(1, Math.round(scroll.duration * 30))
      : 90,
  };
};

/**
 * A real scroll, not a camera over a still. The site's own on-view animations
 * play because the page is actually moving. The Mac chrome is flush with the
 * composition: no backdrop, no outer frame.
 */
export function DesktopLive({ slug, routeKey }: DesktopLiveProps) {
  const project = getProject(slug);
  const scroll = getScroll(slug, routeKey);

  if (!project || !scroll) {
    return (
      <ErrorCard
        title="Scroll recording missing"
        detail={`Run: npm run capture -- ${slug}`}
      />
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0a" }}>
      <ShowcaseFonts />
      <BrowserFrame
        address={getDisplayUrl(slug, routeKey)}
        width={SCROLL_LAYOUT.width}
        contentHeight={SCROLL_LAYOUT.contentHeight}
        flush
      >
        <OffthreadVideo
          src={staticFile(scroll.src)}
          muted
          style={{
            width: SCROLL_LAYOUT.width,
            height: SCROLL_LAYOUT.contentHeight,
            display: "block",
          }}
        />
      </BrowserFrame>
    </AbsoluteFill>
  );
}
