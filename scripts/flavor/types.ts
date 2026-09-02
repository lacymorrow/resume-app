/** Shared shapes for the flavor generator pipeline. */

import type { ResumeSchema } from "../../src/resume/lib/types";

/** A job posting, as read from a file or stdin. */
export interface Posting {
  text: string;
  /** Where it came from, for the run summary. */
  source: string;
}

/**
 * What the posting and the resume have in common, in the resume's own tag
 * vocabulary.
 */
export interface Match {
  /** Tags the posting asks for and the resume can speak to. */
  shared: string[];
  /** Tags the posting asks for that appear nowhere in the resume. */
  missing: string[];
}

/** One work entry or project, scored against the posting. */
export interface Candidate {
  name: string;
  /** Position in the source array, which is reverse-chronological. */
  index: number;
  tags: string[];
  /** Share of the posting's shared tags this entry covers, 0–1. */
  score: number;
  keep: boolean;
  /** Why it was kept or dropped, shown in the run summary. */
  reason: string;
}

export interface Selection {
  work: Candidate[];
  projects: Candidate[];
}

/** The prose the model is responsible for. Everything else is computed. */
export interface Prose {
  label: string;
  description: string;
  tagline: string;
  expertise: string;
  accent: string;
  statement: { headline: string; sub: string };
  /** Keyed by work entry name. Only entries whose angle actually changes. */
  work: Record<string, { position?: string; summary?: string }>;
  /**
   * What the posting asks for that the resume cannot answer. Never written to
   * the flavor file — it is a note to the person applying, and the honest
   * counterweight to a variant tuned to look like a match.
   */
  gaps: string[];
}

export interface GenerateOptions {
  root: string;
  /** Undefined means read the posting from stdin. */
  postingPath?: string;
  id?: string;
  model: string;
  /** Most work entries to keep. */
  maxWork: number;
  maxProjects: number;
  /** Newest N work entries are kept whatever they score. */
  keepRecent: number;
  /** Most summaries the model may rewrite. */
  maxRewrites: number;
  dryRun: boolean;
  register: boolean;
  force: boolean;
  yes: boolean;
}

export interface Context {
  data: ResumeSchema;
  options: GenerateOptions;
}
