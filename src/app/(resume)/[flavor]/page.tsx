import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { constructMetadata } from "@/config/metadata";
import { ResumeViewer } from "@/resume/components/viewer";
import { resumeData } from "@/resume/lib/data";
import { findFlavor } from "@/resume/lib/flavors";
import { flavorSeo } from "@/resume/lib/metadata";
import { DEFAULT_FLAVOR_ID, flavorIds, isKnownFlavor } from "@/resume/lib/routes";

/** Flavor SEO merged into the app's shared metadata defaults. */
function toMetadata(id: string): Metadata {
  const { title, description, canonical } = flavorSeo(id);
  return { ...constructMetadata({ title, description }), alternates: { canonical } };
}

type Params = Promise<{ flavor: string }>;

/**
 * One prerendered page per flavor. Params are awaited but not searchParams, so
 * these stay static: each flavor becomes a real HTML file that a CDN can serve
 * and a crawler can index, rather than one URL rendered per request.
 */
export function generateStaticParams(): { flavor: string }[] {
  // The default flavor is included so its prefixed path resolves to a build-time
  // redirect rather than a 404 — legacy /?flavor=<default> links land here.
  return flavorIds().map((flavor) => ({ flavor }));
}

/** An unknown flavor is a 404, not a silent fallback to the default resume. */
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { flavor } = await params;
  return toMetadata(flavor);
}

export default async function FlavorPage({ params }: { params: Params }) {
  const { flavor } = await params;
  if (!isKnownFlavor(flavor)) notFound();
  // The default flavor's canonical home is "/", not a prefixed path.
  if (flavor === DEFAULT_FLAVOR_ID) redirect("/");
  return <ResumeViewer data={resumeData} flavorId={findFlavor(flavor).id} />;
}
