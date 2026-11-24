import gsap from "gsap";

const HOLD_S = 0.35;
const WIPE_S = 0.9;
const WIPE_DELAY_S = 0.5;
const TRAIL_LAG = 0.18;

const IN_EASE = "expo.out";
const DROP_EASE = "power4.in";
const WIPE_EASE = "power4.inOut";

export type LoaderEls = {
  plate: HTMLElement;
  limePlate: HTMLElement;
  line: HTMLElement;
  count: HTMLElement;
  letters: HTMLElement[];
};

export function createLoaderTimeline(opts: {
  els: LoaderEls;
  minMs: number;
  ready: Promise<void>;
  isDead: () => boolean;
  onDone: () => void;
}) {
  const { els, minMs, ready, isDead, onDone } = opts;
  const { plate, limePlate, line, count, letters } = els;
  const minS = minMs / 1000;

  // Park letters and counter outside their clip boxes.
  gsap.set(letters, { y: 0, yPercent: 120 });
  gsap.set(count, { y: 0, yPercent: 110 });

  /* ---------- Exit: letters drop, then the curved wipe ---------- */
  const lead = { e: 0 };
  const trail = { e: 0 };

  /*
   * The curved leading edge is a STATIC clip-path polygon baked into CSS
   * (loader.css), not a per-frame path() string. The previous version wrote
   * `clipPath: path(...)` on two full-screen plates every frame, which
   * re-rasterizes the clip each time — the single most expensive thing the
   * loader did, and the ~1.6s render-blocking frame during load. With a
   * static clip, only transform animates, which is compositor-only and free.
   */
  const render = () => {
    const h = window.innerHeight;
    plate.style.transform = `translateY(${-h * lead.e}px)`;
    limePlate.style.transform = `translateY(${-h * trail.e}px)`;
  };

  const exit = gsap.timeline({
    paused: true,
    onComplete: () => {
      if (isDead()) return;
      lead.e = 1;
      trail.e = 1;
      render();
      onDone();
    },
  });

  exit
    .to(
      letters,
      {
        yPercent: 120,
        duration: 0.45,
        stagger: 0.04,
        ease: DROP_EASE,
        overwrite: true,
      },
      HOLD_S,
    )
    .to(
      count,
      {
        y: () => -line.getBoundingClientRect().height * 1.2,
        duration: 0.45,
        ease: DROP_EASE,
        overwrite: true,
      },
      HOLD_S,
    )
    .to(
      lead,
      { e: 1, duration: WIPE_S, ease: WIPE_EASE, onUpdate: render },
      HOLD_S + WIPE_DELAY_S,
    )
    .to(
      trail,
      {
        e: 1,
        duration: WIPE_S * (1 - TRAIL_LAG),
        ease: WIPE_EASE,
        onUpdate: render,
      },
      HOLD_S + WIPE_DELAY_S + WIPE_S * TRAIL_LAG,
    );

  /* ---------- Reveal: letters rise with the counter ---------- */
  const reveal = gsap.timeline();
  letters.forEach((letter, i) => {
    reveal.to(
      letter,
      { yPercent: 0, duration: 1.1, ease: IN_EASE },
      (i / letters.length) * minS * 0.9 + (i % 2) * 0.04,
    );
  });

  /* ---------- Counter: 0 -> 99 over minMs, last 1% waits for ready ---------- */
  const state = { v: 0 };
  const write = () => {
    count.textContent = `${Math.floor(state.v)}%`;
  };

  gsap.to(count, { yPercent: 0, duration: 0.8, delay: 0.1, ease: IN_EASE });

  gsap.to(state, {
    v: 99,
    duration: minS,
    ease: "none",
    onUpdate: write,
    onComplete: () => {
      ready.then(() => {
        if (isDead()) return;
        state.v = 100;
        write();
        exit.play();
      });
    },
  });

  return { exit, reveal };
}