type Props = {
  label: string;
  className?: string;
};

/** Small mono label above a hairline rule — the section opener used site-wide. */
export default function SectionHeading({ label, className }: Props) {
  return (
    <div className={className ? `section-heading ${className}` : "section-heading"}>
      <p className="ui-label">{label}</p>
      <hr className="section-heading__rule" />
    </div>
  );
}
