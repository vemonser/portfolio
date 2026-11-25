type Props = {
  data: Record<string, unknown>;
};

/** Structured data is inert JSON; keep it out of the React child stream. */
export default function JsonLd({ data }: Props) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
