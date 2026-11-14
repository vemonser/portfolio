import { formatNumber } from "./editorial";

type SkillGroup = { title: string; body: string };

type Props = {
  groups: ReadonlyArray<SkillGroup>;
  label: string;
};

/**
 * The capability matrix: rows and rules, never rounded cards. Two columns, and
 * the last row spans the break so the grid is deliberately interrupted rather
 * than tiled.
 */
export default function SkillMatrix({ groups, label }: Props) {
  return (
    <section
      aria-labelledby="capabilities-title"
      data-section="capabilities"
      className="border-t border-[var(--line-hairline)] pt-[var(--space-3)]"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-[var(--space-3)]">
        <h2
          id="capabilities-title"
          className="m-0 font-display text-[clamp(1.8rem,3.6vw,3rem)] font-semibold uppercase leading-[1.05] tracking-[-0.015em]"
        >
          {label}
        </h2>

        <span className="font-label text-t-14 uppercase tracking-[var(--track)] text-warm">
          {formatNumber(groups.length, { pad: 2 })}
        </span>
      </div>

      <ul className="m-0 mt-[var(--space-5)] grid list-none gap-0 p-0 md:grid-cols-2 md:gap-x-[var(--space-6)]">
        {groups.map((group, index) => (
          <li
            key={group.title}
            className={`border-t border-[var(--line-hairline)] py-[var(--space-3)] ${
              index === groups.length - 1 ? "md:col-span-2" : ""
            }`}
          >
            <div className="flex items-baseline gap-[var(--space-2)]">
              <span className="font-label text-t-14 tracking-[var(--track)] text-lime">
                {formatNumber(index + 1, { pad: 2 })}
              </span>
              <h3 className="m-0 font-display text-[clamp(1.15rem,2vw,1.6rem)] font-semibold tracking-[-0.02em]">
                {group.title}
              </h3>
            </div>

            <p className="m-0 mt-[var(--space-1)] max-w-[42ch] leading-[1.7] text-bone/60">
              {group.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
