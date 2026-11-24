import { staticFile } from "remotion";
import { useEffect, useState } from "react";
import { continueRender, delayRender } from "remotion";

/**
 * The address bar needs a real sans, not DejaVu. The woff2 files are the
 * ones the site already ships, so the frame matches the product.
 */
export function ShowcaseFonts() {
  const [handle] = useState(() => delayRender("Loading showcase fonts"));
  const sans = staticFile("fonts/inter.woff2");
  const mono = staticFile("fonts/jetbrains.woff2");

  useEffect(() => {
    Promise.all([
      document.fonts.load('500 15px "Showcase Sans"'),
      document.fonts.load('400 13px "Showcase Mono"'),
    ])
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);

  return (
    <style>{`
      @font-face {
        font-family: "Showcase Sans";
        src: url("${sans}") format("woff2");
        font-weight: 100 900;
        font-style: normal;
        font-display: block;
      }
      @font-face {
        font-family: "Showcase Mono";
        src: url("${mono}") format("woff2");
        font-weight: 100 800;
        font-style: normal;
        font-display: block;
      }
    `}</style>
  );
}

export const SANS = '"Showcase Sans", "Inter", ui-sans-serif, system-ui, sans-serif';
export const MONO = '"Showcase Mono", "JetBrains Mono", ui-monospace, monospace';
