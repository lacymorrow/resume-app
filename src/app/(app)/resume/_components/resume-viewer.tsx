"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import type { ResumeSchema } from "../_lib/resume-types";
import { type FilterState, DEFAULT_FILTER_STATE, computeWorkMatches, computeProjectMatches } from "../_lib/resume-filters";
import { getAllTags, extractWorkTags, extractProjectTags } from "../_lib/resume-tags";
import { ResumeHeader } from "./resume-header";
import { FilterPanel } from "./filter-panel";
import { Section, WorkSection, ProjectsSection, SkillsSection, EducationSection, ExtrasSection } from "./resume-sections";

export function ResumeViewer({ data }: { data: ResumeSchema }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const allTags = useMemo(() => getAllTags(data), [data]);
  const workTags = useMemo(() => extractWorkTags(data.work), [data]);
  const projectTags = useMemo(() => extractProjectTags(data.projects), [data]);
  const workMatches = useMemo(() => computeWorkMatches(data, filters), [data, filters]);
  const projectMatches = useMemo(() => computeProjectMatches(data, filters), [data, filters]);

  const handleExport = useCallback(() => { window.print(); }, []);

  const filterPanelProps = {
    filters, allTags, workMatches, projectMatches,
    totalWork: data.work.filter((w) => w.name !== "LacyMorrow.com").length,
    totalProjects: data.projects.length,
    onFiltersChange: setFilters, onExport: handleExport,
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-card">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>
        <main ref={resumeRef} className="min-w-0 flex-1 print:max-w-none" id="resume-content">
          <ResumeHeader basics={data.basics} />
          {filters.sections.work && <Section title="Work Experience"><WorkSection work={data.work} matches={workMatches} tags={workTags} /></Section>}
          {filters.sections.projects && <Section title="Projects"><ProjectsSection projects={data.projects} matches={projectMatches} tags={projectTags} /></Section>}
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
