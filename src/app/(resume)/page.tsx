import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { ResumeViewer } from "@/resume/components/viewer";
import { resumeData } from "@/resume/lib/data";
import { findFlavor } from "@/resume/lib/flavors";
import { flavorSeo } from "@/resume/lib/metadata";
import { DEFAULT_FLAVOR_ID } from "@/resume/lib/routes";

/** Flavor SEO merged into the app's shared metadata defaults. */
function toMetadata(id: string): Metadata {
  const { title, description, canonical } = flavorSeo(id);
  return { ...constructMetadata({ title, description }), alternates: { canonical } };
}

/**
 * The default flavor, served at "/".
 *
 * Nothing here reads searchParams, so the route prerenders to a static file at
 * build time. Every other flavor lives at /{prefix}/{id} and is prerendered the
 * same way — see r/[flavor]/page.tsx.
 */
export const metadata: Metadata = toMetadata(DEFAULT_FLAVOR_ID);

export default function ResumeIndexPage() {
  return <ResumeViewer data={resumeData} flavorId={findFlavor(DEFAULT_FLAVOR_ID).id} />;
}
