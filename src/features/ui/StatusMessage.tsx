import type { ReactNode } from "react";

type Props = {
  kind: "success" | "error" | "info";
  children: ReactNode;
};

/**
 * Form feedback with the right live-region semantics: errors interrupt
 * (`alert`/assertive), everything else waits its turn (`status`/polite). The
 * `data-form-status` attribute is the stable hook the browser tests use.
 */
export default function StatusMessage({ kind, children }: Props) {
  const error = kind === "error";

  return (
    <p
      data-form-status={kind}
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      className={`m-0 flex flex-wrap items-baseline gap-x-[0.5rem] gap-y-[0.35rem] border-s-2 ps-[var(--space-2)] text-t-16 leading-[1.65] ${
        error ? "border-lime text-bone" : "border-forest text-bone/80"
      }`}
    >
      {children}
    </p>
  );
}
