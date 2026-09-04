import { resumeData } from "./data";
import { findFlavor } from "./flavors";
import { flavorHref } from "./routes";

export interface FlavorSeo {
  title: string;
  description: string;
  /** Canonical path for this flavor, so variants don't compete as duplicates. */
  canonical: string;
}

/**
 * Title and description for one flavor.
 *
 * Kept free of framework imports so the engine stays portable; the route wraps
 * the result in whatever the host app's metadata helper is.
 */
export function flavorSeo(id: string | undefined): FlavorSeo {
  const flavor = findFlavor(id);
  const name = resumeData.basics.name;
  const isDefault = flavorHref(flavor.id) === "/";

  return {
    title: isDefault ? `Resume - ${name}` : `${flavor.label} Resume - ${name}`,
    /*
     * Short enough to survive a search result.
     *
     * `flavor.expertise` used to be appended here, which pushed every
     * description past 200 characters — Google cuts at about 155, so the tail
     * of a semicolon-separated skills list was all that ever got trimmed, and
     * the part that read like a sentence was the part that got shown. The
     * expertise block is still on the page, where it belongs.
     */
    description: isDefault
      ? `${name} — ${flavor.tagline}. Interactive resume, cut by role.`
      : `${name} — ${flavor.tagline}. ${flavor.description}.`,
    canonical: flavorHref(flavor.id),
  };
}
