import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * Every route's single <main>. `lang`/`dir` belong to the document; this only
 * gives the page its frame and a stable class for tests.
 */
export default function PageFrame({ children, className }: Props) {
  const classes = className ? `page-frame ${className}` : "page-frame";

  return <main className={classes}>{children}</main>;
}
