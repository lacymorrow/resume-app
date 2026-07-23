import type { MatchResult } from "../_lib/resume-filters";
import { SIGNATURE, formatYearRange, formatProjectYear, isTechLine, splitTrailingTechList, splitProjectSummary } from "../_lib/resume-export-shared";

interface ResumeEntryCardProps {
  title: string;
  subtitle: string;
  startDate: string;
  endDate?: string;
  location?: string;
  summary: string;
  tags: string[];
  url?: string;
  highlights?: string[];
  match?: MatchResult;
  sector?: string;
  featured?: boolean;
  variant?: "work" | "project";
}

export function ResumeEntryCard({
  title, subtitle, startDate, endDate, location, summary, tags, url,
  highlights, match, sector, featured, variant = "work",
}: ResumeEntryCardProps) {
  const isMatched = !match || match.matched;
  const dateStr = variant === "project"
    ? formatProjectYear(startDate, endDate)
    : formatYearRange(startDate, endDate);

  const { body: summaryBody, tech: summaryTech } = splitTrailingTechList(summary ?? "");
  let displayTitle = title;
  let displayBody = summaryBody;

  if (variant === "project") {
    const { tagline, body } = splitProjectSummary(summary);
    if (tagline) {
      displayTitle = `${title}: ${tagline}`;
      displayBody = body;
    }
  }

  return (
    <div
      data-match={isMatched}
      className="resume-entry group grid gap-x-4 mb-4 break-inside-avoid transition-all duration-500 data-[match=false]:opacity-20 data-[match=false]:grayscale"
      style={{ gridTemplateColumns: "128px 1fr" }}
    >
      {/* Meta column — right-aligned */}
      <div className="text-right hidden sm:block">
        <div className="text-sm font-bold" style={{ color: SIGNATURE.pink }}>
          {dateStr}
        </div>
        <div className="text-xs font-bold leading-tight mt-0.5" style={{ color: SIGNATURE.ink }}>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ textDecorationColor: SIGNATURE.underline, textUnderlineOffset: "2px" }}
            >
              {subtitle}
            </a>
          ) : (
            subtitle
          )}
          {featured && <span className="font-normal ml-1">★</span>}
        </div>
        {sector && (
          <div className="text-[7.5pt] mt-0.5" style={{ color: SIGNATURE.muted }}>
            ({sector})
          </div>
        )}
      </div>

      {/* Detail column */}
      <div className="min-w-0">
        {/* Mobile-only meta (visible below sm breakpoint) */}
        <div className="sm:hidden mb-1">
          <span className="text-xs font-bold" style={{ color: SIGNATURE.pink }}>{dateStr}</span>
          <span className="mx-1.5" style={{ color: SIGNATURE.rail }}>·</span>
          <span className="text-xs font-bold" style={{ color: SIGNATURE.ink }}>{subtitle}</span>
          {featured && <span className="font-normal ml-1">★</span>}
          {sector && <span className="text-[10px] ml-1" style={{ color: SIGNATURE.muted }}>({sector})</span>}
        </div>

        <h3
          className="text-base font-bold leading-snug mb-1"
          style={{ color: SIGNATURE.blue }}
        >
          {displayTitle}
        </h3>

        {displayBody && (
          <p className="text-sm leading-relaxed mb-1 whitespace-pre-wrap" style={{ color: SIGNATURE.body }}>
            {displayBody}
          </p>
        )}

        {summaryTech && (
          <p className="text-sm mb-1">
            <strong style={{ color: SIGNATURE.ink }}>{summaryTech}</strong>
          </p>
        )}

        {highlights && highlights.length > 0 && (
          <ul className="pl-3 text-sm leading-relaxed list-disc" style={{ color: SIGNATURE.body }}>
            {highlights.map((h, i) => {
              const isLast = i === highlights.length - 1;
              const tech = isLast && isTechLine(h);
              return (
                <li key={h} className="mb-0.5" style={{ color: tech ? SIGNATURE.ink : undefined }}>
                  {tech ? <strong>{h}</strong> : h}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
