"use client";

import { useEffect, useState } from "react";

import { getLenis } from "@/features/scroll/lenis-store";

/**
 * Back-to-top. Hidden at the top of the page; once the reader is ~600px down it
 * fades and slides in (bottom-left), and a click eases the page back to the top
 * through Lenis when it owns the scroll, or native smooth scroll otherwise.
 */
const SHOW_AFTER = 600;

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let scheduled = 0;
    const measure = () => {
      scheduled = 0;
      setVisible(window.scrollY > SHOW_AFTER);
    };
    const onScroll = () => {
      if (scheduled) return;
      scheduled = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scheduled) cancelAnimationFrame(scheduled);
    };
  }, []);

  const toTop = () => {
    const lenis = getLenis();
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (lenis && !reduced) {
      lenis.scrollTo(0, { duration: 1.4 });
    } else {
      window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    }
  };

  return (
    <button
      type="button"
      className="back-to-top"
      data-visible={visible ? "true" : "false"}
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? 0 : -1}
      aria-label="Back to top"
      onClick={toTop}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <path
          d="M12 19V5M6 11l6-6 6 6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}