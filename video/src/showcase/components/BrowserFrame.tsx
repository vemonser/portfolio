import type { ReactNode } from "react";

import { SANS } from "./Fonts";

type Props = {
  address: string;
  width: number;
  contentHeight: number;
  children: ReactNode;
  /** Fill the composition edge-to-edge: no radius, border or shadow. */
  flush?: boolean;
};

const LIGHTS = [
  { color: "#ff5f57", ring: "#e0443e" },
  { color: "#febc2e", ring: "#dea123" },
  { color: "#28c840", ring: "#1aab29" },
];

function Lock() {
  return (
    <svg width="11" height="12" viewBox="0 0 11 12" fill="none">
      <rect
        x="1.25"
        y="5.1"
        width="8.5"
        height="6.1"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.05"
      />
      <path
        d="M3.1 5.1V3.7a2.4 2.4 0 0 1 4.8 0v1.4"
        stroke="currentColor"
        strokeWidth="1.05"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * macOS window chrome, always dark. The address is the real domain and path,
 * so a viewer can find the site. Everything that is not chrome is left to the
 * child screenshot.
 */
export function BrowserFrame({
  address,
  width,
  contentHeight,
  children,
  flush = false,
}: Props) {
  return (
    <div
      style={{
        width,
        borderRadius: flush ? 0 : 18,
        overflow: "hidden",
        backgroundColor: "#151515",
        border: flush ? "none" : "1px solid rgba(255,255,255,0.09)",
        boxShadow: flush
          ? "none"
          : "0 60px 130px -45px rgba(0,0,0,0.95), 0 18px 40px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.07)",
      }}
    >
      <div
        style={{
          height: 52,
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "0 18px",
          position: "relative",
          background: "linear-gradient(180deg, #1e1e1e 0%, #161616 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.065)",
        }}
      >
        <div style={{ display: "flex", gap: 8 }}>
          {LIGHTS.map((light) => (
            <span
              key={light.color}
              style={{
                width: 12,
                height: 12,
                borderRadius: 999,
                backgroundColor: light.color,
                boxShadow: `inset 0 0 0 0.5px ${light.ring}, inset 0 1px 1px rgba(255,255,255,0.35)`,
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 7,
            height: 29,
            maxWidth: "54%",
            padding: "0 13px",
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.055)",
            border: "1px solid rgba(255,255,255,0.055)",
            color: "#bdb6ac",
            fontFamily: SANS,
            fontSize: 14.5,
            fontWeight: 500,
            letterSpacing: "0.005em",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <span style={{ display: "flex", color: "rgba(255,255,255,0.42)" }}>
            <Lock />
          </span>
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {address}
          </span>
        </div>

        <div style={{ width: 58, marginLeft: "auto" }} />
      </div>

      <div
        style={{
          width,
          height: contentHeight,
          overflow: "hidden",
          backgroundColor: "#0b0b0a",
          position: "relative",
        }}
      >
        {children}
      </div>
    </div>
  );
}
