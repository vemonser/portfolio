"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Client-side route changes keep focus in the old header control. Move it to
 * the new main landmark and announce the document title, without stealing
 * focus on the initial page load.
 */
export default function RouteFocus() {
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const liveRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname === initialPath.current) return;
    initialPath.current = pathname;

    const frame = requestAnimationFrame(() => {
      document.getElementById("main-content")?.focus({ preventScroll: true });
      if (liveRef.current) {
        liveRef.current.textContent =
          document.querySelector("main h1")?.getAttribute("aria-label") ||
          document.querySelector("main h1")?.textContent?.trim() ||
          document.title;
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <div
      ref={liveRef}
      className="sr-only"
      aria-live="polite"
      aria-atomic="true"
    />
  );
}
