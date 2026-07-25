import type { FilterState, MatchResult } from "./resume-filters";
import type { ResumeProject, ResumeSchema, ResumeWork } from "./resume-types";

/**
 * The "Signature" palette — sampled from Lacy's handmade 2026 resume.
 * Pink for dates/accents, cyan-blue for role titles, warm grays for structure.
 */
export const SIGNATURE = {
  ink: "#3f4041", // name + strong text (dark warm gray, not black)
  body: "#404042",
  muted: "#77787b",
  rail: "#b9bbbd", // left-rail section labels
  underline: "#9a9ca0",
  pink: "#e8308a",
  blue: "#29a5df",
  footer: "#8a8c90",
} as const;

export const SIGNATURE_FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export const FOOTER_TEXT =
  "References available upon request. For a complete portfolio please visit lacymorrow.com";

export interface ExportData {
  basics: ResumeSchema["basics"] & { label: string; summary: string };
  workEntries: (ResumeWork & { originalIndex: number })[];
  workMatches: Map<number, MatchResult>;
  projectEntries: (ResumeProject & { originalIndex: number })[];
  projectMatches: Map<number, MatchResult>;
  skills: ResumeSchema["skills"];
  education: ResumeSchema["education"];
  interests: ResumeSchema["interests"];
  awards: ResumeSchema["awards"];
  references: ResumeSchema["references"];
  filters: FilterState;
}

export function getVisibleWork(data: ExportData): (ResumeWork & { originalIndex: number })[] {
  return data.workEntries.filter((entry) => {
    const match = data.workMatches.get(entry.originalIndex);
    return !match || match.matched;
  });
}

export function getVisibleProjects(
  data: ExportData
): (ResumeProject & { originalIndex: number })[] {
  return data.projectEntries.filter((entry) => {
    const match = data.projectMatches.get(entry.originalIndex);
    return !match || match.matched;
  });
}

/** Year-only range, matching the handmade resume ("2025 - 2026", or "2024"). */
export function formatYearRange(startDate: string, endDate?: string): string {
  const start = new Date(startDate).getUTCFullYear();
  if (!endDate) {
    // Ongoing roles read "2025 - 2026" in the handmade resume, never "Present"
    const now = new Date().getUTCFullYear();
    return start === now ? `${start}` : `${start} - ${now}`;
  }
  const end = new Date(endDate).getUTCFullYear();
  return start === end ? `${start}` : `${start} - ${end}`;
}

/** Projects read as a single start year in the handmade resume unless truly ranged. */
export function formatProjectYear(startDate: string, endDate?: string): string {
  if (!endDate) return `${new Date(startDate).getUTCFullYear()}`;
  return formatYearRange(startDate, endDate);
}

export interface ParsedSummary {
  intro: string;
  expertise: string | null;
  interested: string | null;
  qualities: string | null;
}

/** Split the summary blob into its labeled paragraphs. */
export function parseSummary(summary: string): ParsedSummary {
  const paragraphs = summary.split("\n\n").map((p) => p.trim());
  const intro = paragraphs[0] ?? "";
  const expertise =
    paragraphs.find((p) => p.startsWith("EXPERTISE:"))?.replace(/^EXPERTISE:\s*/, "") ?? null;
  const qualities =
    paragraphs.find((p) => p.startsWith("QUALITIES:"))?.replace(/^QUALITIES:\s*/, "") ?? null;
  const interested = paragraphs.find((p) => /^I (especially|particularly)/i.test(p)) ?? null;
  return { intro, expertise, interested, qualities };
}

/**
 * The handmade resume ends most entries with a bold tech line
 * ("TypeScript, NextJS, React, Tachyons, React Native"). Detect those.
 */
export function isTechLine(highlight: string): boolean {
  const parts = highlight
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 3) return false;
  return parts.every((p) => p.split(/\s+/).length <= 4 && !/[.!?]$/.test(p));
}

/**
 * The handmade resume ends entries with the tech stack in bold. When a
 * summary's final paragraph or sentence is a comma-separated tech list,
 * split it off so renderers can bold it.
 */
export function splitTrailingTechList(text: string): { body: string; tech: string | null } {
  const paraIdx = text.lastIndexOf("\n\n");
  if (paraIdx !== -1) {
    const last = text.slice(paraIdx + 2).trim();
    if (isTechLine(last)) return { body: text.slice(0, paraIdx).trimEnd(), tech: last };
  }
  const sentIdx = text.lastIndexOf(". ");
  if (sentIdx !== -1) {
    const last = text.slice(sentIdx + 2).trim();
    if (last.split(",").length >= 4 && isTechLine(last)) {
      return { body: text.slice(0, sentIdx + 1), tech: last };
    }
  }
  return { body: text, tech: null };
}

/**
 * Split a project summary into a short tagline (for the blue title,
 * "Lacy Shell: AI Coding Agent for Your Terminal") and the remaining body.
 */
export function splitProjectSummary(summary: string): { tagline: string | null; body: string } {
  const idx = summary.indexOf(". ");
  const first = idx === -1 ? summary : summary.slice(0, idx + 1);
  const cleaned = first.replace(/\.$/, "");
  if (cleaned.length > 0 && cleaned.length <= 64) {
    const body = idx === -1 ? "" : summary.slice(idx + 2);
    return { tagline: cleaned, body };
  }
  return { tagline: null, body: summary };
}

/** Contact rows for the header block, derived from basics + profiles. */
export function contactRows(
  basics: ExportData["basics"]
): { glyph: string; text: string; href?: string }[] {
  const rows: { glyph: string; text: string; href?: string }[] = [];
  if (basics.phone) rows.push({ glyph: "✆", text: basics.phone });
  if (basics.email) rows.push({ glyph: "✉", text: basics.email, href: `mailto:${basics.email}` });
  if (basics.url) {
    rows.push({
      glyph: "⌂",
      text: basics.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: basics.url,
    });
  }
  for (const profile of basics.profiles ?? []) {
    const network = profile.network.toLowerCase();
    if (network === "github" || network === "linkedin") {
      const label = network === "github" ? "GitHub" : "LinkedIn";
      rows.push({ glyph: "", text: `${label} /${profile.username}`, href: profile.url });
    }
  }
  return rows;
}

/** Escape special regex characters so tech keywords like "C++" match safely. */
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Build the set of tech keywords worth bolding inline, from the skills data.
 * Short/ambiguous words are excluded so prose doesn't get spuriously bolded.
 */
const AMBIGUOUS_KEYWORDS = new Set([
  "testing",
  "caching",
  "automation",
  "localization",
  "funnels",
  "cms",
  "landing pages",
  "product launches",
  "build tools",
  "distributed systems",
]);

export function buildTechKeywords(skills: ResumeSchema["skills"]): string[] {
  const keywords = new Set<string>();
  for (const group of skills) {
    for (const kw of group.keywords) {
      const cleaned = kw.trim();
      if (cleaned.length >= 3 && !AMBIGUOUS_KEYWORDS.has(cleaned.toLowerCase())) {
        keywords.add(cleaned);
      }
    }
  }
  // Longest first so "React Native" wins over "React"
  return [...keywords].sort((a, b) => b.length - a.length);
}

/**
 * Bold known tech keywords inside an already-HTML-escaped string.
 * Mirrors the hand-bolding in the original resume.
 */
export function boldTechTermsHtml(escapedText: string, keywords: string[]): string {
  if (keywords.length === 0) return escapedText;
  const pattern = new RegExp(`(?<![\\w>])(${keywords.map(escapeRegExp).join("|")})(?![\\w<])`, "g");
  return escapedText.replace(pattern, "<strong>$1</strong>");
}

export function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escXml(s: string): string {
  return esc(s);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
