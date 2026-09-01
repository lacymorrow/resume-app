import type {
  ResumeProject,
  ResumeSchema,
  ResumeWork,
  SectionKey,
  SectionVisibility,
} from "./types";

/**
 * Sections are declared here rather than hardcoded into each renderer, so a
 * resume can turn any collection on or off, reorder them, or rename their
 * headings without touching component code.
 *
 * Every renderer maps a differently-shaped JSON Resume collection onto one of
 * five normalized item shapes, which is what keeps the renderer count at five
 * instead of one per collection.
 */
export type SectionRenderer =
  | "timeline" // dated roles: work, volunteer
  | "projects" // named things with a blurb and a link
  | "keywords" // a label plus a list of terms: skills, languages, interests
  | "credentials" // dated awards/qualifications: education, awards, certificates, publications
  | "quotes"; // references

export interface SectionDefinition {
  /** Stable id used in flavors, URL state, and config. Never shown to readers. */
  key: SectionKey;
  /** Heading text. Overridable per resume. */
  label: string;
  /** Collection in resume.json this section draws from. */
  source: keyof ResumeSchema;
  renderer: SectionRenderer;
  /** Whether the section shows when a flavor does not say otherwise. */
  enabled: boolean;
}

export interface TimelineItem {
  key: string;
  title: string;
  org: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  url?: string;
  location?: string;
}

export interface ProjectItem {
  key: string;
  name: string;
  summary: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  featured?: boolean;
}

export interface KeywordItem {
  key: string;
  name: string;
  /** Skill level, language fluency — the qualifier that varies by collection. */
  detail?: string;
  keywords: string[];
}

export interface CredentialItem {
  key: string;
  title: string;
  subtitle?: string;
  startDate?: string;
  endDate?: string;
  summary?: string;
  details?: string[];
  url?: string;
}

export interface QuoteItem {
  key: string;
  quote: string;
  attribution: string;
}

export type NormalizedSection = { key: SectionKey; label: string } & (
  | { renderer: "timeline"; items: TimelineItem[] }
  | { renderer: "projects"; items: ProjectItem[] }
  | { renderer: "keywords"; items: KeywordItem[] }
  | { renderer: "credentials"; items: CredentialItem[] }
  | { renderer: "quotes"; items: QuoteItem[] }
);

/**
 * Default registry: every collection in the JSON Resume v1.0.0 schema, in the
 * order they read best on a resume. `volunteer`, `certificates`, and
 * `publications` are off by default only because most resumes leave them empty
 * — they render correctly the moment they have data.
 */
export const DEFAULT_SECTIONS: SectionDefinition[] = [
  { key: "work", label: "Selected Work", source: "work", renderer: "timeline", enabled: true },
  {
    key: "projects",
    label: "Open Source & Projects",
    source: "projects",
    renderer: "projects",
    enabled: true,
  },
  { key: "skills", label: "Skills", source: "skills", renderer: "keywords", enabled: true },
  {
    key: "volunteer",
    label: "Volunteering",
    source: "volunteer",
    renderer: "timeline",
    enabled: false,
  },
  {
    key: "education",
    label: "Education",
    source: "education",
    renderer: "credentials",
    enabled: true,
  },
  {
    key: "certificates",
    label: "Certificates",
    source: "certificates",
    renderer: "credentials",
    enabled: false,
  },
  {
    key: "publications",
    label: "Publications",
    source: "publications",
    renderer: "credentials",
    enabled: false,
  },
  { key: "awards", label: "Awards", source: "awards", renderer: "credentials", enabled: true },
  {
    key: "languages",
    label: "Languages",
    source: "languages",
    renderer: "keywords",
    enabled: false,
  },
  {
    key: "interests",
    label: "Interests",
    source: "interests",
    renderer: "keywords",
    enabled: true,
  },
  {
    key: "references",
    label: "References",
    source: "references",
    renderer: "quotes",
    enabled: true,
  },
];

/** Default visibility map, used when a flavor omits a section key. */
export function defaultSectionVisibility(
  sections: SectionDefinition[] = DEFAULT_SECTIONS
): SectionVisibility {
  return Object.fromEntries(sections.map((s) => [s.key, s.enabled]));
}

/** All-on visibility map. Flavors that show everything build from this. */
export function allSectionsVisible(
  sections: SectionDefinition[] = DEFAULT_SECTIONS
): SectionVisibility {
  return Object.fromEntries(sections.map((s) => [s.key, true]));
}

export function findSection(
  key: SectionKey,
  sections: SectionDefinition[] = DEFAULT_SECTIONS
): SectionDefinition | undefined {
  return sections.find((s) => s.key === key);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Work and projects arrive pre-resolved because flavor overrides and
 * hide-toggles have already been applied to them upstream. Every other
 * collection is read straight off the resume.
 */
export interface SectionSources {
  work: ResumeWork[];
  projects: ResumeProject[];
}

function normalize(
  def: SectionDefinition,
  data: ResumeSchema,
  resolved: SectionSources
): NormalizedSection | null {
  const label = def.label;
  const key = def.key;

  switch (def.renderer) {
    case "timeline": {
      const raw =
        def.source === "work"
          ? resolved.work
          : ((data[def.source] ?? []) as unknown as Record<string, unknown>[]);
      const items: TimelineItem[] = (raw as Record<string, unknown>[]).map((e, i) => ({
        key: `${key}-${i}`,
        title: String(e.position ?? ""),
        // `name` on work, `organization` on volunteer
        org: String(e.name ?? e.organization ?? ""),
        startDate: e.startDate as string | undefined,
        endDate: e.endDate as string | undefined,
        summary: e.summary as string | undefined,
        highlights: e.highlights as string[] | undefined,
        url: e.url as string | undefined,
        location: e.location as string | undefined,
      }));
      return items.length ? { key, label, renderer: "timeline", items } : null;
    }

    case "projects": {
      const items: ProjectItem[] = resolved.projects.map((p, i) => ({
        key: `${key}-${i}`,
        name: p.name,
        summary: p.summary,
        startDate: p.startDate,
        endDate: p.endDate,
        url: p.url,
        featured: p.featured,
      }));
      return items.length ? { key, label, renderer: "projects", items } : null;
    }

    case "keywords": {
      const raw = (data[def.source] ?? []) as unknown as Record<string, unknown>[];
      let items: KeywordItem[] = raw.map((e, i) => ({
        key: `${key}-${i}`,
        // `name` on skills/interests, `language` on languages
        name: String(e.name ?? e.language ?? ""),
        // `level` on skills, `fluency` on languages
        detail: (e.level ?? e.fluency) as string | undefined,
        keywords: (e.keywords as string[] | undefined) ?? [],
      }));
      // Collections of bare names (interests, usually) would otherwise render as
      // a column of labels with nothing beside them. Collapse them into one
      // run-on list instead.
      const bareNames =
        items.length > 1 && items.every((i) => !i.detail && i.keywords.length === 0);
      if (bareNames) {
        items = [{ key: `${key}-all`, name: "", keywords: items.map((i) => i.name) }];
      }
      return items.length ? { key, label, renderer: "keywords", items } : null;
    }

    case "credentials": {
      const raw = (data[def.source] ?? []) as unknown as Record<string, unknown>[];
      const items: CredentialItem[] = raw.map((e, i) => {
        // institution (education) | title (awards) | name (certificates, publications)
        const title = String(e.institution ?? e.title ?? e.name ?? "");
        // Education reads "Bachelor of Science, Computer Science"; the others
        // carry a single issuing body.
        const subtitle =
          nonEmpty(e.studyType as string) || nonEmpty(e.area as string)
            ? [e.studyType, e.area].filter(nonEmpty).join(", ")
            : ((e.awarder ?? e.issuer ?? e.publisher) as string | undefined);
        return {
          key: `${key}-${i}`,
          title,
          subtitle,
          startDate: e.startDate as string | undefined,
          // Single-date collections land on endDate so renderers show one year.
          endDate: (e.endDate ?? e.date ?? e.releaseDate) as string | undefined,
          summary: e.summary as string | undefined,
          details: e.courses as string[] | undefined,
          url: e.url as string | undefined,
        };
      });
      return items.length ? { key, label, renderer: "credentials", items } : null;
    }

    case "quotes": {
      const raw = (data[def.source] ?? []) as unknown as Record<string, unknown>[];
      const items: QuoteItem[] = raw.map((e, i) => ({
        key: `${key}-${i}`,
        quote: String(e.reference ?? ""),
        attribution: String(e.name ?? ""),
      }));
      return items.length ? { key, label, renderer: "quotes", items } : null;
    }
  }
}

/**
 * Build the ordered list of sections to render. Sections that are switched off,
 * or that resolve to zero items, drop out — so an empty `publications` array
 * never leaves a bare heading behind.
 */
export function buildSections(
  data: ResumeSchema,
  resolved: SectionSources,
  visibility: SectionVisibility,
  sections: SectionDefinition[] = DEFAULT_SECTIONS
): NormalizedSection[] {
  const out: NormalizedSection[] = [];
  for (const def of sections) {
    if (!(visibility[def.key] ?? def.enabled)) continue;
    const section = normalize(def, data, resolved);
    if (section) out.push(section);
  }
  return out;
}
