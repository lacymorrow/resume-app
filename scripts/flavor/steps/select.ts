/** Step 3 — decide what the flavor shows, without asking a model. */

import { resumeConfig } from "../../../resume.config";
import { extractProjectTags, extractWorkTags } from "../../../src/resume/lib/tags";
import type { ResumeSchema } from "../../../src/resume/lib/types";
import type { Candidate, GenerateOptions, Match, Selection } from "../types";

/**
 * Visibility is computed rather than generated.
 *
 * A language model asked "which of these jobs matter for this posting" answers
 * from the shape of the words — it drops the oldest entries, keeps the ones with
 * famous logos, and gives a different answer to the same posting twice. Tag
 * overlap gives the same cuts every run and can be read off the output, which is
 * what makes a generated flavor something you can check rather than trust.
 *
 * The model never sees an entry this step dropped, so it cannot write prose for
 * a job the resume is not going to show.
 */
export function selectEntries(
  data: ResumeSchema,
  match: Match,
  options: GenerateOptions
): Selection {
  return {
    work: selectWork(data, match, options),
    projects: selectProjects(data, match, options),
  };
}

function scoreOf(tags: string[], shared: string[]): number {
  if (shared.length === 0) return 0;
  const set = new Set(tags);
  return shared.filter((tag) => set.has(tag)).length / shared.length;
}

/** Why an entry was kept, short enough to sit in a column. */
function reasonFor(tags: string[], shared: string[]): string {
  const set = new Set(tags);
  const hits = shared.filter((tag) => set.has(tag));
  const shown = hits.slice(0, 2).join(", ");
  const rest = hits.length - 2;
  return `matches ${shown}${rest > 0 ? ` +${rest}` : ""}`;
}

function selectWork(data: ResumeSchema, match: Match, options: GenerateOptions): Candidate[] {
  const tagsByIndex = extractWorkTags(data.work);
  const excluded = new Set(resumeConfig.data.excludeWork);

  const candidates: Candidate[] = [];
  for (let i = 0; i < data.work.length; i++) {
    const entry = data.work[i];
    if (!entry || excluded.has(entry.name)) continue;
    const tags = tagsByIndex.get(i) ?? [];
    candidates.push({
      name: entry.name,
      index: i,
      tags,
      score: scoreOf(tags, match.shared),
      keep: false,
      reason: "",
    });
  }

  /**
   * The newest roles are kept whatever they score. A resume that drops the last
   * two years because the posting happens to use different words reads as a
   * gap, and an employment gap costs more than an off-topic entry.
   */
  const recent = candidates.slice(0, options.keepRecent);
  for (const candidate of recent) {
    candidate.keep = true;
    candidate.reason = "recent";
  }

  let budget = Math.max(0, options.maxWork - recent.length);
  const rest = candidates
    .slice(options.keepRecent)
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index);

  for (const candidate of rest) {
    if (budget === 0) break;
    candidate.keep = true;
    candidate.reason = reasonFor(candidate.tags, match.shared);
    budget--;
  }

  for (const candidate of candidates) {
    if (candidate.keep) continue;
    candidate.reason = candidate.score > 0 ? "past the limit" : "no overlap";
  }

  // Back into resume order, so the summary reads like the rendered page.
  return candidates.sort((a, b) => a.index - b.index);
}

function selectProjects(data: ResumeSchema, match: Match, options: GenerateOptions): Candidate[] {
  const tagsByIndex = extractProjectTags(data.projects);

  const candidates: Candidate[] = data.projects.map((entry, i) => {
    const tags = tagsByIndex.get(i) ?? [];
    return {
      name: entry.name,
      index: i,
      tags,
      score: scoreOf(tags, match.shared),
      keep: false,
      reason: "",
    };
  });

  const ranked = candidates
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, options.maxProjects);

  for (const candidate of ranked) {
    candidate.keep = true;
    candidate.reason = reasonFor(candidate.tags, match.shared);
  }

  /**
   * An empty projects section is worse than an imprecise one — the resume's own
   * order is the fallback ranking, so a posting that overlaps nothing still
   * shows work rather than a heading with nothing under it.
   */
  if (ranked.length === 0) {
    for (const candidate of candidates.slice(0, options.maxProjects)) {
      candidate.keep = true;
      candidate.reason = "portfolio floor";
    }
  }

  for (const candidate of candidates) {
    if (candidate.keep) continue;
    candidate.reason = candidate.score > 0 ? "past the limit" : "no overlap";
  }

  return candidates.sort((a, b) => a.index - b.index);
}
