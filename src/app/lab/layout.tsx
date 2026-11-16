import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./lab.css";

/**
 * Prototype routes. They are intentionally unlinked from the site chrome and
 * never indexed: this is the review surface for Phase 0, not a public page.
 */
export const metadata: Metadata = {
  title: "Lab — prototypes",
  robots: { index: false, follow: false },
};

export default function LabLayout({ children }: { children: ReactNode }) {
  return <div data-lab>{children}</div>;
}
