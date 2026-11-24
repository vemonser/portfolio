"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";

import "./cursor.css";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

type CursorRole = "default" | "link" | "view" | "play" | "hello" | "visit" | "text" | "disabled";

/**
 * A custom cursor that replaces the native one on fine pointers.
 *
 * The native pointer disappears only after this component mounts and sets
 * `html[data-cursor="on"]`; a no-JS visitor keeps the OS cursor. Touch devices
 * never mount it. One dot tracks the pointer exactly — no React state per
 * pointermove — and every role is opt-in through
 * `data-cursor="view|play|text|disabled"` or a normal link/button.
 *
 * The dot inverts whatever sits behind it, so it stays legible on the black
 * page, a light capture and the lime accent without ever painting a filled disc
 * over the content underneath. Text entry is the one exception: the dot hides
 * and the control gets `cursor: text`, so the OS I-beam is exact.
 */
export default function Cursor() {
  const layerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);

  // The nodes are not rendered at all on touch/coarse pointers or without JS.
  useEffect(() => {
    const media = window.matchMedia(FINE_POINTER);
    const sync = () => setEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const dot = dotRef.current;
    const layer = layerRef.current;
    if (!dot || !layer) return;

    const html = document.documentElement;
    const reduced = window.matchMedia(REDUCED);
    const supportsPopover = typeof layer.showPopover === "function";

    // The cursor lives in the top layer so a modal <dialog> cannot paint over
    // it. A manual popover keeps the two nodes above the menu without a second
    // copy; browsers without Popover fall back to the native cursor while the
    // menu is open.
    if (supportsPopover) {
      try {
        layer.showPopover();
      } catch {
        // A popover that is already open is fine; the menu handler re-shows.
      }
    }

    html.dataset.cursor = "on";
    html.dataset.cursorState = "default";
    html.dataset.cursorVisible = "false";

    let targetX = -100;
    let targetY = -100;
    let hasPosition = false;
    let role: CursorRole = "default";
    let downTimer = 0;

    /*
     * One dot, moved exactly with the pointer. GSAP writes the transform on the
     * compositor; size and colour state live in CSS so a role change never
     * forces a React render.
     */
    gsap.set(dot, { xPercent: -50, yPercent: -50 });

    const setRole = (next: CursorRole) => {
      if (next === role) return;
      role = next;
      html.dataset.cursorState = next;
    };

    const roleAt = (node: Element): CursorRole => {
      // An unavailable control tells the truth before any decorative role.
      if (node.closest(":disabled, [aria-disabled='true']")) return "disabled";

      const tagged = node.closest<HTMLElement>("[data-cursor]:not(html)");
      if (tagged) {
        const explicit = tagged.dataset.cursor;
        if (explicit === "view" || explicit === "play") return explicit;
        if (explicit === "hello") return "hello";
        if (explicit === "visit") return "visit";
        if (explicit === "text") return "text";
        if (explicit === "disabled") return "disabled";
      }

      // External links and mailto/tel get their own cursor labels.
      const anchor = node.closest<HTMLAnchorElement>("a[href]");
      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        if (href.startsWith("mailto:") || href.startsWith("tel:")) return "hello";
        if (anchor.target === "_blank") return "visit";
      }

      if (node.closest("textarea, select, [contenteditable='true']")) {
        return "text";
      }

      const input = node.closest("input");
      if (input) {
        const type = (input as HTMLInputElement).type;
        if (
          type === "range" ||
          type === "checkbox" ||
          type === "radio" ||
          type === "file" ||
          type === "color"
        ) {
          return "link";
        }
        return "text";
      }

      if (node.closest("a, button, [role='button'], label[for]")) return "link";
      return "default";
    };

    let roleFrame = 0;

    /*
     * The pointer can stay still while the page moves under it: Lenis scrolls,
     * the menu opens, the window resizes. Re-run the hit test at the stored
     * viewport point in a rAF so "View"/"Play" cannot outlive the element that
     * owned it.
     */
    const refreshRole = () => {
      roleFrame = 0;
      if (!hasPosition) return;
      if (html.dataset.cursor !== "on") return;

      const outOfBounds =
        targetX < 0 ||
        targetY < 0 ||
        targetX >= window.innerWidth ||
        targetY >= window.innerHeight;

      if (outOfBounds) {
        // A window shrink can leave the stored point outside the viewport; a
        // missing hit is not a reason to keep showing "View".
        setRole("default");
        return;
      }

      if (html.dataset.cursorVisible !== "true") return;

      const node = document.elementFromPoint(targetX, targetY);
      setRole(node ? roleAt(node) : "default");
    };

    const scheduleRole = () => {
      if (roleFrame === 0) roleFrame = requestAnimationFrame(refreshRole);
    };

    const unsubscribeMenu = subscribeMenu((menuOpen) => {
      // A modal <dialog> sits in the top layer; showing the cursor popover
      // again after the menu is open puts the cursor above the panel.
      if (menuOpen && supportsPopover) {
        try {
          layer.hidePopover();
        } catch {
          // Not open yet; the show below is still correct.
        }
        try {
          layer.showPopover();
        } catch {
          // Popover unsupported despite the method check; native fallback.
        }
      }

      if (!supportsPopover) {
        html.dataset.cursorMenu = menuOpen ? "native" : "false";
      }

      if (menuOpen) releaseMagnets();
      scheduleRole();
    });

    // The menu can already be open when this effect mounts (a slow hydration
    // or a coarse -> fine media change); synchronise instead of waiting for
    // the next toggle.
    if (isMenuOpen()) {
      if (supportsPopover) {
        try {
          layer.hidePopover();
        } catch {
          // Not shown yet.
        }
        try {
          layer.showPopover();
        } catch {
          // Fall through to the native fallback below.
        }
      } else {
        html.dataset.cursorMenu = "native";
      }
      scheduleRole();
    }

    const show = () => {
      html.dataset.cursorVisible = "true";
    };

    /*
     * Magnetic targets: the lime disc leans toward the pointer while it is
     * inside roughly one diameter. `translate` is used rather than `transform`
     * so the CTA's own hover scale remains independent.
     */
    const magnetize = (x: number, y: number) => {
      const targets = document.querySelectorAll<HTMLElement>("[data-magnetic]");
      for (const target of targets) {
        const rect = target.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const radius = Math.max(rect.width, 160) * 0.85;
        const dx = x - cx;
        const dy = y - cy;
        const distance = Math.hypot(dx, dy);

        if (distance > radius) {
          target.style.translate = "";
          continue;
        }

        const pull = (1 - distance / radius) * 0.2;
        const limit = 12;
        const tx = Math.max(-limit, Math.min(limit, dx * pull));
        const ty = Math.max(-limit, Math.min(limit, dy * pull));
        target.style.translate = `${tx.toFixed(2)}px ${ty.toFixed(2)}px`;
      }
    };

    const releaseMagnets = () => {
      document
        .querySelectorAll<HTMLElement>("[data-magnetic]")
        .forEach((target) => {
          target.style.translate = "";
        });
    };

    const hide = () => {
      html.dataset.cursorVisible = "false";
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!hasPosition) {
        gsap.set(dot, { x: targetX, y: targetY });
        hasPosition = true;
      }
      show();
      if (!reduced.matches) magnetize(targetX, targetY);
      gsap.set(dot, { x: targetX, y: targetY });
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const node = event.target instanceof Element ? event.target : null;
      if (!node) {
        setRole("default");
        return;
      }
      setRole(roleAt(node));
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      html.dataset.cursorDown = "true";
      window.clearTimeout(downTimer);
      downTimer = window.setTimeout(() => {
        html.dataset.cursorDown = "false";
      }, 120);
    };

    const onLeave = () => {
      releaseMagnets();
      hide();
    };
    const onVisibility = () => {
      if (document.hidden) hide();
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.addEventListener("pointerdown", onDown, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("scroll", scheduleRole, { passive: true });
    window.addEventListener("resize", scheduleRole, { passive: true });

    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("scroll", scheduleRole);
      window.removeEventListener("resize", scheduleRole);
      unsubscribeMenu();
      releaseMagnets();
      if (supportsPopover) {
        try {
          layer.hidePopover();
        } catch {
          // Already hidden on teardown.
        }
      }
      window.clearTimeout(downTimer);
      cancelAnimationFrame(roleFrame);
      gsap.killTweensOf(dot);
      delete html.dataset.cursorMenu;
      delete html.dataset.cursor;
      delete html.dataset.cursorState;
      delete html.dataset.cursorVisible;
      delete html.dataset.cursorDown;
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={layerRef}
      className="cursor-layer"
      popover="manual"
      aria-hidden="true"
    >
      <div ref={dotRef} className="cursor-dot" aria-hidden="true">
        <span className="cursor-dot__disc" />
      </div>
    </div>
  );
}
