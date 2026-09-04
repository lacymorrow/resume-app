/**
 * A JSON-LD block.
 *
 * Structured data has to reach the document as the literal contents of a
 * script tag, so there is no way to render it except through
 * dangerouslySetInnerHTML. The escape below is what makes that safe: a "<" in
 * any resume field — a summary that mentions "<1s" — would otherwise be able
 * to close the script element early.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: the only way to emit JSON-LD
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
