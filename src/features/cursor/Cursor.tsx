"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";

import "./cursor.css";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

type CursorRole =
  | "default"
  | "link"
  | "view"
  | "play"
  | "hello"
  | "visit"
  | "text"
  | "disabled";

const ROLE_LABELS: Partial<Record<CursorRole, string>> = {
  link: "OPEN",
  view: "VIEW",
  play: "PLAY",
  hello: "HELLO",
  visit: "VISIT",
};

/**
 * The site-wide magnetic cursor. Lime is the default treatment; the cursor lab
 * can opt into Bone without changing the component or its movement.
 *
 * The native pointer disappears only after this component mounts and sets
 * `html[data-cursor="on"]`. Touch devices and no-JS visitors keep the OS
 * pointer, and text entry deliberately restores the I-beam.
 */
export default function Cursor() {
  const layerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(FINE_POINTER);
    const sync = () => setEnabled(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const cursor = cursorRef.current;
    const label = labelRef.current;
    const layer = layerRef.current;
    if (!cursor || !label || !layer) return;

    const html = document.documentElement;
    const reduced = window.matchMedia(REDUCED);
    const supportsPopover = typeof layer.showPopover === "function";

    // A manual popover keeps the cursor above a modal <dialog>. Browsers
    // without Popover fall back to the native pointer while the menu is open.
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

    // Size, colour and role state live in CSS. GSAP owns only the lagging
    // origin, so its transforms never erase the disc's visual transitions.
    gsap.set(cursor, { xPercent: -50, yPercent: -50 });
    gsap.set(cursor, { x: targetX, y: targetY });
    const moveX = gsap.quickTo(cursor, "x", {
      duration: 0.35,
      ease: "expo.out",
    });
    const moveY = gsap.quickTo(cursor, "y", {
      duration: 0.35,
      ease: "expo.out",
    });

    const setRole = (next: CursorRole) => {
      if (next === role) return;
      role = next;
      html.dataset.cursorState = next;
      label.textContent = ROLE_LABELS[next] ?? "";
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

    // The pointer can stay still while Lenis scrolls, the menu opens or the
    // window resizes. Re-run the hit test so a role cannot outlive its target.
    const refreshRole = () => {
      roleFrame = 0;
      if (!hasPosition || html.dataset.cursor !== "on") return;

      const outOfBounds =
        targetX < 0 ||
        targetY < 0 ||
        targetX >= window.innerWidth ||
        targetY >= window.innerHeight;

      if (outOfBounds) {
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

    // Magnetic targets lean toward the pointer. `translate` keeps that motion
    // independent from a target's own hover transform or scale.
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
        gsap.set(cursor, { x: targetX, y: targetY });
        hasPosition = true;
      }
      show();
      if (!reduced.matches) magnetize(targetX, targetY);
      if (reduced.matches) {
        gsap.killTweensOf(cursor);
        gsap.set(cursor, { x: targetX, y: targetY });
      } else {
        moveX(targetX);
        moveY(targetY);
      }
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const node = event.target instanceof Element ? event.target : null;
      setRole(node ? roleAt(node) : "default");
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
      gsap.killTweensOf(cursor);
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
      <div ref={cursorRef} className="cursor-magnetic" aria-hidden="true">
        <span className="cursor-magnetic__disc" />
        <span ref={labelRef} className="cursor-magnetic__label" />
      </div>
    </div>
  );
}
