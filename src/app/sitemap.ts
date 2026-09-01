import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site-config";
import { flavorHref, flavorIds } from "@/resume/lib/routes";

/**
 * One entry per flavor, generated from the flavor registry so adding a flavor
 * never means remembering to update this file.
 *
 * The default flavor resolves to "/" and is listed first at full priority; the
 * rest are the same resume cut for a different audience, so they rank slightly
 * below it rather than competing with it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return flavorIds().map((id) => {
    const href = flavorHref(id);
    const isDefault = href === "/";

    return {
      url: isDefault ? siteConfig.url : `${siteConfig.url}${href}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: isDefault ? 1 : 0.8,
    };
  });
}
