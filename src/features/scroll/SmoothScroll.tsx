"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";
import { setLenis } from "@/features/scroll/lenis-store";

gsap.registerPlugin(ScrollTrigger);

type ScrollProfile = "soft" | "current" | "glide" | "noho";

const easeOutExpo = (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t));

/**
 * `soft` is the continuous lerp that gives the page the Noho glide; `current`
 * is the previous duration-based feel, and `glide` is the slower end of the
 * range. The query switch is a prototype seam: once the direction is chosen,
 * the winning profile becomes the only option and this map goes away.
 */
function scrollMotion(profile: ScrollProfile): {
  lerp?: number;
  duration?: number;
  easing?: (t: number) => number;
} {
  if (profile === "current") {
    return { duration: 1.15, easing: easeOutExpo };
  }

  if (profile === "glide") {
    return { duration: 2.2, easing: easeOutExpo };
  }

  // Noho's page instance: duration 3 with the same exponential ease.
  if (profile === "noho") {
    return { duration: 3, easing: easeOutExpo };
  }

  return { lerp: 0.1 };
}

function requestedProfile(): ScrollProfile {
  const value = new URLSearchParams(window.location.search).get("scroll");
  if (
    value === "current" ||
    value === "glide" ||
    value === "soft" ||
    value === "noho"
  ) {
    return value;
  }

  const local = document.querySelector<HTMLElement>("[data-scroll-profile]")
    ?.dataset.scrollProfile;

  if (
    local === "current" ||
    local === "glide" ||
    local === "soft" ||
    local === "noho"
  ) {
    return local;
  }

  return "noho";
}

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
      ...scrollMotion(requestedProfile()),
      smoothWheel: true,
      syncTouch: false,
    });
    lenisRef.current = lenis;
    setLenis(lenis);

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
      setLenis(null);
    };
  }, []);

  // A new page starts at the top; Lenis owns the position, so ask it directly.
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true });
  }, [pathname]);

  return null;
}
