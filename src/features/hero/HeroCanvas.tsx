"use client";

import dynamic from "next/dynamic";

/**
 * The scene is deliberately split out of the first client graph: the hero's
 * text is server-rendered and readable before this chunk arrives, and the CSS
 * gradient is the fallback if WebGL never starts. Keeping three.js behind a
 * dynamic import protects the first interaction budget the same way the old
 * stage did.
 */
const Scene = dynamic(() => import("./HeroScene"), {
  ssr: false,
  loading: () => null,
});

export default function HeroCanvas() {
  return <Scene />;
}
