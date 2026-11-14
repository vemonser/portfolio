type Props = {
  label: string;
  className?: string;
};

/** Small mono label above a hairline rule — the section opener used site-wide. */
export default function SectionHeading({ label, className }: Props) {
  return (
    <div className={className}>
      <p className="ui-label">{label}</p>
      <hr className="mt-4 h-px w-full border-0 bg-bone/15" />
    </div>
  );
}
