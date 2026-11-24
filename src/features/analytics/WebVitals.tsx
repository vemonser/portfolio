"use client";

import { useReportWebVitals } from "next/web-vitals";
import type { Metric } from "web-vitals";

/**
 * Reports Core Web Vitals to wherever the site measures them.
 *
 * `useReportWebVitals` is fed by the `web-vitals` library the App Router
 * already ships, so the hook fires once per metric with the final value. In
 * development it logs to the console so a `pnpm dev` session shows the same
 * numbers Lighthouse synthesises; in production it POSTs to a first-party
 * endpoint when one is configured, so field data (real devices, real
 * networks) lands somewhere instead of dying in the browser.
 *
 * No endpoint is configured by default: a portfolio has no analytics backend,
 * so the production path is a no-op until NEXT_PUBLIC_VITALS_URL is set. That
 * keeps the component free of a hard dependency on any vendor.
 */
function sendToEndpoint(metric: Metric) {
  const endpoint = process.env.NEXT_PUBLIC_VITALS_URL?.trim();
  if (!endpoint) return;

  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
    path: window.location.pathname,
  });

  // keepalive so the beacon survives a navigation that unloads the page.
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, body);
    return;
  }
  fetch(endpoint, {
    body,
    keepalive: true,
    method: "POST",
    headers: { "content-type": "application/json" },
  }).catch(() => {
    // A metrics beacon must never surface an error to the user.
  });
}

export default function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV === "production") {
      sendToEndpoint(metric);
      return;
    }
    // Dev: a compact console line, no noise.
    console.debug(
      `[web-vitals] ${metric.name} ${Math.round(metric.value * 100) / 100} (${metric.rating})`,
    );
  });

  return null;
}