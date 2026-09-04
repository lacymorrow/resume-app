import { resumeConfig } from "../inputs";
import { resumeData } from "./data";
import { DEFAULT_FILTER_STATE, resolveWork } from "./filters";
import { findFlavor } from "./flavors";
import { flavorHref } from "./routes";

/**
 * Structured data for one flavor.
 *
 * A resume is one of the few pages where schema.org has an exact type for what
 * is on it, and a crawler that can read `Person` gets the name, the roles, and
 * the profiles as facts rather than as a guess at what the prose meant. It is
 * generated per flavor because `jobTitle` and the set of roles differ between
 * them — a page that claims to be about a frontend engineer should not describe
 * itself to a machine as something else.
 *
 * Everything published here is already visible on the page. Nothing is added to
 * the markup that a reader cannot see.
 */

interface JsonLdOrganization {
  "@type": "Organization";
  name: string;
  url?: string;
}

interface JsonLdRole {
  "@type": "OrganizationRole";
  roleName: string;
  startDate?: string;
  endDate?: string;
  worksFor: JsonLdOrganization;
}

/** JSON Resume dates are ISO; schema.org wants the year alone for open ranges. */
function isoDate(value: string | undefined): string | undefined {
  return value && /^\d{4}/.test(value) ? value.slice(0, 10) : undefined;
}

export function profilePageJsonLd(flavorId: string): Record<string, unknown> {
  const { basics, skills, education } = resumeData;
  const flavor = findFlavor(flavorId);
  const url = `https://${resumeConfig.site.host}${flavorHref(flavor.id)}`;

  const { entries: work } = resolveWork(resumeData, flavor, {
    ...DEFAULT_FILTER_STATE,
    flavorId: flavor.id,
  });

  const roles: JsonLdRole[] = work.map((entry) => ({
    "@type": "OrganizationRole",
    roleName: entry.position,
    startDate: isoDate(entry.startDate),
    endDate: isoDate(entry.endDate),
    worksFor: { "@type": "Organization", name: entry.name, url: entry.url },
  }));

  const person: Record<string, unknown> = {
    "@type": "Person",
    name: basics.name,
    // The flavor's tagline, so each page states the role it is applying for.
    jobTitle: flavor.tagline,
    description: flavor.statement.sub || basics.label,
    url: basics.url,
    mainEntityOfPage: url,
    email: basics.email ? `mailto:${basics.email}` : undefined,
    telephone: basics.phone,
    image: basics.image,
    address: {
      "@type": "PostalAddress",
      addressLocality: basics.location.city,
      addressRegion: basics.location.state,
      addressCountry: basics.location.countryCode,
    },
    sameAs: (basics.profiles ?? []).map((p) => p.url).filter(Boolean),
    knowsAbout: (skills ?? []).flatMap((s) => s.keywords ?? []),
    alumniOf: (education ?? []).map((e) => ({
      "@type": "EducationalOrganization",
      name: e.institution,
    })),
    hasOccupation: roles.length > 0 ? roles : undefined,
  };

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url,
    name: `${flavor.label} — ${basics.name}`,
    mainEntity: person,
  };
}
