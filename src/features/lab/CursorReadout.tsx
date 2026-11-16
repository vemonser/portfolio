"use client";

import { useEffect, useState } from "react";

/**
 * Lab-only readout for the cursor roles, plus the escape hatch the plan asks
 * for: flip back to the OS cursor without touching the component.
 */
export default function CursorReadout() {
  const [state, setState] = useState("default");
  const [visible, setVisible] = useState(false);
  const [custom, setCustom] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    const read = () => {
      setState(html.dataset.cursorState ?? "default");
      setVisible(html.dataset.cursorVisible === "true");
      setCustom(html.dataset.cursor !== "off");
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(html, {
      attributes: true,
      attributeFilter: ["data-cursor-state", "data-cursor", "data-cursor-visible"],
    });
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    html.dataset.cursor = html.dataset.cursor === "off" ? "on" : "off";
  };

  return (
    <aside className="fixed bottom-[var(--space-3)] right-[var(--space-3)] z-[70] grid gap-2 border border-[var(--line-hairline)] bg-black/85 p-4 font-label text-t-12 uppercase tracking-[var(--track)] text-warm backdrop-blur-md">
      <p className="m-0 flex items-baseline justify-between gap-6">
        <span>Role</span>
        <strong className="font-normal text-lime">{state}</strong>
      </p>
      <p className="m-0 flex items-baseline justify-between gap-6">
        <span>Pointer</span>
        <span className="text-bone">
          {custom ? "Custom" : "System"} · {visible ? "in" : "out"}
        </span>
      </p>
      <button
        type="button"
        onClick={toggle}
        className="mt-1 border border-[var(--line-strong)] bg-transparent px-3 py-2 font-label text-t-12 uppercase tracking-[var(--track)] text-bone transition-colors duration-200 hover:border-lime hover:text-lime"
      >
        {custom ? "Use system cursor" : "Use custom cursor"}
      </button>
    </aside>
  );
}
