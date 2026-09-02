/** Step 6 — assemble the flavor file and put it on disk. */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { type FlavorFile, FLAVORS, resolveFlavor } from "../../../src/resume/lib/flavors";
import type { ResumeSchema } from "../../../src/resume/lib/types";
import { validateResume, type ValidationIssue } from "../../../src/resume/lib/validate";
import type { Prose, Selection } from "../types";
import { writeJson } from "../utils";

/**
 * A flavor names only what it changes: hidden entries and rewritten prose. The
 * kept-and-unmodified majority is absent from the file, which is what keeps a
 * generated flavor diffable against the hand-written ones.
 */
export function buildFlavorFile(id: string, prose: Prose, selection: Selection): FlavorFile {
  const work: FlavorFile["work"] = {};
  for (const candidate of selection.work) {
    if (!candidate.keep) work[candidate.name] = { visible: false };
  }
  for (const [name, override] of Object.entries(prose.work)) {
    if (work[name]) continue; // hidden entries take precedence over a rewrite
    const trimmed = {
      ...(override.position ? { position: override.position } : {}),
      ...(override.summary ? { summary: override.summary } : {}),
    };
    if (Object.keys(trimmed).length) work[name] = trimmed;
  }

  const projects: FlavorFile["projects"] = {};
  for (const candidate of selection.projects) {
    if (!candidate.keep) projects[candidate.name] = { visible: false };
  }

  return {
    id,
    label: prose.label,
    description: prose.description,
    tagline: prose.tagline,
    expertise: prose.expertise,
    accent: prose.accent,
    statement: prose.statement,
    ...(Object.keys(work).length ? { work } : {}),
    ...(Object.keys(projects).length ? { projects } : {}),
  };
}

/**
 * The same structural check the build runs, applied to the new flavor before it
 * is written rather than after `bun run build` fails.
 */
export function validateFlavor(file: FlavorFile, data: ResumeSchema): ValidationIssue[] {
  const result = validateResume(data, [...FLAVORS, resolveFlavor(file)]);
  return result.issues.filter((issue) => issue.path.includes(file.id));
}

export function flavorPath(root: string, id: string): string {
  return join(root, "flavors", `${id}.json`);
}

export function writeFlavor(root: string, file: FlavorFile): string {
  const path = flavorPath(root, file.id);
  writeJson(path, file);
  return path;
}

/**
 * A flavor file on disk does nothing until it is in the registry, and the
 * registry is a hand-maintained array. Forgetting it produces no error, no
 * route, and no clue — so the CLI offers to do it.
 */
export function registerFlavor(root: string, id: string): "added" | "already-registered" {
  const path = join(root, "flavors", "index.ts");
  if (!existsSync(path)) throw new Error("flavors/index.ts not found");

  const source = readFileSync(path, "utf-8");
  const identifier = toIdentifier(id);
  if (new RegExp(`^import ${identifier} from `, "m").test(source)) return "already-registered";

  const exportMatch = source.match(/export const FLAVOR_FILES = \[([^\]]*)\];/);
  if (!exportMatch || exportMatch.index === undefined) {
    throw new Error("Could not find the FLAVOR_FILES array in flavors/index.ts");
  }

  const imports = [...source.matchAll(/^import (\S+) from "\.\/.+\.json";$/gm)];
  if (imports.length === 0) {
    throw new Error("Could not find the flavor imports in flavors/index.ts");
  }

  // The block is sorted, and both biome and eslint will put it back if it is
  // not, so the new line goes where it belongs rather than at the end.
  const importLine = `import ${identifier} from "./${id}.json";`;
  const after = imports.filter((m) => (m[1] ?? "") < identifier).at(-1);
  const anchor = after ?? imports[0];
  if (!anchor || anchor.index === undefined) {
    throw new Error("Could not place the import in flavors/index.ts");
  }
  const insertAt = after ? anchor.index + anchor[0].length : anchor.index;
  const withImport = after
    ? `${source.slice(0, insertAt)}\n${importLine}${source.slice(insertAt)}`
    : `${source.slice(0, insertAt)}${importLine}\n${source.slice(insertAt)}`;

  const updated = withImport.replace(
    /export const FLAVOR_FILES = \[([^\]]*)\];/,
    (_full, inner: string) => `export const FLAVOR_FILES = [${inner.trim()}, ${identifier}];`
  );

  writeFileSync(path, updated);
  return "added";
}

/** `senior-frontend` is a filename; `seniorFrontend` is a binding. */
function toIdentifier(id: string): string {
  return id.replace(/-([a-z0-9])/g, (_m, char: string) => char.toUpperCase());
}
