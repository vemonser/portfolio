"use client";

import { useEffect, useState } from "react";

const DURATION = 1200;

/**
 * A real progress count for the opening, not a fake loader: it tracks the same
 * 1.2s the title sequence takes. It holds at 100. Decorative, so it is hidden
 * from assistive technology by its wrapper.
 */
export default function TitleCounter() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // The count is decoration: reduced motion skips straight to its end
      // state instead of running the frame loop.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValue(100);
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / DURATION);
      setValue(Math.round(progress * 100));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span className="title-card__counter" aria-hidden="true">
      {String(value).padStart(3, "0")}
    </span>
  );
}
