// Relative, and resume.config.ts has no imports of its own: next.config.ts
// transpiles this file without path aliases (see the note on Redirect below).

import type { Route } from "next";
import { resumeConfig } from "../../resume.config";

/**
 * Redirect type used by Next.js config.
 * Defined here (not in @/lib/utils/redirect) because next.config.ts imports
 * this file and cannot pull in next/navigation at transpile time.
 */
/** Next's conditional-match clause, used here to catch legacy query strings. */
export interface RouteHas {
  type: "header" | "query" | "cookie";
  key: string;
  /** May contain a named capture group referenced as `:name` in destination. */
  value?: string;
}

export interface Redirect {
  source: Route | (string & {});
  destination: Route | (string & {});
  permanent: boolean;
  has?: RouteHas[];
}

/**
 * Next.js redirect configuration.
 * Imported by next.config.ts — keep route aliases centralized here.
 */
/* eslint-disable-next-line @typescript-eslint/require-await */
export const redirects = async (): Promise<Redirect[]> => {
  return [
    /**
     * Flavors used to be a query parameter; they are path segments now so each
     * one can be prerendered. Existing links keep working. Matched at the edge,
     * before the static page is served, so "/" stays a static file.
     *
     * The destination follows site.flavorPrefix, which is empty by default —
     * flavors sit at the root.
     */
    {
      source: "/",
      has: [{ type: "query", key: "flavor", value: "(?<flavor>[a-z0-9-]+)" }],
      destination: `${resumeConfig.site.flavorPrefix ? `/${resumeConfig.site.flavorPrefix}` : ""}/:flavor`,
      permanent: true,
    },

    /**
     * /resume used to be a page that redirected here; it is a plausible enough
     * thing to type or to have linked that losing it is not worth the tidiness.
     *
     * This runs before routing, so a flavor with the id "resume" would be
     * unreachable. There isn't one, and there shouldn't be — the resume is
     * what the whole site is.
     */
    { source: "/resume", destination: "/", permanent: true },
  ];
};
