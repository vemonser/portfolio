import Image from "next/image";

type Props = {
  srcs: string[];
  alts: string[];
  className?: string;
};

/**
 * Three phone screens. The bezel is CSS, the notch is a cut-out span, and the
 * middle screen lifts on large viewports so the group reads as a stack rather
 * than a strip.
 */
export default function PhoneTrio({ srcs, alts, className }: Props) {
  return (
    <div
      className={`phone-trio flex flex-wrap items-end justify-center gap-[var(--space-2)] ${
        className ?? ""
      }`}
    >
      {srcs.map((src, i) => (
        <div
          key={src}
          className={`relative aspect-[9/19.5] w-[clamp(5.5rem,26vw,14rem)] rounded-[2.4rem] border border-[var(--line-strong)] bg-[var(--surface-raised)] ${
            i === 1 ? "lg:-translate-y-10" : ""
          }`}
        >
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-[0.55rem] z-[1] h-[1.1rem] w-[4.5rem] -translate-x-1/2 rounded-full bg-[var(--color-black)]"
          />
          <span className="absolute inset-[0.3rem] block overflow-hidden rounded-[2.1rem]">
            <Image
              src={src}
              alt={alts[i]}
              fill
              sizes="(min-width: 1024px) 22vw, 32vw"
              className="object-cover object-top"
            />
          </span>
        </div>
      ))}
    </div>
  );
}
