import Link from "next/link";

import { ArrowUpRight } from "./Arrow";
import { roundButton } from "./styles";

type Props = {
  href: string;
  label: string;
  external?: boolean;
  className?: string;
};

/** The one CTA: a lime disc with the same arrow at the same size everywhere. */
export default function RoundButton({
  href,
  label,
  external = false,
  className,
}: Props) {
  const classes = className ? `${roundButton} ${className}` : roundButton;
  const content = (
    <>
      <span>{label}</span>
      <ArrowUpRight className="transition-transform duration-[var(--dur-slow)] ease-[var(--ease-editorial)] group-hover:translate-x-1 group-hover:-translate-y-1" />
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        target="_blank"
        rel="noreferrer"
        data-magnetic
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={classes}
      data-magnetic
      data-cursor="hello"
      transitionTypes={["nav-forward"]}
    >
      {content}
    </Link>
  );
}
