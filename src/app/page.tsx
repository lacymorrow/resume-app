import type { Metadata } from "next";
import { flavorMetadata } from "@/config/flavor-metadata";
import { JsonLd } from "@/resume/components/json-ld";
import { ResumeViewer } from "@/resume/components/viewer";
import { resumeData } from "@/resume/lib/data";
import { findFlavor } from "@/resume/lib/flavors";
import { DEFAULT_FLAVOR_ID } from "@/resume/lib/routes";
import { profilePageJsonLd } from "@/resume/lib/schema-org";

/**
 * The default flavor, served at "/".
 *
 * Nothing here reads searchParams, so the route prerenders to a static file at
 * build time. Every other flavor lives at /{prefix}/{id} and is prerendered the
 * same way — see [flavor]/page.tsx.
 */
export const metadata: Metadata = flavorMetadata(DEFAULT_FLAVOR_ID);

export default function ResumeIndexPage() {
  return (
    <>
      <JsonLd data={profilePageJsonLd(DEFAULT_FLAVOR_ID)} />
      <ResumeViewer data={resumeData} flavorId={findFlavor(DEFAULT_FLAVOR_ID).id} />
    </>
  );
}
