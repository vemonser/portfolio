"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

type Props = {
  onToken: (token: string | null) => void;
};

/**
 * Optional Cloudflare Turnstile. With no public site key it renders nothing,
 * so local development and the mailto fallback stay unchanged. Production
 * must set both the public site key and the server secret.
 */
export default function Turnstile({ onToken }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !siteKey) return;

    let widgetId: string | null = null;
    let script: HTMLScriptElement | null = null;
    let existing: HTMLScriptElement | null = null;
    let retryTimer = 0;

    const render = () => {
      if (!window.turnstile || widgetId) return;
      widgetId = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: "dark",
        callback: (token) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[data-turnstile="true"]',
      );
      existing = existingScript;
      if (existingScript) {
        existingScript.addEventListener("load", render, { once: true });
        // The script may have finished between the query and listener attach.
        retryTimer = window.setTimeout(render, 0);
      } else {
        script = document.createElement("script");
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = "true";
        script.addEventListener("load", render, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      window.clearTimeout(retryTimer);
      if (existing) existing.removeEventListener("load", render);
      script?.removeEventListener("load", render);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken, siteKey]);

  if (!siteKey) return null;

  return (
    <div
      id="contact-turnstile"
      ref={containerRef}
      aria-label="Human verification"
    />
  );
}
