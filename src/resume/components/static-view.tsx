import type React from "react";
import type { ResumeSchema } from "../lib/types";
import type { ResumeFlavor } from "../lib/flavors";
import {
  DEFAULT_FILTER_STATE,
  resolveWork,
  resolveProjects,
} from "../lib/filters";
import {
  SIGNATURE,
  SIGNATURE_FONT_STACK,
  parseSummary,
} from "../lib/export-shared";
import { ResumeHeader, ExpertiseBlock } from "./header";
import { ResumeEntryCard } from "./entry-card";
import {
  Section,
  PersonalSection,
  ReferencesSection,
  ResumeFooter,
} from "./sections";

/**
 * Server-rendered, no-JS static resume for crawlers, ATS, and link previews.
 * Same content the interactive viewer shows on load — no framer-motion,
 * no client hooks, so it survives Next.js CSR bailout and streams as HTML.
 */
interface ResumeStaticProps {
  data: ResumeSchema;
  flavor: ResumeFlavor;
  hiddenCompanies?: string[];
  hiddenProjects?: string[];
}

export function ResumeStatic({
  data,
  flavor,
  hiddenCompanies = [],
  hiddenProjects = [],
}: ResumeStaticProps) {
  const filters = {
    ...DEFAULT_FILTER_STATE,
    flavorId: flavor.id,
    sections: flavor.sections,
    hiddenCompanies,
    hiddenProjects,
  };

  const { entries: workEntries, matches: workMatches, tags: workTags } =
    resolveWork(data, flavor, filters);
  const {
    entries: projectEntries,
    matches: projectMatches,
    tags: projectTags,
  } = resolveProjects(data, flavor, filters);

  const basics = {
    ...data.basics,
    label: flavor.tagline,
    summary: data.basics.summary.replace(
      /EXPERTISE:.*?(?=\n\n)/s,
      `EXPERTISE: ${flavor.expertise}`,
    ),
  };

  const summary = parseSummary(basics.summary);

  return (
    <div
      className="resume-grain relative mx-auto max-w-6xl px-4 py-10 mt-[var(--header-height)]"
      style={{ fontFamily: SIGNATURE_FONT_STACK, color: SIGNATURE.body }}
    >
      <div className="flex gap-10">
        <main className="relative min-w-0 flex-1" id="resume-content">
          <ResumeHeader basics={basics} />

          <Section rail="Expertise">
            <ExpertiseBlock basics={basics} />
          </Section>

          {(flavor.sections.work ?? false) && workEntries.length > 0 && (
            <Section rail="Developer Experience">
              <StaticWorkSection
                entries={workEntries}
                matches={workMatches}
                tags={workTags}
              />
            </Section>
          )}

          <Section rail="Personal">
            <PersonalSection
              skills={data.skills}
              interests={data.interests}
              education={data.education}
              awards={data.awards}
              qualities={summary.qualities}
              showSkills={flavor.sections.skills ?? false}
              showInterests={flavor.sections.interests ?? false}
              showEducation={flavor.sections.education ?? false}
              showAwards={flavor.sections.awards ?? false}
            />
          </Section>

          {(flavor.sections.projects ?? false) && projectEntries.length > 0 && (
            <Section rail="Open-Source">
              <StaticProjectsSection
                entries={projectEntries}
                matches={projectMatches}
                tags={projectTags}
              />
            </Section>
          )}

          {(flavor.sections.references ?? false) && data.references.length > 0 && (
            <Section rail="References">
              <ReferencesSection references={data.references} />
            </Section>
          )}

          <ResumeFooter />
        </main>
      </div>
    </div>
  );
}

function StaticWorkSection({
  entries,
  matches,
  tags,
}: {
  entries: ReturnType<typeof resolveWork>["entries"];
  matches: ReturnType<typeof resolveWork>["matches"];
  tags: ReturnType<typeof resolveWork>["tags"];
}) {
  return (
    <div>
      {entries.map((entry) => (
        <ResumeEntryCard
          key={`${entry.name}-${entry.startDate}`}
          title={entry.position}
          subtitle={entry.name}
          startDate={entry.startDate}
          endDate={entry.endDate}
          location={entry.location}
          summary={entry.summary ?? ""}
          tags={tags.get(entry.originalIndex) ?? []}
          url={entry.url}
          highlights={entry.highlights?.filter(Boolean)}
          match={matches.get(entry.originalIndex)}
          sector={entry.sector}
          variant="work"
        />
      ))}
    </div>
  );
}

function StaticProjectsSection({
  entries,
  matches,
  tags,
}: {
  entries: ReturnType<typeof resolveProjects>["entries"];
  matches: ReturnType<typeof resolveProjects>["matches"];
  tags: ReturnType<typeof resolveProjects>["tags"];
}) {
  return (
    <div>
      {entries.map((project) => (
        <ResumeEntryCard
          key={`${project.name}-${project.startDate}`}
          title={project.name}
          subtitle={project.url ? new URL(project.url).hostname : ""}
          startDate={project.startDate}
          endDate={project.endDate}
          summary={project.summary ?? ""}
          tags={tags.get(project.originalIndex) ?? []}
          url={project.url}
          highlights={project.highlights?.filter(Boolean)}
          match={matches.get(project.originalIndex)}
          featured={project.featured}
          variant="project"
        />
      ))}
    </div>
  );
}
