"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import type { Social } from "@/content/socials";

import MenuOverlay from "./MenuOverlay";
import { buildHeaderLinks, type NavLink } from "./nav";

type Props = {
  brand: string;
  homeHref: string;
  links: NavLink[];
  labels: {
    open: string;
    close: string;
    navigation: string;
    socials: string;
  };
  socials: Social[];
};

/**
 * The header is absolute, not fixed: it belongs to the top of the page and
 * scrolls away with it, so the hero keeps the whole first screen. Past 30% of
 * the viewport the circular trigger takes over. It steps aside while the page
 * is scrolling down — otherwise it parks on top of project copy — and returns
 * as soon as the visitor scrolls back up.
 */
export default function SiteHeader({
  brand,
  homeHref,
  links,
  labels,
  socials,
}: Props) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [suppressed, setSuppressed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const currentPath = pathname ?? homeHref;
  const headerLinks = buildHeaderLinks(links);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let frame = 0;
    // A page restored mid-scroll counts as downward until the visitor scrolls
    // back up, so the trigger does not land on the copy it just opened.
    let lastY = 0;

    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - lastY;
      const belowHero = y > window.innerHeight * 0.3;

      if (!belowHero) {
        setSuppressed(false);
        lastY = y;
      } else if (Math.abs(delta) > 6) {
        lastY = y;
        setSuppressed(delta > 0);
      }

      // Below 768 the header's inline links are gone, so the trigger is the
      // only navigation and stays available at the top of the page.
      const inlineNav = window.matchMedia("(min-width: 768px)").matches;
      setRevealed(!inlineNav || belowHero);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  return (
    <>
      <header className="site-header">
        <Link href={homeHref} className="site-header__brand">
          {brand}
        </Link>

        <nav aria-label={labels.navigation} className="site-header__nav">
          {headerLinks.map((link) => {
            const active = currentPath === link.href;

            return (
              <Link
                key={link.key}
                href={link.href}
                className="site-header__link link-line"
                aria-current={active ? "page" : undefined}
                data-active={active ? "true" : "false"}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <button
        ref={triggerRef}
        type="button"
        className="menu-trigger"
        data-visible={open || (revealed && !suppressed) ? "true" : "false"}
        aria-expanded={open}
        aria-controls="site-menu"
        aria-label={labels.open}
        onClick={() => setOpen(true)}
      >
        <span className="menu-trigger__bars" aria-hidden="true" />
      </button>

      <MenuOverlay
        open={open}
        onClose={close}
        links={links}
        labels={{
          navigation: labels.navigation,
          close: labels.close,
          socials: labels.socials,
        }}
        socials={socials}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
