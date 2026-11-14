"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
} from "react";

import { routing } from "@/i18n/routing";

import { normalizePath, switchLocalePath } from "./locale-href";
import { setMenuOpen } from "./menu-store";
import type { NavLink } from "./nav";

type Phase = "closed" | "entering" | "open" | "closing";

type Props = {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  labels: {
    navigation: string;
    close: string;
    language: string;
  };
  otherLocale: { code: string; label: string };
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export default function MenuOverlay({
  open,
  onClose,
  links,
  labels,
  otherLocale,
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
  const currentPath = normalizePath(
    pathname ?? `/${routing.defaultLocale}`,
  );

  /*
   * Scroll stays locked until the panel has finished leaving, not until the
   * close is requested: unlocking early brings the scrollbar back and shifts
   * every fixed element by its width while the panel is still moving.
   */
  const locked = phase !== "closed";

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open) {
      if (!dialog.open) {
        setPhase("entering");
        dialog.showModal();
        closeRef.current?.focus();
      }

      // One frame with the closed styles applied is what gives the browser a
      // start value to transition from.
      const frame = requestAnimationFrame(() => setPhase("open"));

      return () => cancelAnimationFrame(frame);
    }

    if (!dialog.open) return;

    setPhase("closing");

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const panel = dialog.querySelector<HTMLElement>(".nav-panel");
    const lip = dialog.querySelector<HTMLElement>(".nav-lip");

    let finished = false;
    let fallbackTimer = 0;
    // The lip's width is the longest transition in the exit (850ms). Waiting
    // for it, rather than a timer, keeps the window exact if a duration
    // changes; the fallback covers an interrupted transition.
    const finish = () => {
      if (finished) return;
      finished = true;
      if (fallbackTimer) window.clearTimeout(fallbackTimer);

      dialog.close();
      setPhase("closed");
      returnFocusRef.current?.focus({ preventScroll: true });
    };

    const onEnd = (event: TransitionEvent) => {
      if (event.target === lip && event.propertyName === "width") {
        finish();
      }
    };

    if (reduced) {
      finish();
      return;
    }

    dialog.addEventListener("transitionend", onEnd);

    // Fallback derived from the real durations: if a transition never fires
    // (interrupted, or zero-length), the dialog still closes.
    const longest = (value: string) =>
      Math.max(...value.split(",").map((part) => parseFloat(part) || 0));
    const durationMs =
      Math.max(
        longest(getComputedStyle(lip ?? dialog).transitionDuration),
        longest(getComputedStyle(panel ?? dialog).transitionDuration),
      ) * 1000;
    fallbackTimer = window.setTimeout(finish, durationMs + 400);

    return () => {
      dialog.removeEventListener("transitionend", onEnd);
      window.clearTimeout(fallbackTimer);
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
        <span className="nav-close__bars" aria-hidden="true" />
      </button>

      <div className="nav-panel">
        <div className="nav-lip" aria-hidden="true" />

        <div className="nav-panel__inner">
          <div>
            <p className="ui-label">{labels.navigation}</p>
            <hr className="nav-rule" />

            <ul className="nav-list">
              {links.map((link) => {
                const active = currentPath === normalizePath(link.href);

                return (
                  <li className="nav-item" key={link.key}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      data-active={active ? "true" : "false"}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="nav-panel__footer">
            <p className="ui-label">{labels.language}</p>
            <Link
              href={switchLocalePath(
                currentPath,
                otherLocale.code,
                routing.locales,
              )}
              lang={otherLocale.code}
              hrefLang={otherLocale.code}
              className="nav-locale"
            >
              {otherLocale.label}
            </Link>
          </div>
        </div>
      </div>
    </dialog>
  );
}
