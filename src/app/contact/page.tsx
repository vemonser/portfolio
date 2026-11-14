import { copy } from "@/content/copy";
import ContactForm from "@/features/contact/ContactForm";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import PageFrame from "@/features/ui/PageFrame";
import Reveal from "@/features/ui/Reveal";
import { bodyMeasure, chapterFrame, displayTitle } from "@/features/ui/styles";

export const metadata = {
  title: copy.contact.title,
  description: copy.contact.lede,
};

export default function ContactPage() {
  const { contact } = copy;

  return (
    <PageFrame
      className={`${chapterFrame} pb-[calc(var(--inset-chapter)+4rem)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <Reveal className="chapter-open">
        <ChapterLabel index={4}>{contact.label}</ChapterLabel>

        <h1 className={`${displayTitle} mt-[var(--space-3)]`}>
          {contact.title}
        </h1>

        <p
          className={`${bodyMeasure} mt-[var(--space-3)] text-[clamp(1.05rem,1.5vw,1.3rem)]`}
        >
          {contact.lede}
        </p>
      </Reveal>

      <div className="mt-[var(--space-8)] grid items-start gap-[var(--space-7)] lg:grid-cols-12 lg:gap-x-[var(--space-5)]">
        <Reveal className="lg:col-span-4">
          <p className="ui-label m-0">{contact.detailsLabel}</p>

          <dl className="m-0 mt-[var(--space-4)] flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-col gap-[0.4rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">{contact.emailLabel}</dt>
              <dd className="m-0 break-words text-[clamp(1.05rem,1.5vw,1.25rem)] [overflow-wrap:anywhere]">
                <LinkLine
                  href={`mailto:${contact.email}`}
                  className="inline-flex min-h-11 scroll-mt-[8rem] items-center"
                >
                  {contact.email}
                </LinkLine>
              </dd>
            </div>

            <div className="flex flex-col gap-[0.4rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">{contact.phoneLabel}</dt>
              <dd
                className="m-0 text-[clamp(1.05rem,1.5vw,1.25rem)]"
                dir="ltr"
              >
                <LinkLine
                  href={contact.phoneHref}
                  className="inline-flex min-h-11 scroll-mt-[8rem] items-center"
                >
                  {contact.phone}
                </LinkLine>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={100} className="lg:col-span-7 lg:col-start-6">
          <ContactForm
            to={contact.email}
            endpoint={process.env.NEXT_PUBLIC_CONTACT_ENDPOINT}
            labels={contact.form}
          />
        </Reveal>
      </div>
    </PageFrame>
  );
}
