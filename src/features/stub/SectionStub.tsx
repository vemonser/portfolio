import Link from "next/link";

type Props = {
  title: string;
  body: string;
  back: string;
  backHref: string;
};

/**
 * A destination that exists so navigation never dead-ends, without pretending
 * the section has content yet.
 */
export default function SectionStub({ title, body, back, backHref }: Props) {
  return (
    <main className="flex min-h-dvh flex-col justify-center px-[var(--nav-inset)] pt-40 pb-24">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="stub-title font-display text-[clamp(2.5rem,7vw,6rem)] leading-[1.05]">
          {title}
        </h1>
        <p className="mt-6 max-w-prose text-t-20 text-warm">{body}</p>
        <Link
          href={backHref}
          className="ui-label mt-14 inline-block text-bone underline decoration-warm underline-offset-8"
        >
          {back}
        </Link>
      </div>
    </main>
  );
}
