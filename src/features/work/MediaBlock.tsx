import Image from "next/image";

import type { ProjectMediaBlock } from "@/content/projects/types";
import ImageReveal from "@/features/ui/ImageReveal";
import TextReveal from "@/features/ui/TextReveal";
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
   * The case-study hero runs to the viewport edges; every other block uses the
   * one content width. Both are 16:10.
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
    <figcaption className="mt-[var(--space-1)] max-w-[60ch] text-small leading-[1.6] text-warm">
      <TextReveal as="span" className="block">
        {children}
      </TextReveal>
    </figcaption>
  );
}

/**
 * One block of the case-study stream.
 *
 * There are two widths, and only two: the hero is full-bleed, everything else
 * shares the page's content container. Browser captures and recordings use the
 * same 16:10 frame and the same overflow clip, so a mockup can never spill past
 * its chrome or crop differently from its neighbours.
 */
export default function MediaBlock({
  block,
  title,
  url,
  priority = false,
  bleed = false,
  className,
}: Props) {
  const width = bleed ? "case-media--bleed" : "case-media--contained";

  if (block.kind === "phones") {
    return (
      <figure className={`${width} ${className ?? ""}`}>
        <PhoneTrio srcs={block.srcs} alts={block.alts} />
        <Caption>{block.caption}</Caption>
      </figure>
    );
  }

  return (
    <figure className={`${width} ${className ?? ""}`}>
      <BrowserFrame address={hostname(url)}>
        <span className={`relative block overflow-hidden ${COVER_ASPECT}`}>
          {block.kind === "video" ? (
            <ProjectVideo
              src={block.src}
              poster={block.poster}
              label={`${title} — scroll-through recording`}
              className="absolute inset-0 block h-full w-full object-cover"
            />
          ) : (
            <ImageReveal
              frameClassName={COVER_ASPECT}
              className="relative block"
            >
              <Parallax className="absolute inset-0">
                <Image
                  src={block.src}
                  alt={block.alt}
                  fill
                  loading={priority ? "eager" : "lazy"}
                  quality={90}
                  sizes="100vw"
                  className="object-cover object-top"
                />
              </Parallax>
            </ImageReveal>
          )}
        </span>
      </BrowserFrame>
      <Caption>{block.caption}</Caption>
    </figure>
  );
}
