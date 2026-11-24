import Link from "next/link";

import type { BlogPost } from "@/content/blog/posts";
import { formatPostDate } from "@/features/blog/format";

import TextReveal from "./TextReveal";
import { formatNumber } from "./editorial";

type Props = {
  posts: BlogPost[];
  /** Localized empty state, printed when the archive has no posts. */
  empty: string;
};

/**
 * The blog archive as an editorial index: a numbered column of dates, then the
 * title and excerpt at reading width. The whole row is one link — the title is
 * stretched over the row rather than repeating a "read more" affordance.
 *
 * The existing order (newest first) and copy are preserved.
 */
export default function PostIndex({ posts, empty }: Props) {
  if (posts.length === 0) {
    return (
      <TextReveal
        as="p"
        className="m-0 max-w-[46ch] text-lede leading-[1.7] text-fg-muted"
      >
        {empty}
      </TextReveal>
    );
  }

  return (
    <ol className="m-0 list-none border-t border-[var(--line-hairline)] p-0">
      {posts.map((post, index) => (
        <li key={post.slug}>
          <div className="group relative grid gap-[var(--space-2)] border-b border-[var(--line-hairline)] py-[var(--space-4)] md:grid-cols-[7rem_minmax(0,1fr)] md:gap-x-[var(--space-5)]">
            <div className="flex items-baseline gap-[var(--space-2)] font-label text-t-14 uppercase tracking-[var(--track)] text-warm md:flex-col md:items-start">
              <span className="text-warm">
                {formatNumber(index + 1, { pad: 2 })}
              </span>
              <time dateTime={post.date} className="whitespace-nowrap">
                {formatPostDate(post.date)}
              </time>
            </div>

            <div className="flex flex-col gap-[0.6rem]">
              <h2 className="m-0">
                <Link
                  href={`/blog/${post.slug}`}
                  className="font-display text-display-3 font-semibold text-bone no-underline transition-colors duration-[var(--dur-base)] after:absolute after:inset-0 after:content-[''] group-hover:text-lime group-focus-within:text-lime"
                  transitionTypes={["nav-forward"]}
                >
                  <TextReveal as="span" split="words">
                    {post.title}
                  </TextReveal>
                </Link>
              </h2>

              <TextReveal
                as="p"
                className="m-0 max-w-[54ch] text-body leading-[1.7] text-fg-muted"
              >
                {post.excerpt}
              </TextReveal>
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
