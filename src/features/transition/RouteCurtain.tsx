"use client";

import { useRouteCurtain } from "./use-route-curtain";

import "./route-curtain.css";

export default function RouteCurtain() {
  const { rootRef, leadRef, trailRef, labelRef } = useRouteCurtain();

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
