import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { ResumeViewer } from "@/resume/components/viewer";
import { resumeData } from "@/resume/lib/data";
import { findFlavor } from "@/resume/lib/flavors";

type SearchParams = Promise<{ flavor?: string }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { flavor: flavorParam } = await searchParams;
  const flavor = findFlavor(flavorParam);
  const name = resumeData.basics.name;

  const isComplete = flavor.id === "complete";
  const title = isComplete ? `Resume - ${name}` : `${flavor.label} Resume - ${name}`;
  const description = isComplete
    ? `${name} — ${flavor.tagline}. ${flavor.expertise}`
    : `${name} — ${flavor.tagline}. ${flavor.description}. ${flavor.expertise}`;

  return constructMetadata({ title, description });
}

/**
 * Awaiting searchParams is what marks this route dynamic, which is correct:
 * the rendered resume depends on the query string, so it cannot be prerendered
 * to a single static file. `force-dynamic` is not needed for that and would
 * additionally opt out of the data cache, which this page has no reason to do.
 *
 * There is deliberately no Suspense boundary above the viewer. Awaiting here
 * delays the response rather than streaming a fallback, so the finished resume
 * lands in the HTML shell and is visible without JavaScript.
 */
export default async function ResumePage({ searchParams }: { searchParams: SearchParams }) {
  const { flavor } = await searchParams;
  return <ResumeViewer data={resumeData} initialFlavorId={findFlavor(flavor).id} />;
}
