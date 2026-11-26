"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import {
  BULGE_RATIO,
  COVER_S,
  LABEL_IN_S,
  LABEL_OUT_S,
  LABEL_START_AT,
  MAX_HOLD_S,
  PUSH_AT,
  REVEAL_S,
  coverPath,
  easeOutExpo,
  labelFor,
  revealPath,
  trailProgress,
} from "./route-curtain-geometry";

gsap.registerPlugin(useGSAP);

type Phase = "idle" | "cover" | "exit" | "reveal";

export function useRouteCurtain() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const labelRef = useRef<HTMLParagraphElement>(null);

  const phaseRef = useRef<Phase>("idle");
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const safetyTimerRef = useRef(0);

  useGSAP(
    (_context, contextSafe) => {
      const root = rootRef.current;
      if (!root) return;
      const safe = contextSafe as NonNullable<typeof contextSafe>;
      const lead = leadRef.current;
      const trail = trailRef.current;
      const label = labelRef.current;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.dataset.active = "false";
        return;
      }

      // Normalise the parked label so GSAP owns its transform.
      if (label) gsap.set(label, { y: 0, yPercent: 110 });

      const setPaths = (leadD: string, trailD: string) => {
        lead?.setAttribute("d", leadD);
        trail?.setAttribute("d", trailD);
      };
      const show = () => {
        root.dataset.active = "true";
        // A modal <dialog> (the burger menu) lives in the top layer, so a
        // plain z-index cannot beat it. Promote the curtain to the top layer
        // too; shown after the dialog, it paints above it.
        try {
          root.showPopover?.();
        } catch {
          // Popover unsupported: the z-index still covers non-modal content.
        }
      };
      const hide = () => {
        try {
          root.hidePopover?.();
        } catch {
          // Already hidden.
        }
        root.dataset.active = "false";
      };

      const renderCover = (eLead: number, eTrail: number) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const bulge = Math.sin(Math.PI * eLead) * h * BULGE_RATIO;
        setPaths(
          coverPath(w, h, h * (1 - eLead), bulge),
          coverPath(w, h, h * (1 - eTrail), bulge),
        );
      };
      const renderReveal = (eLead: number, eTrail: number) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const bulge = Math.sin(Math.PI * eLead) * h * BULGE_RATIO;
        setPaths(
          revealPath(w, h, h * (1 - eLead), bulge),
          revealPath(w, h, h * (1 - eTrail), bulge),
        );
      };

      const killTimeline = () => {
        timelineRef.current?.kill();
        timelineRef.current = null;
        window.clearTimeout(safetyTimerRef.current);
      };

      /* Label out, then the reveal. Used by both the cover exit and popstate. */
      const playExit = safe(() => {
        if (phaseRef.current !== "exit" && phaseRef.current !== "cover") return;
        phaseRef.current = "exit";
        const reveal = { t: 0 };
        const tl = gsap.timeline({
          onComplete: () => {
            phaseRef.current = "idle";
            hide();
          },
        });
        timelineRef.current = tl;
        if (label) {
          tl.to(label, { yPercent: -110, duration: LABEL_OUT_S, ease: "expo.out" });
        }
        tl.to(
          reveal,
          {
            t: 1,
            duration: REVEAL_S,
            ease: "none",
            onUpdate: () =>
              renderReveal(
                easeOutExpo(reveal.t),
                easeOutExpo(trailProgress(reveal.t)),
              ),
          },
          LABEL_OUT_S,
        );
      });

      /* Cover, label rise, push, then exit. */
      const startTransition = safe((labelText: string, push: () => void) => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        phaseRef.current = "cover";

        if (label) {
          label.textContent = labelText;
          gsap.set(label, { y: 0, yPercent: 110 });
        }
        // Paint the closed edge before the overlay becomes visible.
        const closed = coverPath(w, h, h, 0);
        setPaths(closed, closed);
        show();

        const cover = { t: 0 };
        const tl = gsap.timeline({
          onComplete: () => {
            phaseRef.current = "exit";
            playExit();
          },
        });
        timelineRef.current = tl;

        tl.to(
          cover,
          {
            t: 1,
            duration: COVER_S,
            ease: "none",
            onUpdate: () =>
              renderCover(
                easeOutExpo(cover.t),
                easeOutExpo(trailProgress(cover.t)),
              ),
          },
          0,
        );
        if (label) {
          tl.to(
            label,
            { yPercent: 0, duration: LABEL_IN_S, ease: "expo.out" },
            COVER_S * LABEL_START_AT,
          );
        }
        // Push partway through the cover; the exit runs on the covered screen.
        tl.call(push, [], COVER_S * PUSH_AT);

        // Safety: never stay covered forever.
        window.clearTimeout(safetyTimerRef.current);
        safetyTimerRef.current = window.setTimeout(
          () => playExit(),
          (COVER_S + MAX_HOLD_S) * 1000,
        );
      });

      const onClick = (event: MouseEvent) => {
        if (event.defaultPrevented) return;
        if (event.button !== 0) return;
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const target = event.target as Element | null;
        const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
        if (!anchor) return;
        if (anchor.target && anchor.target !== "_self") return;
        if (anchor.hasAttribute("download")) return;
        let url: URL;
        try {
          url = new URL(anchor.href, location.href);
        } catch {
          return;
        }
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname && url.search === location.search) return;
        if (document.documentElement.dataset.pageLoader === "run") return;
        // A click mid-transition is ignored rather than allowed to fall through
        // to Next's own navigation, which would swap the page under the curtain.
        if (phaseRef.current !== "idle") {
          event.preventDefault();
          return;
        }

        event.preventDefault();
        const labelText = labelFor(url.pathname);
        startTransition(labelText, () => {
          router.push(url.pathname + url.search + url.hash);
        });
      };

      const onPopState = () => {
        if (document.documentElement.dataset.pageLoader === "run") return;
        if (phaseRef.current !== "idle") return;
        const w = window.innerWidth;
        const h = window.innerHeight;
        const labelText = labelFor(location.pathname);
        if (label) {
          label.textContent = labelText;
          gsap.set(label, { y: 0, yPercent: 110 });
        }
        const rect = `M0 0 H${w} V${h} L0 ${h} Z`;
        setPaths(rect, rect);
        show();
        phaseRef.current = "exit";
        playExit();
      };

      document.addEventListener("click", onClick, true);
      window.addEventListener("popstate", onPopState);

      return () => {
        document.removeEventListener("click", onClick, true);
        window.removeEventListener("popstate", onPopState);
        killTimeline();
      };
    },
    { scope: rootRef, dependencies: [router] },
  );

  return { rootRef, leadRef, trailRef, labelRef };
}

export default useRouteCurtain;
