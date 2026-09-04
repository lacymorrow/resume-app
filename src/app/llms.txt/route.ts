import { llmsIndex } from "@/resume/lib/export-markdown";

/**
 * /llms.txt — what this site is and where each version of it lives.
 *
 * Generated rather than committed as a static file. The one it replaced was
 * inherited from the template this repo was forked from and spent months
 * telling every crawler that resume.lacy.sh was a Next.js starter kit; a file
 * built from the flavor registry cannot drift like that.
 */
export const dynamic = "force-static";

export function GET(): Response {
  return new Response(llmsIndex(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
