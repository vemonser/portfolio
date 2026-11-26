"use client";

import { useCursor } from "@/features/cursor/use-cursor";

import "./cursor.css";

/**
 * The site-wide magnetic cursor. Lime is the default treatment; the cursor lab
 * can opt into Bone without changing the component or its movement.
 *
 * The native pointer disappears only after this component mounts and sets
 * `html[data-cursor="on"]`. Touch devices and no-JS visitors keep the OS
 * pointer, and text entry deliberately restores the I-beam.
 */
export default function Cursor() {
  const { enabled, layerRef, cursorRef, labelRef } = useCursor();

  if (!enabled) return null;

  return (
    <div
      ref={layerRef}
      className="cursor-layer"
      popover="manual"
      aria-hidden="true"
    >
      <div ref={cursorRef} className="cursor-magnetic" aria-hidden="true">
        <span className="cursor-magnetic__disc" />
        <span ref={labelRef} className="cursor-magnetic__label" />
      </div>
    </div>
  );
}