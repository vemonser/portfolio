"use client";

import { useEffect, useState } from "react";

import {
  CURSOR_VARIANTS,
  DEFAULT_CURSOR_VARIANT,
  isCursorVariant,
  type CursorVariant,
} from "@/features/cursor/cursor-variants";

const FINE_POINTER = "(hover: hover) and (pointer: fine)";

/**
 * Lab-only controls for the two approved magnetic treatments. The choice lives
 * on <html> so the cursor can switch without a React render, and is removed on
 * unmount so production always returns to the default Lime treatment.
 */
export default function CursorReadout() {
  const [state, setState] = useState("default");
  const [visible, setVisible] = useState(false);
  const [cursorOn, setCursorOn] = useState(true);
  const [finePointer, setFinePointer] = useState<boolean | null>(null);
  const [variant, setVariant] = useState<CursorVariant>(DEFAULT_CURSOR_VARIANT);

  useEffect(() => {
    const html = document.documentElement;
    const pointerMedia = window.matchMedia(FINE_POINTER);
    const syncPointer = () => setFinePointer(pointerMedia.matches);
    syncPointer();
    pointerMedia.addEventListener("change", syncPointer);
    html.dataset.cursorVariant = DEFAULT_CURSOR_VARIANT;

    const read = () => {
      setState(html.dataset.cursorState ?? "default");
      setVisible(html.dataset.cursorVisible === "true");
      setCursorOn(html.dataset.cursor !== "off");
      const next = html.dataset.cursorVariant;
      setVariant(isCursorVariant(next) ? next : DEFAULT_CURSOR_VARIANT);
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
      pointerMedia.removeEventListener("change", syncPointer);
      delete html.dataset.cursorVariant;
    };
  }, []);

  const custom = finePointer === true && cursorOn;
  let pointerLabel = "System · checking";
  if (finePointer === true) {
    pointerLabel = `${custom ? "Custom" : "System"} · ${visible ? "in" : "out"}`;
  } else if (finePointer === false) {
    pointerLabel = "System · touch";
  }

  const toggle = () => {
    if (finePointer !== true) return;
    const html = document.documentElement;
    html.dataset.cursor = html.dataset.cursor === "off" ? "on" : "off";
  };

  const choose = (next: CursorVariant) => {
    if (finePointer !== true) return;
    document.documentElement.setAttribute("data-cursor-variant", next);
    setVariant(next);
  };

  return (
    <aside className="fixed right-[var(--space-3)] top-[7rem] z-[70] grid max-h-[calc(100dvh-2rem)] w-[min(20rem,calc(100vw-2rem))] gap-3 overflow-auto border border-[var(--line-hairline)] bg-black/85 p-4 font-label text-t-12 uppercase tracking-[var(--track)] text-warm backdrop-blur-md">
      <p className="m-0 flex items-baseline justify-between gap-6">
        <span>Role</span>
        <strong className="font-normal text-lime">{state}</strong>
      </p>
      <p className="m-0 flex items-baseline justify-between gap-6">
        <span>Pointer</span>
        <span className="text-bone">{pointerLabel}</span>
      </p>

      <div role="group" aria-label="Cursor variant" className="grid gap-2">
        <span className="text-fg-subtle">Variant</span>
        <div className="grid grid-cols-2 gap-1">
          {CURSOR_VARIANTS.map((option) => (
            <button
              key={option.id}
              type="button"
              data-cursor-variant-option={option.id}
              aria-pressed={variant === option.id}
              disabled={finePointer !== true}
              onClick={() => choose(option.id)}
              className="min-h-11 border border-[var(--line-strong)] bg-transparent px-2 py-2 text-t-12 text-bone transition-colors duration-200 hover:border-lime hover:text-lime aria-pressed:border-lime aria-pressed:bg-lime/10 aria-pressed:text-lime disabled:cursor-not-allowed disabled:opacity-40"
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={toggle}
        disabled={finePointer !== true}
        className="mt-1 min-h-11 border border-[var(--line-strong)] bg-transparent px-3 py-2 text-t-12 text-bone transition-colors duration-200 hover:border-lime hover:text-lime disabled:cursor-not-allowed disabled:opacity-40"
      >
        {custom ? "Use system cursor" : "Use custom cursor"}
      </button>
    </aside>
  );
}
