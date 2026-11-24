"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { copy } from "@/content/copy";
import { getPosts } from "@/content/blog/posts";
import { getProjects } from "@/content/projects";

import "./route-curtain.css";

gsap.registerPlugin(useGSAP);

/*
 * Route curtain. Two stacked surfaces wipe up over the page: black on top and
 * lime underneath it. On the way in the black sheet leads and the lime stays
 * hidden beneath it, so the lime is only ever seen "from below" as the curtain
 * retracts: the black sheet leaves first and the lime trails it as a visible
 * band before it follows the black one off the screen. The destination label
 * rises into the black surface, then leaves before the surface retracts to
 * reveal the new route.
 *
 * The whole sequence is a GSAP timeline (same engine as the page loader): the
 * cover/reveal proxies are tweened with ease: "none" and the ease is applied
 * in onUpdate so the lime trail matches the loader exactly.
 */
const COVER_S = 1.0;
const REVEAL_S = 1.1;
/* The cover + reveal always play in full regardless of how fast the destination
   page is ready: the navigation push happens mid-cover so the page loads behind
   the plate, but the wipe itself is a guaranteed minimum and is never cut short
   by page readiness. */
const LABEL_IN_S = 0.4;
const LABEL_OUT_S = 0.4;
const PUSH_AT = 0.5;
/* Fraction of the cover at which the destination label starts to rise. */
const LABEL_START_AT = 0.35;
/* Fraction of the timeline the lime sheet runs behind the black one. */
const TRAIL_LAG = 0.1;
/* Leading-edge lift, matching the page loader. */
const BULGE_RATIO = 0.6;
const CTRL_X_RATIO = 0.27;
/* Seconds the safety net allows before forcing the exit. */
const MAX_HOLD_S = 1.4;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

/* The trailing sheet starts late but still lands with the lead sheet, so the
   band it exposes narrows to nothing as the wipe finishes. */
const trailProgress = (t: number) =>
  t <= TRAIL_LAG ? 0 : (t - TRAIL_LAG) / (1 - TRAIL_LAG);

/* Rising sheet: the area below the curved edge, filled down to the viewport
   bottom. */
const coverPath = (w: number, h: number, y: number, bulge: number) =>
  `M0 ${h} L0 ${y} Q${w * CTRL_X_RATIO} ${y - bulge} ${w} ${y} L${w} ${h} Z`;

/* Retracting sheet: the area above the curved edge, filled up to the viewport
   top. */
const revealPath = (w: number, h: number, y: number, bulge: number) =>
  `M0 0 L${w} 0 L${w} ${y} Q${w * CTRL_X_RATIO} ${y + bulge} 0 ${y} Z`;

function labelFor(pathname: string): string {
  const clean = pathname.replace(/\/$/, "") || "/";
  if (clean === "/") return copy.meta.title; // "Abdelrhman"

  const segments = clean.split("/").filter(Boolean);
  const [first, second] = segments;

  // A specific project or post shows its own title.
  if (first === "work" && second) {
    const project = getProjects().find((p) => p.slug === second);
    if (project?.title) return project.title;
  }
  if (first === "blog" && second) {
    const post = getPosts().find((p) => p.slug === second);
    if (post?.title) return post.title;
  }

  const nav = copy.nav as Record<string, string>;
  const known: Record<string, string> = {
    work: nav.work ?? "Work",
    about: nav.about ?? "About",
    contact: nav.contact ?? "Contact",
    blog: nav.blog ?? "Blog",
  };
  return known[first] ?? first;
}

type Phase = "idle" | "cover" | "exit" | "reveal";

export default function RouteCurtain() {
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
        const label = labelFor(url.pathname);
        startTransition(label, () => {
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

  return (
    <div
      className="route-curtain fixed inset-0 z-70"
      ref={rootRef}
      aria-hidden="true"
      popover="manual"
    >
      <svg
        className="route-curtain__svg"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <path
          ref={trailRef}
          className="route-curtain__path"
          d=""
          fill="var(--color-lime)"
        />
        <path
          ref={leadRef}
          className="route-curtain__path"
          d=""
          fill="var(--color-ink)"
        />
      </svg>
      <div className="route-curtain__label-box">
        <p ref={labelRef} className="route-curtain__label" />
      </div>
    </div>
  );
}