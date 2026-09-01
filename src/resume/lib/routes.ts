import { resumeConfig } from "../inputs";
import { FLAVORS } from "./flavors";

/**
 * Where each flavor lives.
 *
 * Flavors are path segments rather than a query parameter so every variant is
 * its own document: prerenderable at build time, cacheable on a CDN, and
 * distinct to a crawler. The first flavor in the registry is the default and
 * is served at "/" so the bare domain is a complete resume.
 *
 * Builder state (hidden roles, tag filters, switched-off sections) stays in the
 * query string. It is per-visitor tuning rather than a published variant, and
 * keeping it out of the path is what lets these pages be static.
 */

/** The flavor served at "/". Registry order decides it; nothing is hard-coded. */
export const DEFAULT_FLAVOR_ID: string = FLAVORS[0]?.id ?? "complete";

export const FLAVOR_PREFIX = resumeConfig.site.flavorPrefix;

/** Every flavor that gets its own prerendered page. */
export function flavorIds(): string[] {
  return FLAVORS.map((f) => f.id);
}

export function isKnownFlavor(id: string | undefined): boolean {
  return FLAVORS.some((f) => f.id === id);
}

/** Canonical path for a flavor. */
export function flavorHref(id: string): string {
  return id === DEFAULT_FLAVOR_ID ? "/" : `/${FLAVOR_PREFIX}/${encodeURIComponent(id)}`;
}
