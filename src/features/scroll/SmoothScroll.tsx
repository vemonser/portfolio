"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis owns the scroll. GSAP's ticker drives its frame loop and ScrollTrigger
 * reads its position, so both motion systems share one clock instead of
 * fighting over scroll events. Reduced motion opts out entirely and keeps the
 * platform's native scrolling.
 */
export default function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;

    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // The menu is a native modal; while it is open the page behind must not
    // scroll, so Lenis stops rather than fighting the scroll lock.
    const unsubscribeMenu = subscribeMenu((open) => {
      if (open) lenis.stop();
      else lenis.start();
    });
    if (isMenuOpen()) lenis.stop();

    return () => {
      unsubscribeMenu();
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // A new page starts at the top; Lenis owns the position, so ask it directly.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
