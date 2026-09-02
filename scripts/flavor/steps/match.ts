/** Step 2 — read the posting in the resume's own vocabulary. */

import { extractTagsFromText, getAllTags } from "../../../src/resume/lib/tags";
import type { ResumeSchema } from "../../../src/resume/lib/types";
import type { Match, Posting } from "../types";

/**
 * A posting and a resume rarely spell the same technology the same way, so both
 * sides are canonicalized through the alias table in lib/tags.ts before they are
 * compared. What survives the intersection is what the resume can honestly
 * claim; what does not is worth printing, because a posting asking for six
 * things the resume never mentions is a signal about the application, not a bug
 * in the generator.
 */
export function matchPosting(posting: Posting, data: ResumeSchema): Match {
  const wanted = extractTagsFromText(posting.text);
  const known = new Set(getAllTags(data));

  return {
    shared: wanted.filter((tag) => known.has(tag)).sort(),
    missing: wanted.filter((tag) => !known.has(tag)).sort(),
  };
}
