import { resumeConfig } from "../inputs";
import type { ResumeFlavor } from "./flavors";
import { DEFAULT_SECTIONS, type SectionDefinition } from "./sections";
import type { ResumeSchema } from "./types";

/**
 * Structural checks over resume data and flavors.
 *
 * The failure this exists to prevent: flavor overrides are keyed by entry name,
 * so a typo or a renamed company silently does nothing — the override is never
 * found and the entry renders unmodified. Nothing throws, nothing looks wrong.
 * These checks turn that into a build error.
 *
 * Deliberately dependency-free so the engine stays portable.
 */

export type IssueLevel = "error" | "warning";

export interface ValidationIssue {
  level: IssueLevel;
  path: string;
  message: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  errors: number;
  warnings: number;
}

/**
 * JSON Resume dates are ISO 8601: YYYY, YYYY-MM, or YYYY-MM-DD.
 *
 * `new Date()` alone is not enough of a check — the engine's parser scavenges a
 * year out of arbitrary prose, so `new Date("sometime in 2019")` yields
 * 2019-01-01 rather than an error, and the resume would quietly render the
 * wrong year. Match the shape first, then confirm it is a real calendar date.
 */
const ISO_DATE = /^\d{4}(-\d{2}(-\d{2})?)?$/;

function isParseableDate(date: string): boolean {
  if (!ISO_DATE.test(date)) return false;
  return !Number.isNaN(new Date(date).getTime());
}

/** Best-effort "did you mean" for a mistyped override key. */
function suggest(needle: string, haystack: string[]): string {
  const lower = needle.toLowerCase();
  const near = haystack.find(
    (h) =>
      h.toLowerCase() === lower ||
      h.toLowerCase().includes(lower) ||
      lower.includes(h.toLowerCase())
  );
  return near ? ` Did you mean "${near}"?` : "";
}

function duplicates(names: string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const name of names) {
    if (seen.has(name)) dupes.add(name);
    seen.add(name);
  }
  return Array.from(dupes);
}

export function validateResume(
  data: ResumeSchema,
  flavors: ResumeFlavor[],
  sections: SectionDefinition[] = DEFAULT_SECTIONS
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const err = (path: string, message: string) => issues.push({ level: "error", path, message });
  const warn = (path: string, message: string) => issues.push({ level: "warning", path, message });

  // ---- basics ----
  const basics = data.basics;
  if (!basics?.name) err("basics.name", "Required.");
  if (!basics?.url) warn("basics.url", "Missing; contact and footer links have nowhere to point.");
  else if (basics.url.startsWith("http://")) {
    warn("basics.url", "Uses http://, so exported links will not be secure.");
  }

  // ---- collections ----
  const workNames = (data.work ?? []).map((w) => w.name);
  const projectNames = (data.projects ?? []).map((p) => p.name);

  for (const dup of duplicates(workNames)) {
    err(
      "work",
      `Duplicate entry name "${dup}". Flavor overrides key on name, so only one of them can ever be targeted.`
    );
  }
  for (const dup of duplicates(projectNames)) {
    err("projects", `Duplicate project name "${dup}". Flavor overrides key on name.`);
  }

  (data.work ?? []).forEach((w, i) => {
    if (!w.name) err(`work[${i}].name`, "Required.");
    if (!w.position) warn(`work[${i}].position`, `Missing on "${w.name}".`);
    if (!w.startDate || !isParseableDate(w.startDate)) {
      err(`work[${i}].startDate`, `Unparseable date "${w.startDate}" on "${w.name}".`);
    } else if (w.endDate && isParseableDate(w.endDate)) {
      if (new Date(w.endDate) < new Date(w.startDate)) {
        err(`work[${i}].endDate`, `Ends before it starts on "${w.name}".`);
      }
    }
  });

  (data.projects ?? []).forEach((p, i) => {
    if (!p.name) err(`projects[${i}].name`, "Required.");
    if (p.startDate && !isParseableDate(p.startDate)) {
      err(`projects[${i}].startDate`, `Unparseable date "${p.startDate}" on "${p.name}".`);
    }
  });

  // ---- config ----
  for (const name of resumeConfig.data.excludeWork) {
    if (!workNames.includes(name)) {
      warn(
        "config.data.excludeWork",
        `"${name}" matches no work entry, so it excludes nothing.${suggest(name, workNames)}`
      );
    }
  }

  // ---- flavors ----
  const sectionKeys = sections.map((s) => s.key);
  for (const dup of duplicates(flavors.map((f) => f.id))) {
    err("flavors", `Duplicate flavor id "${dup}".`);
  }

  for (const flavor of flavors) {
    const at = `flavors.${flavor.id}`;
    if (!flavor.label) err(`${at}.label`, "Required.");
    if (!flavor.tagline) warn(`${at}.tagline`, "Missing; the rail shows an empty line.");

    for (const key of Object.keys(flavor.work)) {
      if (!workNames.includes(key)) {
        err(
          `${at}.work["${key}"]`,
          `No work entry by that name, so this override is silently ignored.${suggest(key, workNames)}`
        );
      }
    }
    for (const key of Object.keys(flavor.projects)) {
      if (!projectNames.includes(key)) {
        err(
          `${at}.projects["${key}"]`,
          `No project by that name, so this override is silently ignored.${suggest(key, projectNames)}`
        );
      }
    }
    for (const key of Object.keys(flavor.sections)) {
      if (!sectionKeys.includes(key)) {
        err(
          `${at}.sections.${key}`,
          `Not a registered section. Known sections: ${sectionKeys.join(", ")}.`
        );
      }
    }

    if (!flavor.statement.headline) {
      warn(`${at}.statement`, "No headline, so the hero block renders empty.");
    }
  }

  return {
    issues,
    errors: issues.filter((i) => i.level === "error").length,
    warnings: issues.filter((i) => i.level === "warning").length,
  };
}

/** Human-readable report. Empty string when there is nothing to say. */
export function formatValidation(result: ValidationResult): string {
  if (result.issues.length === 0) return "";
  const levels: IssueLevel[] = ["error", "warning"];
  return levels
    .flatMap((level) =>
      result.issues
        .filter((i) => i.level === level)
        .map((i) => `${level === "error" ? "ERROR" : "warn "}  ${i.path}\n        ${i.message}`)
    )
    .join("\n");
}
