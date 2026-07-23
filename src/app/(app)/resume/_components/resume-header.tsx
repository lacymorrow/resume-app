import type { ResumeBasics } from "../_lib/resume-types";
import { SIGNATURE, SIGNATURE_FONT_STACK, parseSummary, contactRows } from "../_lib/resume-export-shared";

export function ResumeHeader({ basics }: { basics: ResumeBasics }) {
  const summary = parseSummary(basics.summary);
  const contact = contactRows(basics);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  return (
    <header className="mb-8 print:mb-4" style={{ fontFamily: SIGNATURE_FONT_STACK }}>
      {/* Masthead — name left, contact right */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1
            className="text-4xl sm:text-5xl font-extrabold leading-none tracking-tight"
            style={{ color: SIGNATURE.ink, letterSpacing: "-0.02em" }}
          >
            {basics.name} <span className="font-normal text-[0.82em]">★</span>
          </h1>
          <p className="mt-2 text-sm sm:text-base" style={{ color: SIGNATURE.muted }}>
            {basics.label}
          </p>
        </div>

        <div className="text-xs leading-relaxed whitespace-nowrap sm:text-right sm:pt-1" style={{ color: SIGNATURE.ink }}>
          {location && (
            <div>
              <span style={{ color: SIGNATURE.muted }} className="inline-block w-4">⌘</span>
              {location}
            </div>
          )}
          {contact.map((row) => (
            <div key={row.text}>
              <span style={{ color: SIGNATURE.muted }} className="inline-block w-4">{row.glyph || ""}</span>
              {row.href ? (
                <a href={row.href} className="hover:underline" style={{ color: SIGNATURE.ink }}>
                  {row.text}
                </a>
              ) : (
                row.text
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Lede — bold muted intro */}
      <p
        className="resume-dropcap mt-4 text-sm sm:text-base font-bold max-w-[6.6in] leading-snug print:mt-3"
        style={{ color: SIGNATURE.muted }}
      >
        {summary.intro}
      </p>
    </header>
  );
}

export function ExpertiseBlock({ basics }: { basics: ResumeBasics }) {
  const summary = parseSummary(basics.summary);
  if (!summary.expertise) return null;

  return (
    <div style={{ color: SIGNATURE.body }}>
      <p className="text-sm leading-relaxed">{summary.expertise}</p>
      {summary.interested && (
        <p className="mt-1 text-sm leading-relaxed">{summary.interested}</p>
      )}
    </div>
  );
}
