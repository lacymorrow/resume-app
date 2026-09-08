/**
 * Deep links from elsewhere into one role on the resume.
 *
 * A portfolio page about a job links back here with `?role=credit-karma`, and
 * the reader lands on the resume with that role marked and scrolled to. The
 * point is that the reader never has to hunt: they clicked a link about one
 * job, so that job is what they should see.
 *
 * Resolution happens against the roles the current flavor actually shows, so a
 * link pointing at a role a flavor leaves out simply renders the ordinary
 * resume. A stale or misspelled link degrades to no highlight rather than to an
 * error, because it is a pointer into a document, not a lookup that can fail.
 */

/** The query parameter an inbound link carries. */
export const ROLE_PARAM = "role";

/**
 * URL-safe form of a company name. Kept here rather than shared with
 * custom-flavors' slugify, which substitutes a placeholder for an empty result
 * so a saved flavor always has an id; here an empty result has to stay empty or
 * a blank query would match a company.
 */
export function roleSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Which company an inbound link points at, or null.
 *
 * Links are written by hand, so matching is deliberately forgiving: the slug,
 * the company name itself, or an unambiguous prefix of the slug all resolve.
 * A prefix that fits more than one company resolves to nothing rather than to
 * an arbitrary pick, since guessing between "Novant Health / Red Ventures" and
 * "OptumRX Health / Red Ventures" would silently point the reader at the wrong
 * job.
 *
 * @param query raw query parameter value
 * @param orgs company names visible in the current flavor, in resume order
 * @returns the matching name exactly as it appears in `orgs`
 */
export function resolveHighlightedOrg(
  query: string | null | undefined,
  orgs: string[]
): string | null {
  const wanted = query?.trim().toLowerCase();
  if (!wanted) return null;

  const byName = orgs.find((org) => org.toLowerCase() === wanted);
  if (byName) return byName;

  const slug = roleSlug(wanted);
  if (!slug) return null;

  const bySlug = orgs.find((org) => roleSlug(org) === slug);
  if (bySlug) return bySlug;

  const [onlyPrefixed, ...alsoPrefixed] = orgs.filter((org) => roleSlug(org).startsWith(slug));
  return onlyPrefixed && alsoPrefixed.length === 0 ? onlyPrefixed : null;
}
