import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";
import type { MatchResult } from "../_lib/resume-filters";

interface ResumeEntryCardProps {
  title: string; subtitle: string; dateRange: string; location?: string;
  summary: string; tags: string[]; url?: string; highlights?: string[];
  match?: MatchResult; sector?: string;
}

function formatDateRange(startDate: string, endDate?: string): string {
  const fmt = (d: string) => new Date(d).toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" });
  const start = fmt(startDate);
  if (!endDate) return `${start} — Present`;
  const end = fmt(endDate);
  if (start === end) return start;
  const startYear = new Date(startDate).getUTCFullYear();
  const endYear = new Date(endDate).getUTCFullYear();
  if (startYear === endYear) {
    const startMonth = new Date(startDate).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
    const endMonth = new Date(endDate).toLocaleDateString(undefined, { month: "short", timeZone: "UTC" });
    return startMonth === endMonth ? `${start}` : `${startMonth} — ${endMonth} ${endYear}`;
  }
  return `${start} — ${end}`;
}

export { formatDateRange };

export function ResumeEntryCard({ title, subtitle, dateRange, location, summary, tags, url, highlights, match, sector }: ResumeEntryCardProps) {
  const isMatched = !match || match.matched;
  return (
    <div data-match={isMatched} className="resume-entry group relative py-5 transition-all duration-500 data-[match=false]:opacity-20 data-[match=false]:grayscale">
      {/* Date + Location as a prominent typographic element */}
      <div className="mb-2 flex items-baseline gap-3">
        <span className="font-serif text-xs font-medium uppercase tracking-[0.15em] text-primary/70">
          {dateRange}
        </span>
        {location && (
          <>
            <span className="text-border">·</span>
            <span className="text-xs text-muted-foreground/60">{location}</span>
          </>
        )}
      </div>

      {/* Title + Company */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-serif text-xl font-semibold leading-tight text-foreground">
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 decoration-primary/30 decoration-1 underline-offset-4 hover:underline">
                {title}
                <ExternalLink className="h-3 w-3 text-primary/40" />
              </a>
            ) : title}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-muted-foreground">
            {subtitle}
            {sector && <span className="ml-2 text-xs font-normal italic text-primary/50">{sector}</span>}
          </p>
        </div>
      </div>

      {/* Summary */}
      <p className="mt-3 text-sm leading-relaxed text-foreground/70">{summary}</p>

      {/* Highlights as refined bullet list */}
      {highlights && highlights.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-l border-primary/15 pl-4">
          {highlights.map((h) => (
            <li key={h} className="text-sm leading-relaxed text-foreground/65">{h}</li>
          ))}
        </ul>
      )}

      {/* Technology tags */}
      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline"
              className="border-border/60 bg-transparent text-[11px] font-normal text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
