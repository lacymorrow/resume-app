import { resumeConfig } from "../inputs";
import type { ResumeFlavor } from "./flavors";
import { defaultSectionVisibility } from "./sections";
import { extractProjectTags, extractWorkTags } from "./tags";
import type { ResumeProject, ResumeSchema, ResumeWork, SectionVisibility } from "./types";

export interface FilterState {
  flavorId: string;
  sections: SectionVisibility;
  selectedTags: string[];
  tagMatchMode: "any" | "all";
  hiddenCompanies: string[];
  hiddenProjects: string[];
}

export const DEFAULT_FILTER_STATE: FilterState = {
  flavorId: "complete",
  sections: defaultSectionVisibility(),
  selectedTags: [],
  tagMatchMode: "any",
  hiddenCompanies: [],
  hiddenProjects: [],
};

export interface MatchResult {
  matched: boolean;
  score: number;
}

/** Work entries config hides from every flavor. */
function isExcluded(name: string): boolean {
  return resumeConfig.data.excludeWork.includes(name);
}

function matchesTags(
  entryTags: string[],
  selectedTags: string[],
  mode: "any" | "all"
): MatchResult {
  if (selectedTags.length === 0) return { matched: true, score: 1 };
  const entrySet = new Set(entryTags.map((t) => t.toLowerCase()));
  const matchCount = selectedTags.filter((t) => entrySet.has(t.toLowerCase())).length;
  if (mode === "any") return { matched: matchCount > 0, score: matchCount / selectedTags.length };
  return { matched: matchCount === selectedTags.length, score: matchCount / selectedTags.length };
}

/** Returns company names that are visible in the current flavor (not flavor-hidden) */
export function getFlavorVisibleCompanies(data: ResumeSchema, flavor: ResumeFlavor): string[] {
  return data.work
    .filter((w) => !isExcluded(w.name) && flavor.work[w.name]?.visible !== false)
    .map((w) => w.name);
}

/** Returns project names that are visible in the current flavor (not flavor-hidden) */
export function getFlavorVisibleProjects(data: ResumeSchema, flavor: ResumeFlavor): string[] {
  return data.projects.filter((p) => flavor.projects[p.name]?.visible !== false).map((p) => p.name);
}

/** Apply flavor overrides to work entries and compute tag matches */
export function resolveWork(
  data: ResumeSchema,
  flavor: ResumeFlavor,
  filters: FilterState
): {
  entries: (ResumeWork & { originalIndex: number })[];
  matches: Map<number, MatchResult>;
  tags: Map<number, string[]>;
} {
  const entries: (ResumeWork & { originalIndex: number })[] = [];
  const matches = new Map<number, MatchResult>();

  for (let i = 0; i < data.work.length; i++) {
    const base = data.work[i]!;
    if (isExcluded(base.name)) continue;

    const override = flavor.work[base.name];
    if (override?.visible === false) continue;
    if (filters.hiddenCompanies.includes(base.name)) continue;

    const entry: ResumeWork & { originalIndex: number } = {
      ...base,
      originalIndex: i,
      position: override?.position ?? base.position,
      summary: override?.summary ?? base.summary,
      highlights: override?.highlights ?? base.highlights,
      tech: override?.tech ?? base.tech,
    };

    entries.push(entry);
  }

  // Re-extract tags from overridden summaries
  const resolvedTags = new Map<number, string[]>();
  const resolvedWork = entries.map((e) => ({
    ...e,
    name: e.name,
    summary: e.summary,
    highlights: e.highlights,
  }));
  const freshTags = extractWorkTags(resolvedWork);
  for (let i = 0; i < entries.length; i++) {
    resolvedTags.set(entries[i]!.originalIndex, freshTags.get(i) ?? []);
  }

  // Recompute matches with resolved tags
  for (const entry of entries) {
    const entryTags = resolvedTags.get(entry.originalIndex) ?? [];
    matches.set(
      entry.originalIndex,
      matchesTags(entryTags, filters.selectedTags, filters.tagMatchMode)
    );
  }

  return { entries, matches, tags: resolvedTags };
}

/** Apply flavor overrides to project entries and compute tag matches */
export function resolveProjects(
  data: ResumeSchema,
  flavor: ResumeFlavor,
  filters: FilterState
): {
  entries: (ResumeProject & { originalIndex: number })[];
  matches: Map<number, MatchResult>;
  tags: Map<number, string[]>;
} {
  const entries: (ResumeProject & { originalIndex: number })[] = [];
  const matches = new Map<number, MatchResult>();

  for (let i = 0; i < data.projects.length; i++) {
    const base = data.projects[i]!;
    const override = flavor.projects[base.name];
    if (override?.visible === false) continue;
    if (filters.hiddenProjects.includes(base.name)) continue;

    const entry: ResumeProject & { originalIndex: number } = {
      ...base,
      originalIndex: i,
      summary: override?.summary ?? base.summary,
    };

    entries.push(entry);
  }

  // Re-extract tags from overridden summaries
  const resolvedTags = new Map<number, string[]>();
  const freshTags = extractProjectTags(entries);
  for (let i = 0; i < entries.length; i++) {
    resolvedTags.set(entries[i]!.originalIndex, freshTags.get(i) ?? []);
  }

  for (const entry of entries) {
    const entryTags = resolvedTags.get(entry.originalIndex) ?? [];
    matches.set(
      entry.originalIndex,
      matchesTags(entryTags, filters.selectedTags, filters.tagMatchMode)
    );
  }

  return { entries, matches, tags: resolvedTags };
}
