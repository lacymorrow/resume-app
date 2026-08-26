/**
 * One-time migration: lift trailing tech lists out of prose into an explicit
 * `tech` array on each entry.
 *
 * Run: bun run scripts/migrate-tech-lines.ts [--write]
 *
 * Without --write it prints what it would change and touches nothing.
 *
 * Why this exists: the renderers used to guess which trailing sentence was a
 * tech list and bold it. The guess was inconsistent — a list ending in a period
 * or separated by semicolons was silently left unbolded while its neighbours
 * were bolded — so the same kind of content rendered two different ways with
 * nothing to explain it. After this migration the data says what the tech list
 * is and the guess is retired.
 *
 * This is deliberately more permissive than the old heuristic, because a human
 * reviews the resulting JSON diff before it lands.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const WRITE = process.argv.includes("--write");

const MAX_WORDS_PER_ITEM = 5;
const MIN_ITEMS = 3;

/**
 * Splits a trailing tech list off a summary. Accepts commas or semicolons and
 * tolerates a closing period, both of which the old heuristic rejected.
 */
function splitTech(text: string): { body: string; tech: string[] } | null {
  const trimmed = text.trimEnd();

  // Candidate boundaries: last paragraph break, then last sentence break.
  const boundaries: { at: number; skip: number }[] = [];
  const para = trimmed.lastIndexOf("\n\n");
  if (para !== -1) boundaries.push({ at: para, skip: 2 });
  const sentence = trimmed.lastIndexOf(". ");
  if (sentence !== -1) boundaries.push({ at: sentence + 1, skip: 1 });

  for (const { at, skip } of boundaries) {
    const tail = trimmed.slice(at + skip).trim();
    const items = tail
      .replace(/[.;]$/, "")
      .split(/[,;]/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (items.length < MIN_ITEMS) continue;
    if (items.some((p) => p.split(/\s+/).length > MAX_WORDS_PER_ITEM)) continue;
    // A sentence-ending item means this is prose, not a list.
    if (items.some((p) => /[.!?]$/.test(p))) continue;

    return { body: trimmed.slice(0, at).trimEnd(), tech: items };
  }
  return null;
}

interface Change {
  where: string;
  tech: string[];
}
const changes: Change[] = [];

function migrateSummary(holder: Record<string, unknown>, where: string): boolean {
  const summary = holder.summary;
  if (typeof summary !== "string" || holder.tech) return false;
  const split = splitTech(summary);
  if (!split) return false;
  holder.summary = split.body;
  holder.tech = split.tech;
  changes.push({ where, tech: split.tech });
  return true;
}

// ---- resume.json ----
const resumePath = join(ROOT, "resume.json");
const resume = JSON.parse(readFileSync(resumePath, "utf8"));
for (const entry of resume.work ?? []) {
  migrateSummary(entry, `work: ${entry.name}`);
}

// ---- flavors ----
const flavorDir = join(ROOT, "flavors");
const flavorFiles = readdirSync(flavorDir).filter((n) => n.endsWith(".json"));
const flavors = new Map<string, Record<string, unknown>>();
for (const file of flavorFiles) {
  const parsed = JSON.parse(readFileSync(join(flavorDir, file), "utf8"));
  flavors.set(file, parsed);
  for (const [name, override] of Object.entries<Record<string, unknown>>(
    (parsed.work ?? {}) as Record<string, Record<string, unknown>>
  )) {
    migrateSummary(override, `${file} :: ${name}`);
  }
}

for (const change of changes) {
  console.log(`${change.where}\n    tech: ${change.tech.join(" · ")}`);
}

if (WRITE) {
  writeFileSync(resumePath, `${JSON.stringify(resume, null, 2)}\n`);
  for (const [file, parsed] of flavors) {
    writeFileSync(join(flavorDir, file), `${JSON.stringify(parsed, null, 2)}\n`);
  }
  console.log(`\nwrote ${changes.length} changes`);
} else {
  console.log(`\n${changes.length} entries would change. Re-run with --write to apply.`);
}
