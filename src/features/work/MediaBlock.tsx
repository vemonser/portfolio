import Image from "next/image";

import type { ProjectMediaBlock } from "@/content/projects/types";
import Parallax from "@/features/ui/Parallax";

import BrowserFrame from "./BrowserFrame";
import PhoneTrio from "./PhoneTrio";
import ProjectVideo from "./ProjectVideo";

type Props = {
  block: ProjectMediaBlock;
  title: string;
  /** Live site, when there is one; its hostname labels the browser chrome. */
  url?: string;
  priority?: boolean;
  className?: string;
};

function hostname(url?: string): string {
  if (!url) return "";
  return new URL(url).hostname.replace(/^www\./, "");
}

/**
 * One block of the case-study stream. Presentation follows the block kind:
 * browser captures sit in chrome, the recording plays inside the same chrome,
 * and the phone trio stands on its own.
 */
export default function MediaBlock({
  block,
  title,
  url,
  priority = false,
  className,
}: Props) {
  if (block.kind === "phones") {
    return (
      <PhoneTrio
        srcs={block.srcs}
        alts={block.alts}
        className={className}
      />
    );
  }

  if (block.kind === "video") {
    return (
      <BrowserFrame address={hostname(url)} className={className}>
        <ProjectVideo
          src={block.src}
          poster={block.poster}
          label={`${title} — scroll-through recording`}
          className="block aspect-[16/10] w-full"
        />
      </BrowserFrame>
    );
  }

  return (
    <BrowserFrame address={hostname(url)} className={className}>
      <Parallax>
        <span className="relative block aspect-[16/10]">
          <Image
            src={block.src}
            alt={block.alt}
            fill
            loading={priority ? "eager" : "lazy"}
            sizes={
              className ? "(min-width: 1024px) 80vw, 100vw" : "100vw"
            }
            className="object-cover object-top"
          />
        </span>
      </Parallax>
    </BrowserFrame>
  );
}
