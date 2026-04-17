"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import type { ResumeSchema } from "../_lib/resume-types";
import { type FilterState, DEFAULT_FILTER_STATE, resolveWork, resolveProjects } from "../_lib/resume-filters";
import { getAllTags } from "../_lib/resume-tags";
import { FLAVORS } from "../_lib/resume-flavors";
import { ResumeHeader } from "./resume-header";
import { FilterPanel } from "./filter-panel";
import { Section, WorkSection, ProjectsSection, SkillsSection, EducationSection, ExtrasSection } from "./resume-sections";

export function ResumeViewer({ data }: { data: ResumeSchema }) {
  const [flavorParam, setFlavorParam] = useQueryState("flavor", parseAsString.withDefault("complete"));
  const [filters, setFilters] = useState<FilterState>(() => {
    const flavor = FLAVORS.find((f) => f.id === flavorParam);
    if (flavor) return { ...DEFAULT_FILTER_STATE, flavorId: flavor.id, sections: flavor.sections };
    return DEFAULT_FILTER_STATE;
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  // Sync URL param when flavor changes in filter state
  useEffect(() => {
    setFlavorParam(filters.flavorId === "complete" ? null : filters.flavorId);
  }, [filters.flavorId, setFlavorParam]);

  const flavor = useMemo(() => FLAVORS.find((f) => f.id === filters.flavorId) ?? FLAVORS[0]!, [filters.flavorId]);
  const allTags = useMemo(() => getAllTags(data), [data]);

  const { entries: workEntries, matches: workMatches, tags: workTags } = useMemo(
    () => resolveWork(data, flavor, filters), [data, flavor, filters],
  );
  const { entries: projectEntries, matches: projectMatches, tags: projectTags } = useMemo(
    () => resolveProjects(data, flavor, filters), [data, flavor, filters],
  );

  // Apply flavor overrides to basics
  const basics = useMemo(() => ({
    ...data.basics,
    label: flavor.tagline,
    summary: data.basics.summary.replace(
      /EXPERTISE:.*?(?=\n\n)/s,
      `EXPERTISE: ${flavor.expertise}`,
    ),
  }), [data.basics, flavor]);

  const handleExport = useCallback(() => { window.print(); }, []);

  const filterPanelProps = {
    filters, allTags, workMatches, projectMatches,
    totalWork: workEntries.length,
    totalProjects: projectEntries.length,
    onFiltersChange: setFilters,
    onExport: handleExport,
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0 print:hidden">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-card">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 print:max-w-none" id="resume-content">
          <ResumeHeader basics={basics} />
          {filters.sections.work && (
            <Section title="Work Experience">
              <WorkSection entries={workEntries} matches={workMatches} tags={workTags} />
            </Section>
          )}
          {filters.sections.projects && projectEntries.length > 0 && (
            <Section title="Projects">
              <ProjectsSection entries={projectEntries} matches={projectMatches} tags={projectTags} />
            </Section>
          )}
          {filters.sections.skills && <Section title="Skills"><SkillsSection skills={data.skills} /></Section>}
          {filters.sections.education && <Section title="Education"><EducationSection education={data.education} /></Section>}
          <ExtrasSection interests={data.interests} awards={data.awards} references={data.references}
            showInterests={filters.sections.interests} showAwards={filters.sections.awards} showReferences={filters.sections.references} />
        </main>
      </div>
      <div className="fixed bottom-6 right-6 lg:hidden print:hidden z-50">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild><Button size="lg" className="h-14 w-14 rounded-full shadow-lg"><SlidersHorizontal className="h-5 w-5" /></Button></SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0">
            <FilterPanel {...filterPanelProps} onClose={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
