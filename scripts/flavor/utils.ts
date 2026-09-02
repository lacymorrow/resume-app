/**
 * Process and filesystem helpers for the flavor CLI.
 *
 * Kept to the same shape as the helpers in shipx so the two CLIs read alike:
 * argv-form exec, no shell, and errors reduced to the one line worth printing.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

export function exec(
  file: string,
  args: string[],
  opts?: { cwd?: string; input?: string; maxBuffer?: number }
): string {
  return execFileSync(file, args, {
    cwd: opts?.cwd,
    input: opts?.input,
    stdio: opts?.input === undefined ? ["ignore", "pipe", "pipe"] : "pipe",
    encoding: "utf-8",
    // Model responses run to a few KB, well past the 1 MB default only when
    // something has gone wrong, but a truncated JSON body fails as a parse
    // error rather than as the size problem it actually is.
    maxBuffer: opts?.maxBuffer ?? 64 * 1024 * 1024,
  }) as string;
}

export function which(command: string): boolean {
  try {
    execFileSync("command", ["-v", command], { shell: "/bin/sh", stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

export function readText(path: string): string {
  return readFileSync(path, "utf-8");
}

/** JSON with the repo's prettier settings, so a generated file needs no reformat. */
export function writeJson(path: string, data: unknown): void {
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

export function errorText(err: unknown): string {
  if (err instanceof Error) {
    if ("stderr" in err && typeof err.stderr === "string" && err.stderr.trim())
      return err.stderr.trim();
    return err.message;
  }
  return String(err);
}

export function parseFlag(argv: string[], flag: string): string | undefined {
  const idx = argv.indexOf(flag);
  if (idx === -1 || idx === argv.length - 1) return undefined;
  const next = argv[idx + 1];
  if (!next || next.startsWith("--")) return undefined;
  return next;
}

export function parseNumberFlag(argv: string[], flag: string, fallback: number): number {
  const raw = parseFlag(argv, flag);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${flag} expects a non-negative number, got "${raw}"`);
  }
  return value;
}

/**
 * Ctrl-C during a clack prompt leaves the cursor hidden, which persists in the
 * shell after the process is gone.
 */
export function setupCleanExit(): void {
  process.on("SIGINT", () => {
    process.stdout.write("\x1B[?25h\n");
    process.exit(130);
  });
}

/** Slug suitable for a flavor id, a filename, and a URL segment. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "custom"
  );
}
