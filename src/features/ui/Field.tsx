import type { ReactNode } from "react";

export type FieldControlProps = {
  id: string;
  "aria-describedby"?: string;
  "aria-invalid"?: true;
};

type Props = {
  id: string;
  label: string;
  /** One message per field; the first error wins. */
  error?: string;
  description?: string;
  /**
   * A render prop rather than a cloned child: the control keeps its own type
   * (input vs textarea) and the form keeps control of value and events, while
   * the field owns the label, the description and the error association.
   */
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Label + control + description + error, wired by stable ids. Screen readers
 * get the description and the error through `aria-describedby`; the visible
 * error is in an alert so it is announced when it appears.
 */
export default function Field({
  id,
  label,
  error,
  description,
  children,
}: Props) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [description ? hintId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-[0.55rem]">
      <label htmlFor={id} className="ui-label">
        {label}
      </label>

      {children({
        id,
        "aria-describedby": describedBy || undefined,
        "aria-invalid": error ? true : undefined,
      })}

      {description ? (
        <p id={hintId} className="m-0 text-t-14 leading-[1.6] text-warm">
          {description}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="m-0 text-t-14 leading-[1.6] text-lime ar:text-t-16"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
