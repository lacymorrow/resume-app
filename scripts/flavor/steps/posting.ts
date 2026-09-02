/** Step 1 — read the job posting. */

import { existsSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import type { Posting } from "../types";
import { readText } from "../utils";

/**
 * Short enough to be a mis-piped filename or an empty clipboard rather than a
 * posting. Generating a flavor from a fragment produces confident nonsense, so
 * it is worth refusing rather than warning.
 */
const MIN_LENGTH = 200;

export function readPosting(path: string | undefined, root: string): Posting {
  if (path) {
    const full = resolve(root, path);
    if (!existsSync(full)) throw new Error(`No such file: ${path}`);
    return { text: normalize(readText(full)), source: basename(full) };
  }

  if (process.stdin.isTTY) {
    throw new Error("No posting given. Pass a file path, or pipe the text in on stdin.");
  }

  return { text: normalize(readFileSync(0, "utf-8")), source: "stdin" };
}

/**
 * Postings pasted out of a browser arrive with hard-wrapped lines, non-breaking
 * spaces, and long runs of blanks. None of it carries meaning and all of it
 * costs tokens.
 */
function normalize(text: string): string {
  const cleaned = text
    .replace(/\r\n?/g, "\n")
    .replace(/ /g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (cleaned.length < MIN_LENGTH) {
    throw new Error(
      `That posting is only ${cleaned.length} characters — too short to tailor against. ` +
        "Paste the full description, responsibilities and requirements included."
    );
  }

  return cleaned;
}
