"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";

import type { Social } from "@/content/socials";

import LinkLine from "@/features/ui/LinkLine";

import BurgerIcon from "./BurgerIcon";
import { burgerMotion } from "./burger-frames";
import { setMenuOpen } from "./menu-store";
import type { NavLink } from "./nav";

type Phase = "closed" | "entering" | "open" | "closing";

/* The reference menu's curve, measured on dennissnellenberg.com. */
const NAV_EASE = gsap.parseEase("cubic-bezier(0.7, 0, 0.2, 1)") ?? "power4.inOut";

type Props = {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  labels: {
    navigation: string;
    close: string;
    socials: string;
  };
  socials: Social[];
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export default function MenuOverlay({
  open,
  onClose,
  links,
  labels,
  socials,
  returnFocusRef,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousPath = useRef<string | null>(null);
  const scrollRestore = useRef<{
    overflow: string;
    padding: string;
    comp: string;
  } | null>(null);
  const [phase, setPhase] = useState<Phase>("closed");
  const pathname = usePathname();
  const currentPath = pathname ?? "/";

  /*
   * Scroll stays locked until the panel has finished leaving, not until the
   * close is requested: unlocking early brings the scrollbar back and shifts
   * every fixed element by its width while the panel is still moving.
   */
  const locked = phase !== "closed";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const panel = dialog.querySelector<HTMLElement>(".nav-panel");
    const lip = dialog.querySelector<HTMLElement>(".nav-lip");
    const items = Array.from(
      dialog.querySelectorAll<HTMLElement>(".nav-item"),
    );
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (open) {
      if (!dialog.open) {
        setPhase("entering");
        dialog.showModal();
        closeRef.current?.focus();
      }

      // GSAP drives the panel slide, the curved lip collapse, and the item
      // stagger (same engine as the page loader and route transition).
      if (!reduced) {
        if (panel) {
          gsap.to(panel, {
            xPercent: 0,
            x: 0,
            duration: 0.8,
            ease: NAV_EASE,
          });
        }
        if (lip) {
          gsap.to(lip, { width: 0, duration: 0.85, ease: NAV_EASE });
        }
        if (items.length) {
          gsap.to(items, {
            x: 0,
            duration: 0.8,
            stagger: 0.03,
            ease: NAV_EASE,
          });
        }
      }

      // One frame with the closed styles applied is what gives the browser a
      // start value to transition from.
      const frame = requestAnimationFrame(() => setPhase("open"));

      return () => cancelAnimationFrame(frame);
    }

    if (!dialog.open) return;

    setPhase("closing");

    const finish = () => {
      dialog.close();
      setPhase("closed");
      returnFocusRef.current?.focus({ preventScroll: true });
    };

    if (reduced) {
      finish();
      return;
    }

    const tl = gsap.timeline({ onComplete: finish });
    if (panel) {
      tl.to(
        panel,
        {
          xPercent: 100,
          x: () => window.innerWidth * 0.09,
          duration: 0.8,
          ease: NAV_EASE,
        },
        0,
      );
    }
    if (lip) {
      tl.to(lip, { width: "6vw", duration: 0.85, ease: NAV_EASE }, 0);
    }
    if (items.length) {
      tl.to(
        items,
        {
          x: () => window.innerWidth * 0.15,
          duration: 0.8,
          stagger: 0.03,
          ease: NAV_EASE,
        },
        0,
      );
    }

    return () => {
      tl.kill();
    };
  }, [open, returnFocusRef]);

  useEffect(() => {
    if (!locked) return;

    const root = document.documentElement;

    // Captured once per open: a re-run must not treat our own compensation as
    // the original value.
    scrollRestore.current ??= {
      overflow: root.style.overflow,
      padding: root.style.paddingInlineEnd,
      comp: root.style.getPropertyValue("--scrollbar-comp"),
    };

    const scrollbar = window.innerWidth - root.clientWidth;

    root.style.overflow = "hidden";
    if (scrollbar > 0) {
      root.style.paddingInlineEnd = `${scrollbar}px`;
      // Fixed elements ignore the html padding, so they get the same offset
      // through a variable instead of jumping when the bar disappears.
      root.style.setProperty("--scrollbar-comp", `${scrollbar}px`);
    }

    return () => {
      const saved = scrollRestore.current;
      if (!saved) return;

      root.style.overflow = saved.overflow;
      root.style.paddingInlineEnd = saved.padding;
      root.style.setProperty("--scrollbar-comp", saved.comp);
      scrollRestore.current = null;
    };
  }, [locked]);

  useEffect(() => {
    setMenuOpen(locked);

    return () => setMenuOpen(false);
  }, [locked]);

  // Back/forward while the panel is open should not leave it hanging over a
  // different page.
  useEffect(() => {
    if (previousPath.current === null) {
      previousPath.current = pathname;
      return;
    }

    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      if (open) onClose();
    }
  }, [pathname, open, onClose]);

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  /*
   * Native modals make the page inert and keep focus in the dialog, but Tab
   * past the last control still leaves for the browser chrome. Wrapping inside
   * the dialog is the behaviour keyboard users expect from a menu.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusable = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]',
      ),
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="site-menu"
      className="nav-dialog"
      data-state={phase}
      aria-label={labels.navigation}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <button
        ref={closeRef}
        type="button"
        className="nav-close"
        onClick={onClose}
        aria-label={labels.close}
      >
        <BurgerIcon
          motion={burgerMotion(phase)}
          fallback={<span className="nav-close__bars" aria-hidden="true" />}
        />
      </button>

      <div className="nav-panel">
        <div className="nav-lip" aria-hidden="true" />

        <div className="nav-panel__inner" data-lenis-prevent>
          <div>
            <p className="ui-label">{labels.navigation}</p>
            <hr className="nav-rule" />

            <ul className="nav-list">
              {links.map((link) => {
                const active = currentPath === link.href;

                return (
                  <li className="nav-item" key={link.key}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      data-active={active ? "true" : "false"}
                      transitionTypes={["nav-forward"]}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {socials.length > 0 ? (
            <nav
              aria-label={labels.socials}
              className="flex flex-col gap-[var(--space-2)]"
            >
              <p className="ui-label m-0">{labels.socials}</p>
              <ul className="m-0 flex list-none flex-wrap gap-x-[var(--space-4)] gap-y-0 p-0">
                {socials.map((social) => (
                  <li key={social.key} className="flex">
                    <LinkLine
                      href={social.href}
                      external
                      className="inline-flex min-h-11 items-center text-t-16"
                    >
                      {social.label}
                    </LinkLine>
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
