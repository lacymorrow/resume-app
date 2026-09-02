/** Step 5 — check the model against the resume it was given. */

import { FLAVORS } from "../../../src/resume/lib/flavors";
import { extractTagsFromText } from "../../../src/resume/lib/tags";
import type { ResumeSchema } from "../../../src/resume/lib/types";
import type { ValidationIssue } from "../../../src/resume/lib/validate";
import type { Prose, Selection } from "../types";

/** Numbers carry the claims that are easiest to inflate and hardest to spot. */
const NUMBER = /\d[\d,.]*%?/g;

const LIMITS: { key: keyof Prose | "headline" | "sub"; max: number; get: (p: Prose) => string }[] =
  [
    { key: "label", max: 40, get: (p) => p.label },
    { key: "description", max: 80, get: (p) => p.description },
    { key: "tagline", max: 70, get: (p) => p.tagline },
    { key: "expertise", max: 500, get: (p) => p.expertise },
    { key: "headline", max: 130, get: (p) => p.statement.headline },
    { key: "sub", max: 260, get: (p) => p.statement.sub },
  ];

/**
 * The two ways a generated flavor goes wrong quietly.
 *
 * A work key that does not match an entry name is dropped by the renderer
 * without complaint — the rewrite simply never appears, and the page looks
 * fine. And a summary can gain a number or a technology the job never involved,
 * which is the one failure mode that matters outside this repo: it puts a claim
 * on a resume that the person cannot stand behind in an interview.
 *
 * Both are errors, not warnings. Everything cosmetic is a warning.
 */
export function verifyProse(
  prose: Prose,
  data: ResumeSchema,
  selection: Selection
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const kept = new Map(
    selection.work.filter((c) => c.keep).map((c) => [c.name, data.work[c.index]] as const)
  );

  for (const [name, override] of Object.entries(prose.work)) {
    const entry = kept.get(name);
    if (!entry) {
      issues.push({
        level: "error",
        path: `work["${name}"]`,
        message: kept.size
          ? "no visible work entry by that name — the override would be silently ignored"
          : "no visible work entries to override",
      });
      continue;
    }

    const source = [entry.position, entry.summary, ...(entry.highlights ?? [])]
      .filter(Boolean)
      .join(" ");

    for (const field of ["position", "summary"] as const) {
      const text = override[field];
      if (!text) continue;

      for (const number of new Set(text.match(NUMBER) ?? [])) {
        if (!source.includes(number)) {
          issues.push({
            level: "error",
            path: `work["${name}"].${field}`,
            message: `"${number}" does not appear in the original entry`,
          });
        }
      }

      const sourceTags = new Set(extractTagsFromText(source));
      for (const tag of extractTagsFromText(text)) {
        if (!sourceTags.has(tag)) {
          issues.push({
            level: "error",
            path: `work["${name}"].${field}`,
            message: `"${tag}" is not in the original entry`,
          });
        }
      }
    }
  }

  const accents = new Set(FLAVORS.map((f) => f.accent));
  if (!accents.has(prose.accent)) {
    issues.push({
      level: "warning",
      path: "accent",
      message: `${prose.accent} is not one of the palette's accents`,
    });
  }

  for (const limit of LIMITS) {
    const value = limit.get(prose);
    if (value.length > limit.max) {
      issues.push({
        level: "warning",
        path: String(limit.key),
        message: `${value.length} characters, over the ${limit.max} the layout is built for`,
      });
    }
  }

  return issues;
}
