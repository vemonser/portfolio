import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Reading measure for MDX and argument copy. It wraps the content in an
 * <article> and styles elements that MDX emits — it never rewrites them, so
 * headings, links and lists keep their semantics.
 */
export default function Prose({ children, className }: Props) {
  const classes = className
    ? `prose-blog prose-editorial ${className}`
    : "prose-blog prose-editorial";

  return <article className={classes}>{children}</article>;
}
