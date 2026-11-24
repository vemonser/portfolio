import type { ReactNode } from "react";

/**
 * Page-level transition wrapper.
 *
 * The route curtain (`src/features/transition/RouteCurtain.tsx`) now owns all
 * navigation transitions, so this component is a passthrough. It is kept so
 * the page files do not need to change.
 */
export default function DirectionalTransition({
  children,
}: {
  children: ReactNode;
}) {
  return <>{children}</>;
}