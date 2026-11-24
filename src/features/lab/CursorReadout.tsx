"use client";

import { useEffect, useState } from "react";

const VARIANTS = [
  { id: "orbit", label: "Orbit" },
  { id: "lime", label: "Lime Target" },
  { id: "editorial", label: "Editorial Double" },
] as const;

type CursorVariant = (typeof VARIANTS)[number]["id"];

/**
 * Lab-only readout for the cursor roles and the three visual candidates. The
 * choice lives on <html> so the cursor can switch without a React render, and
 * is removed on unmount so a lab choice never leaks into production.
 */
export default function CursorReadout() {
  const [state, setState] = useState("default");
  const [visible, setVisible] = useState(false);
  const [custom, setCustom] = useState(true);
  const [variant, setVariant] = useState<CursorVariant>("orbit");

  useEffect(() => {
    const html = document.documentElement;
    html.dataset.cursorVariant = "orbit";

    const read = () => {
      setState(html.dataset.cursorState ?? "default");
      setVisible(html.dataset.cursorVisible === "true");
      setCustom(html.dataset.cursor !== "off");
      const next = html.dataset.cursorVariant;
      setVariant(
        next === "lime" ||
          next === "editorial" ||
          next === "orbit"
          ? next
          : "orbit",
      );
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(html, {
      attributes: true,
      attributeFilter: [
        "data-cursor-state",
        "data-cursor",
        "data-cursor-visible",
        "data-cursor-variant",
      ],
    });
    return () => {
      observer.disconnect();
      delete html.dataset.cursorVariant;
    };
  }, []);

  const toggle = () => {
    const html = document.documentElement;
    html.dataset.cursor = html.dataset.cursor === "off" ? "on" : "off";
  };

  const choose = (next: CursorVariant) => {
    const html = document.documentElement;
    html.setAttribute("data-cursor-variant", next);
    setVariant(next);
  };

  return (
    <aside className="fixed bottom-[var(--space-3)] right-[var(--space-3)] z-[70] grid w-[min(20rem,calc(100vw-2rem))] gap-3 border border-[var(--line-hairline)] bg-black/85 p-4 font-label text-t-12 uppercase tracking-[var(--track)] text-warm backdrop-blur-md">
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

      <div role="group" aria-label="Cursor variant" className="grid gap-2">
        <span className="text-fg-subtle">Variant</span>
        <div className="grid grid-cols-3 gap-1">
          {VARIANTS.map((option) => (
            <button
              key={option.id}
              type="button"
              data-cursor-variant-option={option.id}
              aria-pressed={variant === option.id}
              onClick={() => choose(option.id)}
              className="min-h-11 border border-[var(--line-strong)] bg-transparent px-2 py-2 text-t-12 text-bone transition-colors duration-200 hover:border-lime hover:text-lime aria-pressed:border-lime aria-pressed:bg-lime/10 aria-pressed:text-lime"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        className="mt-1 min-h-11 border border-[var(--line-strong)] bg-transparent px-3 py-2 text-t-12 text-bone transition-colors duration-200 hover:border-lime hover:text-lime"
      >
        {custom ? "Use system cursor" : "Use custom cursor"}
      </button>
    </aside>
  );
}
