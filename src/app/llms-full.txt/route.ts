import { resumeMarkdown } from "@/resume/lib/export-markdown";
import { DEFAULT_FLAVOR_ID } from "@/resume/lib/routes";

/**
 * /llms-full.txt — the complete resume as Markdown.
 *
 * The default flavor, which is the one that hides nothing, so a reader that
 * cannot run JavaScript still gets every role and every project rather than
 * whichever subset a role-specific cut leaves in.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(resumeMarkdown(DEFAULT_FLAVOR_ID), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
