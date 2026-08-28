import { resumeConfig } from "../inputs";
import type { ContactKind } from "./contact-icons";
import type { FilterState, MatchResult } from "./filters";
import type { ResumeProject, ResumeSchema, ResumeWork } from "./types";

/** Print palette. Values live in resume.config.ts. */
export const PRINT = resumeConfig.theme.print;

export const PRINT_FONT_STACK = PRINT.fontStack;

/**
 * Footer text with a `{link}` placeholder. Exporters split on the placeholder
 * to make the portfolio URL a real link, so no exporter has to know what the
 * URL is or split the sentence on a literal domain.
 */
export const FOOTER_TEMPLATE = resumeConfig.footer.text;
export const FOOTER_LINK_TOKEN = "{link}";

/** Footer sentence with the link already flattened, for plain-text contexts. */
export function footerText(portfolioUrl: string): string {
  return FOOTER_TEMPLATE.replace(FOOTER_LINK_TOKEN, displayUrl(portfolioUrl));
}

/** Footer split into the text before and after the link. */
export function footerParts(): { before: string; after: string } {
  const [before = "", after = ""] = FOOTER_TEMPLATE.split(FOOTER_LINK_TOKEN);
  return { before, after };
}

/** Strips protocol and trailing slash so a URL reads as a label. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** Where the footer link points: explicit config wins, else the resume's own URL. */
export function footerHref(portfolioUrl: string): string {
  return resumeConfig.footer.linkHref || portfolioUrl;
}

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

/**
 * Year-only range ("2025 - 2026", or "2024"). How an open-ended role reads is
 * set by `dates.ongoing` in config: "current-year" runs the range to this year,
 * anything else is used as a literal label such as "Present".
 */
export function formatYearRange(startDate: string, endDate?: string): string {
  const start = new Date(startDate).getUTCFullYear();
  if (!endDate) {
    if (resumeConfig.dates.ongoing !== "current-year") {
      return `${start} - ${resumeConfig.dates.ongoing}`;
    }
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
  /** Labeled paragraphs keyed by `summary.blocks[].key` from config. */
  blocks: Record<string, string | null>;
  /** Paragraph matching `summary.emphasisPattern`, rendered emphasized. */
  emphasis: string | null;
}

/**
 * Splits `basics.summary` into its intro and any labeled paragraphs declared in
 * config. Markers, labels, and the emphasis pattern are all configurable, so a
 * resume can use "FOCUS:" or drop labeled blocks entirely.
 */
export function parseSummary(summary: string): ParsedSummary {
  const paragraphs = summary.split("\n\n").map((p) => p.trim());
  const intro = paragraphs[0] ?? "";

  const blocks: Record<string, string | null> = {};
  for (const block of resumeConfig.summary.blocks) {
    const match = paragraphs.find((p) => p.startsWith(block.marker));
    blocks[block.key] = match ? match.slice(block.marker.length).trim() : null;
  }

  const emphasisRe = new RegExp(resumeConfig.summary.emphasisPattern, "i");
  const emphasis = paragraphs.find((p) => emphasisRe.test(p)) ?? null;

  return { intro, blocks, emphasis };
}

/** Label for a configured summary block, for exporters that title them. */
export function summaryBlockLabel(key: string): string {
  return resumeConfig.summary.blocks.find((b) => b.key === key)?.label ?? key;
}

/**
 * The handmade resume ends most entries with a bold tech line
 * ("TypeScript, NextJS, React, Tachyons, React Native"). Detect those.
 */
/**
 * A tech list needs at least this many items, each short enough to be a
 * technology name rather than prose.
 */
const MIN_TECH_ITEMS = 3;
const MAX_TECH_ITEM_WORDS = 5;

export function isTechLine(highlight: string): boolean {
  const parts = highlight
    // A trailing period closes the sentence; it is not part of the last item.
    .replace(/[.;]$/, "")
    .split(/[,;]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < MIN_TECH_ITEMS) return false;
  return parts.every((p) => p.split(/\s+/).length <= MAX_TECH_ITEM_WORDS && !/[.!?]$/.test(p));
}

/**
 * Splits a trailing tech list off the end of a summary.
 *
 * Checks the last paragraph first, then the last sentence. Separators may be
 * commas or semicolons, and a closing period is tolerated — earlier versions
 * rejected both, so lists that ended in a period (Twilio, Yahoo) or used
 * semicolons (10up, Long Game) silently rendered unbolded while their
 * neighbours bolded, with nothing in the data to explain the difference.
 */
export function splitTrailingTechList(text: string): { body: string; tech: string | null } {
  const trimmed = text.trimEnd();

  const paraIdx = trimmed.lastIndexOf("\n\n");
  if (paraIdx !== -1) {
    const last = trimmed.slice(paraIdx + 2).trim();
    if (isTechLine(last)) return { body: trimmed.slice(0, paraIdx).trimEnd(), tech: last };
  }

  const sentIdx = trimmed.lastIndexOf(". ");
  if (sentIdx !== -1) {
    const last = trimmed.slice(sentIdx + 2).trim();
    if (isTechLine(last)) return { body: trimmed.slice(0, sentIdx + 1), tech: last };
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

export interface ContactRow {
  kind: ContactKind;
  text: string;
  href?: string;
}

/** Networks we render in the contact block, with their display labels. */
const PROFILE_NETWORKS: Record<string, { kind: ContactKind; label: string }> = {
  github: { kind: "github", label: "GitHub" },
  linkedin: { kind: "linkedin", label: "LinkedIn" },
  twitter: { kind: "x", label: "X" },
  x: { kind: "x", label: "X" },
};

/** Contact rows for the header block, derived from basics + profiles. */
export function contactRows(basics: ExportData["basics"]): ContactRow[] {
  const rows: ContactRow[] = [];
  if (basics.phone) rows.push({ kind: "phone", text: basics.phone });
  if (basics.email) {
    rows.push({ kind: "email", text: basics.email, href: `mailto:${basics.email}` });
  }
  if (basics.url) {
    rows.push({
      kind: "website",
      text: basics.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
      href: basics.url,
    });
  }
  for (const profile of basics.profiles ?? []) {
    const network = PROFILE_NETWORKS[profile.network.toLowerCase()];
    if (network) {
      rows.push({
        kind: network.kind,
        text: `${network.label} /${profile.username}`,
        href: profile.url,
      });
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
