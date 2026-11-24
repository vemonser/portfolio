import Image from "next/image";

import ImageReveal from "@/features/ui/ImageReveal";

type Props = {
  srcs: string[];
  alts: string[];
  className?: string;
};

/**
 * Three phone screens. The bezel is CSS, the notch is a cut-out span, and the
 * middle screen lifts on large viewports so the group reads as a stack rather
 * than a strip. The bezel gets a hairline highlight and one wide, soft shadow —
 * enough to sit on the page, not enough to become a card.
 */
export default function PhoneTrio({ srcs, alts, className }: Props) {
  return (
    <div
      className={`phone-trio flex flex-wrap items-end justify-center gap-[var(--space-3)] ${
        className ?? ""
      }`}
    >
      {srcs.map((src, i) => (
        <div
          key={src}
          className={`relative aspect-[9/19.5] w-[clamp(5.5rem,26vw,14rem)] rounded-[2.6rem] border border-[var(--line-strong)] bg-[#121110] shadow-[0_28px_70px_-36px_rgb(0_0_0_/_1),inset_0_1px_0_rgb(245_241_232_/_0.07)] ${
            i === 1 ? "lg:-translate-y-10" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[0.5rem] z-[1] h-[0.9rem] w-[3.6rem] -translate-x-1/2 rounded-full bg-[var(--color-black)]"
          />
          <span className="absolute inset-[0.28rem] block overflow-hidden rounded-[2.3rem] bg-black">
            <ImageReveal
              className="absolute inset-0"
              frameClassName="h-full w-full"
              scaleFrom={1.08}
            >
              <Image
                src={src}
                alt={alts[i]}
                fill
                quality={90}
                sizes="(min-width: 1024px) 22vw, 32vw"
                className="object-cover object-top"
              />
            </ImageReveal>
          </span>
        </div>
      ))}
    </div>
  );
}
