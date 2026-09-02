#!/usr/bin/env bun
/**
 * Generate a resume flavor from a job posting.
 * Run: bun run flavor <posting.txt>
 *
 * The pipeline is deliberately lopsided. Reading the posting, scoring every
 * entry against it, and deciding what the flavor shows are all deterministic —
 * same posting, same cuts, and the reasoning prints as a table you can argue
 * with. Only the prose is generated, and only over the entries that survived.
 *
 * See scripts/flavor/steps/select.ts for why visibility is computed rather than
 * asked for, and steps/verify.ts for what the model is checked against.
 */

import * as p from "@clack/prompts";
import pc from "picocolors";
import { existsSync } from "node:fs";
import { relative } from "node:path";
import { fileURLToPath } from "node:url";
import resumeJson from "../../resume.json";
import type { ResumeSchema } from "../../src/resume/lib/types";
import {
  buildFlavorFile,
  flavorPath,
  registerFlavor,
  validateFlavor,
  writeFlavor,
} from "./steps/emit";
import { matchPosting } from "./steps/match";
import { readPosting } from "./steps/posting";
import { assertProvider, writeProse } from "./steps/prose";
import { selectEntries } from "./steps/select";
import { verifyProse } from "./steps/verify";
import type { Candidate, GenerateOptions, Prose } from "./types";
import { errorText, parseFlag, parseNumberFlag, setupCleanExit, slugify } from "./utils";

setupCleanExit();

const ROOT = fileURLToPath(new URL("../..", import.meta.url));

const DEFAULTS = {
  model: "claude-sonnet-5",
  maxWork: 10,
  maxProjects: 8,
  keepRecent: 3,
  maxRewrites: 6,
};

function printHelp(): void {
  console.log(`
${pc.bold("flavor")} — Generate a resume flavor from a job posting

${pc.bold("USAGE")}
  ${pc.green("bun run flavor")} [posting-file] [options]
  ${pc.dim("pbpaste |")} ${pc.green("bun run flavor")} ${pc.dim("--id acme")}

${pc.bold("OPTIONS")}
  ${pc.yellow("--id <slug>")}          Flavor id, also the filename and URL segment
  ${pc.yellow("--model <name>")}       Model to write the prose (default: ${DEFAULTS.model})
  ${pc.yellow("--max-work <n>")}       Most work entries to keep (default: ${DEFAULTS.maxWork})
  ${pc.yellow("--max-projects <n>")}   Most projects to keep (default: ${DEFAULTS.maxProjects})
  ${pc.yellow("--keep-recent <n>")}    Newest roles kept whatever they score (default: ${DEFAULTS.keepRecent})
  ${pc.yellow("--max-rewrites <n>")}   Most summaries the model may rewrite (default: ${DEFAULTS.maxRewrites})
  ${pc.yellow("--dry-run")}            Print the selection and stop, without generating
  ${pc.yellow("--register")}           Add the flavor to flavors/index.ts without asking
  ${pc.yellow("--force")}              Overwrite an existing flavor file
  ${pc.yellow("--yes, -y")}            Skip confirmations
  ${pc.yellow("--help, -h")}           Show this help

${pc.bold("HOW IT WORKS")}
  1. The posting is read in the resume's own tag vocabulary (lib/tags.ts).
  2. Every work entry and project is scored by tag overlap. Visibility is
     computed from those scores, not generated.
  3. A model rewrites prose for the entries that survived, and only prose.
  4. The result is checked for invented numbers and technologies, then
     validated the same way ${pc.green("bun run validate:resume")} validates the repo.

${pc.dim("Generation drives the `claude` CLI in print mode, using the login already on this machine.")}
`);
}

function parseOptions(argv: string[]): GenerateOptions {
  const positional = argv.find((arg) => !arg.startsWith("-"));
  const id = parseFlag(argv, "--id");

  return {
    root: ROOT,
    postingPath: positional,
    id: id ? slugify(id) : undefined,
    model: parseFlag(argv, "--model") ?? DEFAULTS.model,
    maxWork: parseNumberFlag(argv, "--max-work", DEFAULTS.maxWork),
    maxProjects: parseNumberFlag(argv, "--max-projects", DEFAULTS.maxProjects),
    keepRecent: parseNumberFlag(argv, "--keep-recent", DEFAULTS.keepRecent),
    maxRewrites: parseNumberFlag(argv, "--max-rewrites", DEFAULTS.maxRewrites),
    dryRun: argv.includes("--dry-run"),
    register: argv.includes("--register"),
    force: argv.includes("--force"),
    yes: argv.includes("--yes") || argv.includes("-y"),
  };
}

/** One line per entry, so the cuts can be read rather than trusted. */
function renderCandidates(candidates: Candidate[]): string {
  const width = Math.max(...candidates.map((c) => c.name.length));
  return candidates
    .map((candidate) => {
      // Padding happens before colouring: escape codes have no width on screen
      // but do have length, so a coloured string pads to the wrong column.
      const name = candidate.name.padEnd(width);
      const score = (candidate.score > 0 ? `${Math.round(candidate.score * 100)}%` : "—").padStart(
        4
      );
      const line = `${name}  ${score}  ${truncate(candidate.reason, REASON_WIDTH)}`;
      return candidate.keep ? `${pc.green("keep")}  ${line}` : pc.dim(`drop  ${line}`);
    })
    .join("\n");
}

/** Long enough to name a few tags, short enough not to wrap the clack box. */
const REASON_WIDTH = 26;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) return printHelp();

  const options = parseOptions(argv);
  const data = resumeJson as unknown as ResumeSchema;

  p.intro(pc.bgCyan(pc.black(" flavor ")));

  const posting = readPosting(options.postingPath, options.root);
  p.log.step(`Read the posting from ${pc.cyan(posting.source)} (${posting.text.length} chars)`);

  const match = matchPosting(posting, data);
  if (match.shared.length === 0) {
    p.log.warn(
      "The posting names nothing the resume already covers. The selection will fall back to the most recent roles."
    );
  } else {
    p.log.info(`${pc.bold("Shared")}   ${match.shared.join(", ")}`);
  }
  if (match.missing.length) {
    p.log.warn(`${pc.bold("Asked for, not on the resume")}   ${match.missing.join(", ")}`);
  }

  const selection = selectEntries(data, match, options);
  p.note(renderCandidates(selection.work), "Work");
  p.note(renderCandidates(selection.projects), "Projects");

  const keptWork = selection.work.filter((c) => c.keep).length;
  const keptProjects = selection.projects.filter((c) => c.keep).length;
  p.log.step(
    `Keeping ${pc.bold(String(keptWork))} of ${selection.work.length} roles and ` +
      `${pc.bold(String(keptProjects))} of ${selection.projects.length} projects`
  );

  if (options.dryRun) {
    p.outro(pc.dim("Dry run — nothing generated, nothing written."));
    return;
  }

  assertProvider();

  let id = options.id;
  if (!id) {
    const answer = await p.text({
      message: "Flavor id (the filename and the URL segment)",
      placeholder: "acme-platform",
      validate: (value) => (value?.trim() ? undefined : "An id is required"),
    });
    if (p.isCancel(answer)) return cancel();
    id = slugify(answer);
  }

  const path = flavorPath(options.root, id);
  if (existsSync(path) && !options.force) {
    const overwrite =
      options.yes ||
      (await p.confirm({ message: `${relative(options.root, path)} exists. Overwrite?` }));
    if (p.isCancel(overwrite)) return cancel();
    if (!overwrite) return cancel("Kept the existing flavor.");
  }

  const spinner = p.spinner();
  spinner.start(`Writing prose with ${options.model}`);
  let prose: Prose;
  try {
    prose = writeProse(posting, data, selection, options);
  } catch (err) {
    spinner.stop(pc.red("Generation failed"));
    throw err;
  }
  spinner.stop(`${pc.bold(prose.label)} — ${prose.description}`);

  p.note(
    [
      `${pc.dim("tagline")}   ${prose.tagline}`,
      `${pc.dim("accent")}    ${prose.accent}`,
      `${pc.dim("headline")}  ${prose.statement.headline.replace(/<\/?em>/g, "")}`,
      `${pc.dim("sub")}       ${prose.statement.sub}`,
      `${pc.dim("rewrites")}  ${Object.keys(prose.work).join(", ") || "none"}`,
    ].join("\n"),
    "Prose"
  );

  if (prose.gaps.length) {
    p.log.warn(`${pc.bold("Not covered by this resume")}   ${prose.gaps.join(", ")}`);
  }

  const file = buildFlavorFile(id, prose, selection);
  const issues = [...verifyProse(prose, data, selection), ...validateFlavor(file, data)];
  const errors = issues.filter((issue) => issue.level === "error");

  if (issues.length) {
    p.note(
      issues
        .map(
          (issue) =>
            `${issue.level === "error" ? pc.red("error") : pc.yellow("warn ")}  ${pc.dim(issue.path)}  ${issue.message}`
        )
        .join("\n"),
      "Checks"
    );
  }

  if (errors.length) {
    // An invented number or technology is the one failure worth stopping for:
    // it puts a claim on a resume that cannot be defended in the interview.
    const proceed = await p.confirm({
      message: `${errors.length} error${errors.length === 1 ? "" : "s"}. Write the file anyway?`,
      initialValue: false,
    });
    if (p.isCancel(proceed) || !proceed) return cancel("Nothing written.");
  } else if (!options.yes) {
    const proceed = await p.confirm({ message: `Write ${relative(options.root, path)}?` });
    if (p.isCancel(proceed) || !proceed) return cancel("Nothing written.");
  }

  writeFlavor(options.root, file);
  p.log.success(`Wrote ${pc.cyan(relative(options.root, path))}`);

  let register = options.register;
  if (!register && !options.yes) {
    const answer = await p.confirm({ message: "Add it to flavors/index.ts?" });
    if (p.isCancel(answer)) return cancel();
    register = answer;
  }

  if (register) {
    const result = registerFlavor(options.root, id);
    p.log.success(
      result === "added"
        ? `Registered in ${pc.cyan("flavors/index.ts")} — it will render at ${pc.cyan(`/${id}`)}`
        : "Already registered in flavors/index.ts"
    );
  } else {
    p.log.info(`Add it to ${pc.cyan("flavors/index.ts")} when you want it to render.`);
  }

  p.outro(`Review it, then ${pc.green("bun run validate:resume")}.`);
}

function cancel(message = "Cancelled."): void {
  p.cancel(message);
  process.exit(130);
}

main().catch((err) => {
  p.log.error(errorText(err));
  process.exit(1);
});
