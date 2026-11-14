"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The closing contact chapter belongs to every route except Contact itself,
 * where it would repeat the page's own email, phone and headline. The check
 * lives here rather than in the layout because only the client knows the
 * current pathname.
 */
export default function ContactChapter({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isContactRoute = pathname?.replace(/\/$/, "").endsWith("/contact");

  if (isContactRoute) return null;

  return <>{children}</>;
}
