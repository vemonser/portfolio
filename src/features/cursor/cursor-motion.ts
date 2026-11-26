import gsap from "gsap";

/**
 * Owns the GSAP-driven motion of the magnetic cursor: quickTo positioning,
 * initial placement, magnetic target translation, press feedback (with its
 * timeout and transitionend release) and tween/listener cleanup.
 *
 * Kept free of React and role/menu logic so the lifecycle can compose it.
 */
export type CursorMotion = {
  move(x: number, y: number): void;
  magnetize(x: number, y: number): void;
  releaseMagnets(): void;
  setPressed(pressed: boolean): void;
  destroy(): void;
};

export function createCursorMotion(options: {
  cursor: HTMLElement;
  root: HTMLElement;
  reduced: MediaQueryList;
}): CursorMotion {
  const { cursor, root, reduced } = options;

  // Size, colour and role state live in CSS. GSAP owns only the lagging
  // origin, so its transforms never erase the disc's visual transitions.
  gsap.set(cursor, { xPercent: -50, yPercent: -50 });
  gsap.set(cursor, { x: -100, y: -100 });

  const moveX = gsap.quickTo(cursor, "x", {
    duration: 0.35,
    ease: "expo.out",
  });
  const moveY = gsap.quickTo(cursor, "y", {
    duration: 0.35,
    ease: "expo.out",
  });

  let hasPosition = false;

  let downTimer = 0;

  const releasePress = () => {
    window.clearTimeout(downTimer);
    root.dataset.cursorDown = "false";
  };

  const onPressTransitionEnd = (event: TransitionEvent) => {
    if (
      event.propertyName === "transform" &&
      root.dataset.cursorDown === "true"
    ) {
      releasePress();
    }
  };

  cursor.addEventListener("transitionend", onPressTransitionEnd);

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

  const move = (x: number, y: number) => {
    if (!hasPosition) {
      gsap.set(cursor, { x, y });
      hasPosition = true;
    }
    if (reduced.matches) {
      gsap.killTweensOf(cursor);
      gsap.set(cursor, { x, y });
    } else {
      moveX(x);
      moveY(y);
    }
  };

  const setPressed = (pressed: boolean) => {
    if (pressed) {
      root.dataset.cursorDown = "true";
      window.clearTimeout(downTimer);
      downTimer = window.setTimeout(
        releasePress,
        reduced.matches ? 120 : 600,
      );
    } else {
      releasePress();
    }
  };

  const destroy = () => {
    cursor.removeEventListener("transitionend", onPressTransitionEnd);
    window.clearTimeout(downTimer);
    releaseMagnets();
    gsap.killTweensOf(cursor);
  };

  return { move, magnetize, releaseMagnets, setPressed, destroy };
}
