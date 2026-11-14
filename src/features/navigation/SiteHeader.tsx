"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

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
  };
};

/**
 * The header is absolute, not fixed: it belongs to the top of the page and
 * scrolls away with it, so the hero keeps the whole first screen. Past 30% of
 * the viewport the circular trigger takes over — it is fixed, so the menu is
 * always one click away from there on.
 */
export default function SiteHeader({
  brand,
  homeHref,
  links,
  labels,
}: Props) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const currentPath = pathname ?? homeHref;
  const headerLinks = buildHeaderLinks(links);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      setRevealed(window.scrollY > window.innerHeight * 0.3);
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
        data-visible={revealed || open ? "true" : "false"}
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
        }}
        returnFocusRef={triggerRef}
      />
    </>
  );
}
