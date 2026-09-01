// Relative, and resume.config.ts has no imports of its own: next.config.ts
// transpiles this file without path aliases (see the note on Redirect below).

import type { Route } from "next";
import { resumeConfig } from "../../resume.config";
import { routes } from "./routes";

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

const createRedirects = (sources: Route[], destination: Route, permanent = false): Redirect[] => {
  if (!sources.length) return [];

  // Automatically generate both trailing-slash variants for each source.
  // This is necessary when skipTrailingSlashRedirect is enabled (e.g. for PostHog).
  const expanded = new Set<Route>();
  for (const source of sources) {
    expanded.add(source);
    if (source.endsWith("/") && source.length > 1) {
      expanded.add(source.slice(0, -1) as Route);
    } else if (!source.endsWith("/")) {
      expanded.add(`${source}/` as Route);
    }
  }

  return Array.from(expanded)
    .filter((source) => source !== destination)
    .map((source) => ({ source, destination, permanent }));
};

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
    ...createRedirects(["/doc", "/docs", "/documentation"], routes.docs, true),
    ...createRedirects(
      ["/account", "/accounts", "/settings/accounts"],
      routes.settings.account,
      true
    ),
    ...createRedirects(["/join", "/signup", "/sign-up"], routes.auth.signUp, true),
    ...createRedirects(["/login", "/log-in", "/signin", "/sign-in"], routes.auth.signIn),
    ...createRedirects(["/logout", "/log-out", "/signout", "/sign-out"], routes.auth.signOut),
  ];
};
