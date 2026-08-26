import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { constructMetadata } from "@/config/metadata";
import { resumeData } from "@/resume/lib/data";
import { ResumeViewer } from "@/resume/components/viewer";
import { ResumeStatic } from "@/resume/components/static-view";
import { FLAVORS } from "@/resume/lib/flavors";

type SearchParams = Promise<{
  flavor?: string;
  hc?: string | string[];
  hp?: string | string[];
}>;

function resolveFlavor(flavorId: string | undefined) {
  return FLAVORS.find((f) => f.id === flavorId) ?? FLAVORS[0]!;
}

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { flavor: flavorParam } = await searchParams;
  const flavor = resolveFlavor(flavorParam);
  const name = resumeData.basics.name;

  const isComplete = flavor.id === "complete";
  const title = isComplete
    ? `Resume - ${name}`
    : `${flavor.label} Resume - ${name}`;
  const description = isComplete
    ? `${name} — ${flavor.tagline}. ${flavor.expertise}`
    : `${name} — ${flavor.tagline}. ${flavor.description}. ${flavor.expertise}`;

  return constructMetadata({ title, description });
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const flavor = resolveFlavor(params.flavor);
  const hiddenCompanies = toArray(params.hc);
  const hiddenProjects = toArray(params.hp);

  return (
    <Suspense
      fallback={
        <ResumeStatic
          data={resumeData}
          flavor={flavor}
          hiddenCompanies={hiddenCompanies}
          hiddenProjects={hiddenProjects}
        />
      }
    >
      <ResumeViewer data={resumeData} />
    </Suspense>
  );
}
