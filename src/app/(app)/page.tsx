import type React from "react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { constructMetadata } from "@/config/metadata";
import { resumeData } from "@/app/(app)/resume/_lib/resume-data";
import { ResumeViewer } from "@/app/(app)/resume/_components/resume-viewer";
import { ResumeStatic } from "@/app/(app)/resume/_components/resume-static";
import { FLAVORS } from "@/app/(app)/resume/_lib/resume-flavors";

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
    <div style={{ "--header-height": "0px" } as React.CSSProperties}>
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
      <footer className="pb-6 pt-2 text-center print:hidden">
        <a
          href="https://lacymorrow.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
        >
          lacymorrow.com
        </a>
      </footer>
    </div>
  );
}
