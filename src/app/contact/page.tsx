import { copy } from "@/content/copy";
import ContactForm from "@/features/contact/ContactForm";
import ChapterLabel from "@/features/ui/ChapterLabel";
import CopyLink from "@/features/ui/CopyLink";
import PageFrame from "@/features/ui/PageFrame";
import DirectionalTransition from "@/features/transition/DirectionalTransition";
import TextReveal from "@/features/ui/TextReveal";
import {
  bodyMeasure,
  chapterFrame,
  displayStatement,
} from "@/features/ui/styles";
import PageTitle from "@/features/motion/PageTitle";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: copy.contact.label,
  description: copy.contact.lede,
  path: "/contact",
});

export default function ContactPage() {
  const { contact } = copy;

  return (
    <DirectionalTransition>
    <PageFrame
      className={`${chapterFrame} section-pad`}
    >
      <div className="chapter-open">
        <ChapterLabel index={4}>{contact.label}</ChapterLabel>

        <PageTitle>
          <TextReveal as="h1" className={`${displayStatement} mt-[var(--space-3)]`}>
            {contact.title}
          </TextReveal>
        </PageTitle>

        <TextReveal
          as="p"
          className={`${bodyMeasure} mt-[var(--space-3)] text-lede`}
        >
          {contact.lede}
        </TextReveal>
      </div>

      <div className="grid-12 mt-[var(--space-6)] items-start">
        <div className="lg:col-span-4">
          <TextReveal as="p" className="ui-label m-0" split="words">
            {contact.detailsLabel}
          </TextReveal>

          <dl className="m-0 mt-[var(--space-4)] flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-col gap-[0.4rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">{contact.emailLabel}</TextReveal>
              </dt>
              <dd className="m-0 break-words text-lede [overflow-wrap:anywhere]">
                <CopyLink
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-h-11 scroll-mt-[8rem] items-center"
                  reveal
                >
                  {contact.email}
                </CopyLink>
              </dd>
            </div>

            <div className="flex flex-col gap-[0.4rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">
                <TextReveal as="span" split="words">{contact.phoneLabel}</TextReveal>
              </dt>
              <dd
                className="m-0 text-lede"
                dir="ltr"
              >
                <CopyLink
                  href={contact.phoneHref}
                  className="inline-flex min-h-11 scroll-mt-[8rem] items-center"
                  reveal
                >
                  {contact.phone}
                </CopyLink>
              </dd>
            </div>
          </dl>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <ContactForm to={contact.email} labels={contact.form} />
        </div>
      </div>
    </PageFrame>
    </DirectionalTransition>
  );
}
