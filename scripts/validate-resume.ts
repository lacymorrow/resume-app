/**
 * Validates resume.json and the flavor definitions against each other.
 * Run: bun run validate:resume
 *
 * Exits non-zero on errors so it can gate a build. Warnings are printed but
 * do not fail.
 */

import { existsSync } from "node:fs";
import { resumeConfig } from "../resume.config";
import resumeJson from "../resume.json";
import { FLAVORS } from "../src/resume/lib/flavors";
import type { ResumeSchema } from "../src/resume/lib/types";
import { formatValidation, validateResume } from "../src/resume/lib/validate";

const data = resumeJson as unknown as ResumeSchema;
const result = validateResume(data, FLAVORS);
const report = formatValidation(result);

/**
 * App Router directory names are static, so site.flavorPrefix and the folder
 * serving the flavor pages have to agree. Nothing else would catch a rename:
 * the build would simply stop producing the flavor routes.
 */
const prefix = resumeConfig.site.flavorPrefix;
const flavorDir = new URL(`../src/app/(resume)/${prefix}/[flavor]/page.tsx`, import.meta.url);
if (!existsSync(flavorDir)) {
  console.error(
    `\nresume validation failed — site.flavorPrefix is "${prefix}" but ` +
      `src/app/(resume)/${prefix}/[flavor]/page.tsx does not exist.\n` +
      "Rename the route folder to match, or change the config back."
  );
  process.exit(1);
}

if (report) console.log(report);

const counts = `${result.errors} error${result.errors === 1 ? "" : "s"}, ${result.warnings} warning${
  result.warnings === 1 ? "" : "s"
}`;

if (result.errors > 0) {
  console.error(`\nresume validation failed — ${counts}`);
  process.exit(1);
}

console.log(report ? `\nresume validation passed — ${counts}` : "resume validation passed");
