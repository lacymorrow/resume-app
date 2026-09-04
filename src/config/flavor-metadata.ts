import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { flavorSeo } from "@/resume/lib/metadata";

/**
 * One flavor's SEO, merged into the app's metadata defaults.
 *
 * The engine computes title, description, and canonical without knowing what
 * framework renders them; this is the only place that turns them into Next
 * metadata, so "/" and /{flavor} cannot drift apart.
 *
 * `openGraph.url` is set alongside `canonical` deliberately. They describe the
 * same thing to different readers — crawlers take the link tag, social scrapers
 * take the property — and leaving og:url at the site default pointed every
 * flavor's shared link back at the root resume.
 */
export function flavorMetadata(id: string): Metadata {
  const { title, description, canonical } = flavorSeo(id);

  return constructMetadata({
    title,
    description,
    alternates: { canonical },
    openGraph: { url: canonical },
  });
}
