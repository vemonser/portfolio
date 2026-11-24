"use client";

import type { ReactNode } from "react";

/**
 * Route-to-route title.
 *
 * The h1 is real DOM. The native navigation view transition is deliberately not
 * used here: the manual curtain in `RouteTransition` owns the route change, and
 * a second (native) transition on top of it double-exposes the title.
 */
export default function PageTitle({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
