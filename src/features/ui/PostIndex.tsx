import Link from "next/link";

import type { BlogPost } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";
import { localizedHref } from "@/features/navigation/nav";

import { formatNumber, type Locale } from "./editorial";
import Reveal from "./Reveal";

type Props = {
  locale: Locale;
  posts: BlogPost[];
  /** Localized empty state, printed when the archive has no posts. */
  empty: string;
};

/**
 * The blog archive as an editorial index: a numbered column of dates, then the
 * title and excerpt at reading width. The whole row is one link — the title is
 * stretched over the row rather than repeating a "read more" affordance.
 *
 * The existing order (newest first) and localized copy are preserved.
 */
export default function PostIndex({ locale, posts, empty }: Props) {
  if (posts.length === 0) {
    return (
      <p className="m-0 max-w-[46ch] text-[clamp(1.05rem,1.5vw,1.25rem)] leading-[1.7] text-bone/60 ar:leading-[1.9]">
        {empty}
      </p>
    );
  }

  return (
    <ol className="m-0 list-none border-t border-[var(--line-hairline)] p-0">
      {posts.map((post, index) => (
        <Reveal as="li" key={post.slug} delay={index * 60}>
          <div className="group relative grid gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-4)] md:grid-cols-[7rem_minmax(0,1fr)] md:gap-x-[var(--space-5)]">
            <div className="flex items-baseline gap-[var(--space-2)] font-label text-t-14 uppercase tracking-[var(--track)] text-warm md:flex-col md:items-start ar:text-t-16 ar:normal-case ar:tracking-normal">
              <span className="text-lime">
                {formatNumber(index + 1, locale, { pad: 2 })}
              </span>
              <time dateTime={post.date} className="whitespace-nowrap">
                {formatPostDate(post.date, locale)}
              </time>
            </div>

            <div className="flex flex-col gap-[0.6rem]">
              <h2 className="m-0">
                <Link
                  href={localizedHref(locale, `/blog/${post.slug}`)}
                  className="font-display text-[clamp(1.55rem,3.2vw,2.6rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-bone no-underline transition-colors duration-[var(--dur-base)] after:absolute after:inset-0 after:content-[''] group-hover:text-lime group-focus-within:text-lime ar:leading-[1.4] ar:tracking-normal"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="m-0 max-w-[54ch] text-[clamp(0.98rem,1.2vw,1.1rem)] leading-[1.7] text-bone/60 ar:leading-[1.9]">
                {post.excerpt}
              </p>
            </div>
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
