import { copy } from "@/content/copy";
import ChapterLabel from "@/features/ui/ChapterLabel";
import CopyLink from "@/features/ui/CopyLink";
import TextReveal from "@/features/ui/TextReveal";
import RoundButton from "@/features/ui/RoundButton";
import { displayCta } from "@/features/ui/styles";

/**
 * The closing chapter, present on every route except Contact. It is composed
 * like the rest of the site — a label, a display sentence, then the two real
 * ways to reach the owner — rather than a floating pill above the footer.
 */
export default function ContactCta() {
  const { cta } = copy;

  return (
    <section
      aria-labelledby="cta-title"
      data-section="contact-cta"
      className="page-shell section-pad border-t border-[var(--line-hairline)]"
    >
      <div>
        <ChapterLabel>{cta.label}</ChapterLabel>

        <TextReveal
          id="cta-title"
          as="h2"
          className={`${displayCta} mt-[var(--space-3)] max-w-[18ch]`}
        >
          {cta.title}
        </TextReveal>
      </div>

      <div className="mt-[var(--space-5)] grid items-start gap-[var(--space-4)] md:grid-cols-[minmax(0,1fr)_auto] md:gap-[var(--space-6)]">
        <div>
          <dl className="m-0 flex flex-col gap-[var(--space-3)]">
            <div className="flex flex-col gap-[0.35rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">
                  {cta.emailLabel}
                </TextReveal>
              </dt>
              <dd className="contact-cta__value m-0 break-words [overflow-wrap:anywhere]">
                <CopyLink
                  href={`mailto:${cta.email}`}
                  className="inline-flex min-h-11 items-center"
                  reveal
                >
                  {cta.email}
                </CopyLink>
              </dd>
            </div>

            <div className="flex flex-col gap-[0.35rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">
                  {cta.phoneLabel}
                </TextReveal>
              </dt>
              <dd className="contact-cta__value m-0" dir="ltr">
                <CopyLink
                  href={cta.phoneHref}
                  className="inline-flex min-h-11 items-center"
                  reveal
                >
                  {cta.phone}
                </CopyLink>
              </dd>
            </div>
          </dl>
        </div>

        <div className="justify-self-start md:justify-self-end">
          <RoundButton href="/contact" label={cta.button} />
        </div>
      </div>
    </section>
  );
}
