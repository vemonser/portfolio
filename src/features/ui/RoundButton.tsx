import Link from "next/link";

type Props = {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
};

function Arrow() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

/** The big lime disc — dennissnellenberg's "Get in touch" button. */
export default function RoundButton({
  href,
  label,
  external = false,
  className,
}: Props) {
  const classes = className ? `round-button ${className}` : "round-button";
  const content = (
    <>
      <span>{label}</span>
      <Arrow />
    </>
  );

  if (external) {
    return (
      <a href={href} className={classes} target="_blank" rel="noreferrer">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={classes}>
      {content}
    </Link>
  );
}
