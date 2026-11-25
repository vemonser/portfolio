import type { ReactNode } from "react";

type Props = {
  kind: "success" | "error" | "info";
  children: ReactNode;
};

/**
 * Form feedback styling. The ContactForm owns a persistent live-region wrapper
 * so the announcement happens when the content changes, not when a pre-filled
 * alert node is inserted. `data-form-status` remains the stable test hook.
 */
export default function StatusMessage({ kind, children }: Props) {
  const error = kind === "error";

  return (
    <p
      data-form-status={kind}
      className={`m-0 flex flex-wrap items-baseline gap-x-[0.5rem] gap-y-[0.35rem] border-s-2 ps-[var(--space-2)] text-t-16 leading-[1.65] ${
        error ? "border-lime text-bone" : "border-forest text-fg"
      }`}
    >
      {children}
    </p>
  );
}
