/**
 * The supplied burger animation is authored as a two-way morph: frames 0–25
 * turn the two bars into the X, 25–30 hold it, and 30–55 return the bars. The
 * close is the same authored morph played backwards, so the panel entrance
 * (800ms) and exit (850ms) each get a ~833ms mark transition.
 */

export const BURGER_REST_FRAME = 0;

/** The first frame of the authored X hold (trim 0/44). */
export const BURGER_OPEN_FRAME = 25;

export type MenuPhase = "closed" | "entering" | "open" | "closing";

export type BurgerMotion = "rest" | "open" | "close";

export function burgerMotion(phase: MenuPhase): BurgerMotion {
  if (phase === "entering" || phase === "open") return "open";
  if (phase === "closing") return "close";
  return "rest";
}
