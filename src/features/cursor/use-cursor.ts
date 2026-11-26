"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import gsap from "gsap";

import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";

import {
  type CursorRole,
  ROLE_LABELS,
  resolveCursorRole,
} from "@/features/cursor/cursor-roles";

import { createCursorMotion } from "@/features/cursor/cursor-motion";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * Owns the site-wide custom cursor lifecycle: fine-pointer gating, popover/menu
 * synchronisation, dataset lifecycle, event listeners, role refresh and
 * cleanup. Returns the refs the rendering component needs to attach.
 */
export function useCursor(): {
  enabled: boolean;
  layerRef: RefObject<HTMLDivElement | null>;
  cursorRef: RefObject<HTMLDivElement | null>;
  labelRef: RefObject<HTMLSpanElement | null>;
} {
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
    let labelTimeline: gsap.core.Timeline | null = null;

    const motion = createCursorMotion({ cursor, root: html, reduced });

    const clearLabelFeedback = () => {
      label.style.removeProperty("transform");
      label.style.removeProperty("scale");
      label.style.removeProperty("opacity");
    };

    const setRole = (next: CursorRole) => {
      if (next === role) return;
      const previous = role;
      role = next;
      html.dataset.cursorState = next;

      const text = ROLE_LABELS[next] ?? "";
      const menuFlip =
        (previous === "link" && next === "close") ||
        (previous === "close" && next === "link");
      if (!menuFlip || reduced.matches) {
        label.textContent = text;
        return;
      }

      labelTimeline?.kill();
      labelTimeline = gsap.timeline({
        onComplete: () => {
          clearLabelFeedback();
          labelTimeline = null;
        },
      });
      labelTimeline.to(label, {
        opacity: 0,
        scale: 0.94,
        duration: 0.12,
        ease: "power2.in",
      });
      labelTimeline.call(() => {
        label.textContent = text;
      });
      labelTimeline.fromTo(
        label,
        { opacity: 0, scale: 0.96 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.22,
          ease: "expo.out",
        },
      );
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
      setRole(node ? resolveCursorRole(node, isMenuOpen()) : "default");
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

      if (menuOpen) motion.releaseMagnets();
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

    const hide = () => {
      html.dataset.cursorVisible = "false";
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!hasPosition) hasPosition = true;
      show();
      if (!reduced.matches) motion.magnetize(targetX, targetY);
      motion.move(targetX, targetY);
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      const node = event.target instanceof Element ? event.target : null;
      setRole(node ? resolveCursorRole(node, isMenuOpen()) : "default");
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      motion.setPressed(true);
    };

    const onLeave = () => {
      motion.releaseMagnets();
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
      labelTimeline?.kill();
      labelTimeline = null;
      gsap.killTweensOf(label);
      clearLabelFeedback();
      motion.destroy();
      if (supportsPopover) {
        try {
          layer.hidePopover();
        } catch {
          // Already hidden on teardown.
        }
      }
      cancelAnimationFrame(roleFrame);
      delete html.dataset.cursorMenu;
      delete html.dataset.cursor;
      delete html.dataset.cursorState;
      delete html.dataset.cursorVisible;
      delete html.dataset.cursorDown;
    };
  }, [enabled]);

  return { enabled, layerRef, cursorRef, labelRef };
}
