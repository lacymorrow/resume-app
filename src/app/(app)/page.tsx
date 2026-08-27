import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { ResumeViewer } from "@/resume/components/viewer";
import { resumeData } from "@/resume/lib/data";
import { findFlavor } from "@/resume/lib/flavors";

type SearchParams = Promise<{ flavor?: string }>;

/**
 * The resume reads the query string on every request, so it cannot be
 * statically prerendered — without this Next tries to, and the build fails on
 * useSearchParams having no Suspense boundary above it.
 *
 * That boundary is deliberately absent: see the note on HomePage.
 */
export const dynamic = "force-dynamic";

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
 * Deliberately not an async component.
 *
 * This segment has a loading.tsx, so Next wraps the page in a Suspense
 * boundary. An async page suspends on its first await — including
 * `await searchParams` — which puts the spinner in the shell and streams the
 * real page into a `<div hidden>` that only JavaScript can reveal. The resume
 * then did not render at all without scripting.
 *
 * The viewer reads the query string itself, so the page has nothing to await
 * and renders straight into the shell. generateMetadata still awaits
 * searchParams, which is what marks the route dynamic, but metadata does not
 * gate the body.
 */
export default function HomePage() {
  return <ResumeViewer data={resumeData} />;
}
