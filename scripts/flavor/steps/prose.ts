/** Step 4 — the only part a model writes. */

import { FLAVORS } from "../../../src/resume/lib/flavors";
import type { ResumeSchema } from "../../../src/resume/lib/types";
import type { GenerateOptions, Posting, Prose, Selection } from "../types";
import { errorText, exec, which } from "../utils";

/**
 * Generation runs through the `claude` CLI rather than an SDK.
 *
 * It reuses the login already on the machine, so there is no key to put in a
 * .env that a public repo has to keep out of git, and the model is a flag
 * rather than a dependency version. The cost is a binary on PATH, which is
 * checked for up front so the failure arrives before the posting is read.
 */
const CLI = "claude";

const SYSTEM_PROMPT = `You rewrite resume prose for a specific job posting.

You are given a candidate's real resume entries and a posting. You re-angle what
is already there: choosing which true thing to lead with, and in whose words.

Absolute rules:
- Never introduce an employer, title, date, metric, team size, or technology
  that is not already present in the entry you are rewriting.
- Never inflate scope. "Contributed to" does not become "led".
- Keep the trailing technology list of a summary intact; it is what the site's
  tag index reads.
- Output raw JSON only. No prose, no code fences, no commentary.`;

export function assertProvider(): void {
  if (which(CLI)) return;
  throw new Error(
    `\`${CLI}\` is not on PATH. The generator drives Claude Code in print mode; ` +
      "install it from https://claude.com/claude-code, or run with --dry-run to " +
      "see the selection without generating prose."
  );
}

export function writeProse(
  posting: Posting,
  data: ResumeSchema,
  selection: Selection,
  options: GenerateOptions
): Prose {
  const raw = callModel(buildPrompt(posting, data, selection, options), options.model);
  return parseProse(raw);
}

/** The accents already in use, so a generated flavor cannot land off-palette. */
function palette(): string[] {
  return [...new Set(FLAVORS.map((f) => f.accent))];
}

function buildPrompt(
  posting: Posting,
  data: ResumeSchema,
  selection: Selection,
  options: GenerateOptions
): string {
  const kept = selection.work.filter((c) => c.keep);
  const entries = kept
    .map((candidate) => {
      const entry = data.work[candidate.index];
      if (!entry) return "";
      const highlights = entry.highlights?.length
        ? `\n  highlights: ${entry.highlights.join(" | ")}`
        : "";
      return `- ${entry.name}\n  title: ${entry.position}\n  summary: ${entry.summary ?? "(none)"}${highlights}`;
    })
    .filter(Boolean)
    .join("\n");

  const projects = selection.projects
    .filter((c) => c.keep)
    .map((c) => `- ${c.name}: ${data.projects[c.index]?.summary ?? ""}`)
    .join("\n");

  return `# The posting

${posting.text}

# The candidate

${data.basics.name} — ${data.basics.label}

${data.basics.summary}

# Entries this resume will show

These are fixed. They were chosen by tag overlap with the posting, not by you.
You may rewrite their prose; you may not add to their facts or change the set.

${entries}

# Projects it will show

${projects}

# What to return

Raw JSON, exactly this shape:

{
  "label": "the role this variant targets, Title Case, max 34 chars",
  "description": "comma-separated themes, max 70 chars, no trailing period",
  "tagline": "role + role + role, max 60 chars, lower-case after the first word",
  "expertise": "semicolon-separated capabilities drawn only from what the entries above already demonstrate, max 400 chars",
  "accent": "one of ${palette().join(", ")}",
  "statement": {
    "headline": "one sentence, max 110 chars, wrapping 1-2 key phrases in <em></em>",
    "sub": "one or two sentences, max 220 chars, naming concrete work from the entries above"
  },
  "work": {
    "<exact entry name>": { "position": "optional retitle", "summary": "optional rewrite" }
  },
  "gaps": ["requirements the posting names that these entries genuinely do not cover"]
}

Rules for "work":
- At most ${options.maxRewrites} entries. Rewrite only where the posting changes
  which part of the job matters; leave the rest out and they render unchanged.
- Keys must match the entry names above character for character. A key that does
  not match is silently ignored by the renderer, so a typo loses the rewrite.
- A retitle must still describe the job that was actually done.`;
}

function callModel(prompt: string, model: string): string {
  let stdout: string;
  try {
    stdout = exec(
      CLI,
      [
        "--print",
        "--output-format",
        "json",
        "--model",
        model,
        "--system-prompt",
        SYSTEM_PROMPT,
        // Nothing here needs the filesystem, the network, or an MCP server, and
        // a tool call would only add latency and a chance to wander.
        "--strict-mcp-config",
        "--disallowed-tools",
        "Bash",
        "Edit",
        "Write",
        "Read",
        "Task",
        "WebFetch",
        "WebSearch",
      ],
      { input: prompt }
    );
  } catch (err) {
    throw new Error(`claude failed: ${errorText(err)}`);
  }

  const events: unknown = JSON.parse(stdout);
  const list = Array.isArray(events) ? events : [events];
  const result = list.find(
    (event): event is { type: string; subtype?: string; result?: string; is_error?: boolean } =>
      typeof event === "object" && event !== null && (event as { type?: string }).type === "result"
  );

  if (!result) throw new Error("claude returned no result event");
  if (result.is_error || typeof result.result !== "string") {
    throw new Error(`claude returned an error: ${result.subtype ?? "unknown"}`);
  }
  return result.result;
}

/**
 * Models fence JSON even when told not to, and occasionally prepend a sentence.
 * Both are recoverable without a second round trip: take the outermost braces.
 */
function parseProse(raw: string): Prose {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) {
    throw new Error(`No JSON object in the model's reply:\n${raw.slice(0, 400)}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    throw new Error(`The model's reply is not valid JSON: ${errorText(err)}`);
  }

  const prose = parsed as Partial<Prose>;
  const missing = (["label", "description", "tagline", "expertise", "accent"] as const).filter(
    (key) => typeof prose[key] !== "string" || !prose[key]
  );
  if (missing.length) throw new Error(`The model omitted: ${missing.join(", ")}`);
  if (!prose.statement?.headline || !prose.statement?.sub) {
    throw new Error("The model omitted the statement headline or sub");
  }

  return {
    label: prose.label as string,
    description: prose.description as string,
    tagline: prose.tagline as string,
    expertise: prose.expertise as string,
    accent: prose.accent as string,
    statement: prose.statement,
    work: prose.work ?? {},
    gaps: Array.isArray(prose.gaps) ? prose.gaps.filter((g) => typeof g === "string") : [],
  };
}
