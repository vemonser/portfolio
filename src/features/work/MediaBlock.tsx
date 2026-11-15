import Image from "next/image";

import type { ProjectMediaBlock } from "@/content/projects/types";
import Parallax from "@/features/ui/Parallax";

import BrowserFrame from "./BrowserFrame";
import PhoneTrio from "./PhoneTrio";
import ProjectVideo from "./ProjectVideo";
import { COVER_ASPECT } from "./cover";

type Props = {
  block: ProjectMediaBlock;
  title: string;
  /** Live site, when there is one; its hostname labels the browser chrome. */
  url?: string;
  priority?: boolean;
  /**
   * The case-study hero is full-bleed; the rest of the stream sits in one
   * frame (max 80rem) so captures are never upscaled past their source.
   */
  bleed?: boolean;
  className?: string;
};

function hostname(url?: string): string {
  if (!url) return "";
  return new URL(url).hostname.replace(/^www\./, "");
}

function Caption({ children }: { children?: string }) {
  if (!children) return null;

  return (
    <figcaption className="mt-[var(--space-1)] max-w-[58ch] text-t-14 leading-[1.6] text-warm">
      {children}
    </figcaption>
  );
}

/**
 * One block of the case-study stream. Presentation follows the block kind:
 * browser captures sit in chrome, the recording plays inside the same chrome,
 * and the phone trio stands on its own. Every block uses one cover ratio so a
 * capture is never cropped by its frame; the recording is capped at its own
 * source width so it is never upscaled.
 */
export default function MediaBlock({
  block,
  title,
  url,
  priority = false,
  bleed = false,
  className,
}: Props) {
  const width = bleed ? "" : "mx-auto w-full max-w-[80rem]";

  if (block.kind === "phones") {
    return (
      <figure className={`m-0 ${className ?? ""}`}>
        <div className={width}>
          <PhoneTrio srcs={block.srcs} alts={block.alts} />
        </div>
        <Caption>{block.caption}</Caption>
      </figure>
    );
  }

  if (block.kind === "video") {
    return (
      <figure className={`m-0 ${className ?? ""}`}>
        <div className="mx-auto w-full max-w-[80rem]">
          <BrowserFrame address={hostname(url)}>
            <ProjectVideo
              src={block.src}
              poster={block.poster}
              label={`${title} — scroll-through recording`}
              className={`block ${COVER_ASPECT} w-full`}
            />
          </BrowserFrame>
        </div>
        <Caption>{block.caption}</Caption>
      </figure>
    );
  }

  return (
    <figure className={`m-0 ${className ?? ""}`}>
      <div className={width}>
        <BrowserFrame address={hostname(url)}>
          <Parallax>
            <span className={`relative block ${COVER_ASPECT}`}>
              <Image
                src={block.src}
                alt={block.alt}
                fill
                loading={priority ? "eager" : "lazy"}
                quality={90}
                sizes="100vw"
                className="object-cover object-top"
              />
            </span>
          </Parallax>
        </BrowserFrame>
      </div>
      <Caption>{block.caption}</Caption>
    </figure>
  );
}
