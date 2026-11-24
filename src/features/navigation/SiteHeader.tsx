"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useCallback, useRef, useState } from "react";

import type { Social } from "@/content/socials";
import { ArrowUpRight } from "@/features/ui/Arrow";

import BurgerIcon from "./BurgerIcon";
import MenuOverlay from "./MenuOverlay";
import { buildHeaderLinks, type NavLink } from "./nav";

gsap.registerPlugin(useGSAP);

type Props = {
  brand: string;
  homeHref: string;
  links: NavLink[];
  ctaLabel: string;
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
  ctaLabel,
  labels,
  socials,
}: Props) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [suppressed, setSuppressed] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const currentPath = pathname ?? homeHref;
  const headerLinks = buildHeaderLinks(links);

  const close = useCallback(() => setOpen(false), []);

  useGSAP(
    () => {
      let pending: gsap.core.Tween | null = null;
      // A page restored mid-scroll counts as downward until the visitor scrolls
      // back up, so the trigger does not land on the copy it just opened.
      let lastY = 0;

      const measure = () => {
        pending = null;
        const y = window.scrollY;
        const delta = y - lastY;
        const belowHero = y > window.innerHeight * 0.3;

        if (!belowHero) {
          setSuppressed(false);
          lastY = y;
        } else if (delta < 0) {
          // Any upward movement returns the trigger, even a slow trackpad nudge.
          lastY = y;
          setSuppressed(false);
        } else if (delta > 6) {
          lastY = y;
          setSuppressed(true);
        }

        // Below 768 the header's inline links are gone, so the trigger is the
        // only navigation and stays available at the top of the page.
        const inlineNav = window.matchMedia("(min-width: 768px)").matches;
        setRevealed(!inlineNav || belowHero);
      };
      const schedule = () => {
        pending?.kill();
        pending = gsap.delayedCall(0, measure);
      };

      measure();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);

      return () => {
        pending?.kill();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
      };
    },
    { scope: headerRef, dependencies: [pathname] },
  );

  return (
    <>
      <header
        ref={headerRef}
        className="site-header"
        data-hero={currentPath === homeHref ? "true" : "false"}
        style={{ viewTransitionName: "site-header" }}
      >
        <Link
          href={homeHref}
          className="site-header__brand"
          transitionTypes={["nav-back"]}
        >
          {brand}
        </Link>

        <div className="site-header__actions">
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
                  transitionTypes={["nav-forward"]}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/contact"
            className="header-cta"
            aria-current={currentPath === "/contact" ? "page" : undefined}
            data-active={currentPath === "/contact" ? "true" : "false"}
            transitionTypes={["nav-forward"]}
          >
            {ctaLabel}
            <ArrowUpRight className="header-cta__arrow" />
          </Link>
        </div>
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
        <BurgerIcon
          motion="rest"
          fallback={<span className="menu-trigger__bars" aria-hidden="true" />}
        />
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
