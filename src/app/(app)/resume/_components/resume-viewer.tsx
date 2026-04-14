"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import type { ResumeSchema } from "../_lib/resume-types";
import {
  type FilterState,
  DEFAULT_FILTER_STATE,
  computeWorkMatches,
  computeProjectMatches,
} from "../_lib/resume-filters";
import { getAllTags, extractWorkTags, extractProjectTags } from "../_lib/resume-tags";
import {
  ROLE_VARIANTS,
  applyWorkOverride,
  isProjectHidden,
} from "../_lib/resume-variants";
import { ResumeHeader } from "./resume-header";
import { FilterPanel } from "./filter-panel";
import {
  Section,
  WorkSection,
  ProjectsSection,
  SkillsSection,
  EducationSection,
  ExtrasSection,
} from "./resume-sections";

export function ResumeViewer({ data }: { data: ResumeSchema }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const resumeRef = useRef<HTMLDivElement>(null);

  const currentVariant = useMemo(
    () => ROLE_VARIANTS.find((v) => v.id === filters.activeVariant) ?? ROLE_VARIANTS[0],
    [filters.activeVariant],
  );

  // Apply variant overrides to work entries
  const variantWork = useMemo(() => {
    return data.work.map((entry) => applyWorkOverride(entry, currentVariant));
  }, [data.work, currentVariant]);

  // Filter work by variant hidden + manual job visibility
  const visibleWork = useMemo(() => {
    return variantWork.map((entry, i) => {
      // Manual override takes priority
      if (entry.name in filters.jobVisibility) {
        return { ...entry, hidden: !filters.jobVisibility[entry.name] };
      }
      return entry;
    });
  }, [variantWork, filters.jobVisibility]);

  // Filter projects by variant
  const visibleProjects = useMemo(() => {
    return data.projects.filter(
      (p) => !isProjectHidden(p.name, currentVariant),
    );
  }, [data.projects, currentVariant]);

  // Override basics tagline/summary if variant provides them
  const variantBasics = useMemo(() => {
    if (!currentVariant.tagline && !currentVariant.expertise) return data.basics;
    const summaryParts = data.basics.summary.split("\n\n");
    if (currentVariant.expertise && summaryParts.length > 1) {
      summaryParts[1] = `EXPERTISE: ${currentVariant.expertise}`;
    }
    return {
      ...data.basics,
      label: currentVariant.tagline ?? data.basics.label,
      summary: summaryParts.join("\n\n"),
    };
  }, [data.basics, currentVariant]);

  const allTags = useMemo(() => getAllTags(data), [data]);
  const workTags = useMemo(() => extractWorkTags(visibleWork), [visibleWork]);
  const projectTags = useMemo(
    () => extractProjectTags(visibleProjects),
    [visibleProjects],
  );
  const workMatches = useMemo(
    () => computeWorkMatches({ ...data, work: visibleWork }, filters),
    [data, visibleWork, filters],
  );
  const projectMatches = useMemo(
    () => computeProjectMatches({ ...data, projects: visibleProjects }, filters),
    [data, visibleProjects, filters],
  );

  const handleExport = useCallback(() => {
    window.print();
  }, []);

  const filterPanelProps = {
    filters,
    allTags,
    workEntries: data.work,
    workMatches,
    projectMatches,
    totalWork: visibleWork.filter((w) => w.name !== "LacyMorrow.com" && !w.hidden).length,
    totalProjects: visibleProjects.length,
    onFiltersChange: setFilters,
    onExport: handleExport,
  };

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8">
      <div className="flex gap-8">
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-hidden rounded-lg border bg-card">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        <main
          ref={resumeRef}
          className="min-w-0 flex-1 print:max-w-none"
          id="resume-content"
        >
          <ResumeHeader basics={variantBasics} />

          {filters.sections.work && (
            <Section title="Work Experience">
              <WorkSection
                work={visibleWork}
                matches={workMatches}
                tags={workTags}
              />
            </Section>
          )}

          {filters.sections.projects && (
            <Section title="Projects">
              <ProjectsSection
                projects={visibleProjects}
                matches={projectMatches}
                tags={projectTags}
              />
            </Section>
          )}

          {filters.sections.skills && (
            <Section title="Skills">
              <SkillsSection skills={data.skills} />
            </Section>
          )}

          {filters.sections.education && (
            <Section title="Education">
              <EducationSection education={data.education} />
            </Section>
          )}

          <ExtrasSection
            interests={data.interests}
            awards={data.awards}
            references={data.references}
            showInterests={filters.sections.interests}
            showAwards={filters.sections.awards}
            showReferences={filters.sections.references}
          />
        </main>
      </div>

      <div className="fixed bottom-6 right-6 lg:hidden print:hidden z-50">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button size="lg" className="h-14 w-14 rounded-full shadow-lg">
              <SlidersHorizontal className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0">
            <FilterPanel
              {...filterPanelProps}
              onClose={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
