"use client";

import { useEffect, useRef, useState } from "react";

import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";

import "./cursor.css";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

type CursorRole = "default" | "link" | "view" | "play" | "text" | "disabled";

const LABELS: Partial<Record<CursorRole, string>> = {
  view: "View",
  play: "Play",
};

/**
 * A custom cursor that replaces the native one on fine pointers.
 *
 * The native pointer disappears only after this component mounts and sets
 * `html[data-cursor="on"]`; a no-JS visitor keeps the OS cursor. Touch devices
 * never mount it. The two nodes are moved in one rAF loop from a ref — no
 * React state per pointermove — and every role is opt-in through
 * `data-cursor="view|play|text|disabled"` or a normal link/button.
 *
 * Text entry is the one exception: the custom nodes hide and the control gets
 * `cursor: text`, so the OS I-beam is exact.
 */
export default function Cursor() {
  const layerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
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
    const ring = ringRef.current;
    const label = labelRef.current;
    const layer = layerRef.current;
    if (!dot || !ring || !label || !layer) return;

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
    let ringX = -100;
    let ringY = -100;
    let hasPosition = false;
    let frame = 0;
    let role: CursorRole = "default";
    let downTimer = 0;

    const setRole = (next: CursorRole) => {
      if (next === role) return;
      role = next;
      html.dataset.cursorState = next;
      label.textContent = LABELS[next] ?? "";
    };

    const roleAt = (node: Element): CursorRole => {
      // An unavailable control tells the truth before any decorative role.
      if (node.closest(":disabled, [aria-disabled='true']")) return "disabled";

      const tagged = node.closest<HTMLElement>("[data-cursor]:not(html)");
      if (tagged) {
        const explicit = tagged.dataset.cursor;
        if (explicit === "view" || explicit === "play") return explicit;
        if (explicit === "text") return "text";
        if (explicit === "disabled") return "disabled";
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

    const tick = () => {
      frame = 0;
      if (!hasPosition) return;
      if (html.dataset.cursor === "off") return;
      if (html.dataset.cursorMenu === "native") return;

      const ease = reduced.matches ? 1 : 0.24;
      ringX += (targetX - ringX) * ease;
      ringY += (targetY - ringY) * ease;

      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) scale(var(--cursor-scale, 1))`;

      if (
        Math.abs(targetX - ringX) > 0.15 ||
        Math.abs(targetY - ringY) > 0.15
      ) {
        frame = requestAnimationFrame(tick);
      }
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(tick);
    };

    const show = () => {
      html.dataset.cursorVisible = "true";
    };

    const hide = () => {
      html.dataset.cursorVisible = "false";
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!hasPosition) {
        ringX = targetX;
        ringY = targetY;
        hasPosition = true;
      }
      show();
      schedule();
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

    const onLeave = () => hide();
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
      if (supportsPopover) {
        try {
          layer.hidePopover();
        } catch {
          // Already hidden on teardown.
        }
      }
      window.clearTimeout(downTimer);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(roleFrame);
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
      <div ref={dotRef} className="cursor-dot" aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true">
        <span ref={labelRef} className="cursor-label" />
      </div>
    </div>
  );
}
