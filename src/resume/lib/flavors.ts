import { FLAVOR_FILES } from "../inputs";
import { defaultSectionVisibility } from "./sections";
import type { SectionVisibility } from "./types";

/**
 * A flavor is a complete resume variant for a target role.
 *
 * resume.json is the full truth; a flavor is an overlay on top of it that
 * rewrites titles and summaries, hides entries, and switches sections off.
 * Flavors live as JSON in /flavors so they can be edited, generated, or
 * exported from the UI without touching TypeScript.
 */

export interface WorkOverride {
  /** false hides the entry entirely. Absent means "render it unchanged". */
  visible?: boolean;
  position?: string;
  summary?: string;
  highlights?: string[];
}

export interface ProjectOverride {
  visible?: boolean;
  summary?: string;
}

export interface FlavorStatement {
  /** `<em>` runs render as accented serif italics. */
  headline: string;
  sub: string;
}

/** The shape of a /flavors/*.json file. */
export interface FlavorFile {
  id: string;
  label: string;
  description: string;
  /** Replaces basics.label in the rail. */
  tagline: string;
  /** Replaces the expertise block in the summary. */
  expertise: string;
  accent?: string;
  statement?: FlavorStatement;
  /** Only the sections that differ from the registry defaults. */
  sections?: Partial<SectionVisibility>;
  /** Keyed by work entry name. */
  work?: Record<string, WorkOverride>;
  /** Keyed by project name. */
  projects?: Record<string, ProjectOverride>;
}

/** A flavor with defaults filled in, which is what the renderers consume. */
export interface ResumeFlavor {
  id: string;
  label: string;
  description: string;
  tagline: string;
  expertise: string;
  accent: string;
  statement: FlavorStatement;
  sections: SectionVisibility;
  work: Record<string, WorkOverride>;
  projects: Record<string, ProjectOverride>;
}

const DEFAULT_ACCENT = "#EDEAE3";

const FALLBACK_STATEMENT: FlavorStatement = {
  headline: "",
  sub: "",
};

/**
 * Fills a flavor file out into a complete flavor. Section visibility layers the
 * file's overrides on the registry defaults, so a flavor only has to name what
 * it changes and adding a section does not mean editing every flavor.
 */
export function resolveFlavor(file: FlavorFile): ResumeFlavor {
  return {
    id: file.id,
    label: file.label,
    description: file.description,
    tagline: file.tagline,
    expertise: file.expertise,
    accent: file.accent ?? DEFAULT_ACCENT,
    statement: file.statement ?? FALLBACK_STATEMENT,
    sections: { ...defaultSectionVisibility(), ...(file.sections ?? {}) } as SectionVisibility,
    work: file.work ?? {},
    projects: file.projects ?? {},
  };
}

export const FLAVORS: ResumeFlavor[] = (FLAVOR_FILES as FlavorFile[]).map(resolveFlavor);

export function findFlavor(id: string | undefined): ResumeFlavor {
  return FLAVORS.find((f) => f.id === id) ?? FLAVORS[0]!;
}
