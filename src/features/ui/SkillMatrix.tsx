import { formatNumber, type Locale } from "./editorial";

type SkillGroup = { title: string; body: string };

type Props = {
  locale: Locale;
  groups: SkillGroup[];
  label: string;
};

/**
 * The capability matrix: rows and rules, never rounded cards. English runs two
 * columns with the last row spanning the break; Arabic runs one longer column
 * and indents a single row instead — the break happens in a different place
 * because the composition is designed for its own reading, not mirrored from
 * the English one.
 */
export default function SkillMatrix({ locale, groups, label }: Props) {
  const arabic = locale === "ar";

  return (
    <section
      aria-labelledby="capabilities-title"
      data-section="capabilities"
      className="border-t border-[var(--line-hairline)] pt-[var(--space-3)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-3)]">
        <h2
          id="capabilities-title"
          className="m-0 font-display text-[clamp(1.8rem,3.6vw,3rem)] font-semibold leading-[1.05] tracking-[-0.03em] en:uppercase en:tracking-[-0.015em] ar:leading-[1.3] ar:tracking-normal"
        >
          {label}
        </h2>

        <span className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm ar:text-t-16 ar:normal-case ar:tracking-normal">
          {formatNumber(groups.length, locale, { pad: 2 })}
        </span>
      </div>

      <ul
        className={`m-0 mt-[var(--space-5)] grid list-none p-0 ${
          arabic
            ? "gap-0"
            : "gap-0 md:grid-cols-2 md:gap-x-[var(--space-6)]"
        }`}
      >
        {groups.map((group, index) => {
          const spans =
            !arabic && index === groups.length - 1
              ? "md:col-span-2"
              : undefined;
          const indents = arabic && index === 1 ? "me-[12%]" : undefined;

          return (
            <li
              key={group.title}
              className={`border-t border-[var(--line-hairline)] py-[var(--space-3)] ${spans ?? ""} ${indents ?? ""}`}
            >
              <div className="flex items-baseline gap-[var(--space-2)]">
                <span className="font-label text-t-14 tracking-[var(--track)] text-lime ar:text-t-16 ar:tracking-normal">
                  {formatNumber(index + 1, locale, { pad: 2 })}
                </span>
                <h3 className="m-0 font-display text-[clamp(1.15rem,2vw,1.6rem)] font-semibold tracking-[-0.02em] ar:leading-[1.4] ar:tracking-normal">
                  {group.title}
                </h3>
              </div>

              <p className="m-0 mt-[var(--space-1)] max-w-[42ch] leading-[1.7] text-bone/60 ar:max-w-[38ch] ar:leading-[1.9]">
                {group.body}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
