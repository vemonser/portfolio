"use client";

import { useEffect, useState } from "react";

type Props = {
  timeZone?: string;
  className?: string;
};

/**
 * The footer clock. The server cannot know the visitor's current minute, so the
 * first paint is a placeholder and the client fills it in — no hydration
 * mismatch, no fake time in the markup.
 */
export default function LocalTime({
  timeZone = "Africa/Cairo",
  className,
}: Props) {
  const [value, setValue] = useState<string | null>(null);

  useEffect(() => {
    const format = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZoneName: "short",
    });

    const tick = () => setValue(format.format(new Date()));
    tick();
    const interval = window.setInterval(tick, 30_000);

    return () => window.clearInterval(interval);
  }, [timeZone]);

  return (
    <span className={className} suppressHydrationWarning>
      {value ?? "--:--"}
    </span>
  );
}
