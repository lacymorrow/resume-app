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
    description: isDefault
      ? `${name} — ${flavor.tagline}. ${flavor.expertise}`
      : `${name} — ${flavor.tagline}. ${flavor.description}. ${flavor.expertise}`,
    canonical: flavorHref(flavor.id),
  };
}
