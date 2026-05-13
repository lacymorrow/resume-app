"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, animate, motion } from "framer-motion";
import { useQueryState, parseAsString, parseAsArrayOf } from "nuqs";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import type { ResumeSchema } from "../_lib/resume-types";
import { type FilterState, DEFAULT_FILTER_STATE, resolveWork, resolveProjects, getFlavorVisibleCompanies, getFlavorVisibleProjects } from "../_lib/resume-filters";
import { getAllTags } from "../_lib/resume-tags";
import { FLAVORS, type ResumeFlavor } from "../_lib/resume-flavors";
import { type CustomFlavor, loadCustomFlavors, saveCustomFlavor, deleteCustomFlavor, filterStateToCustomFlavor } from "../_lib/resume-custom-flavors";
import { type ExportFormat, exportResume, buildExportData } from "../_lib/resume-export";
import { ResumeHeader } from "./resume-header";
import { FilterPanel } from "./filter-panel";
import { Section, WorkSection, ProjectsSection, SkillsSection, EducationSection, ExtrasSection } from "./resume-sections";

const parseAsStringArray = parseAsArrayOf(parseAsString);

export function ResumeViewer({ data }: { data: ResumeSchema }) {
  const [flavorParam, setFlavorParam] = useQueryState("flavor", parseAsString.withDefault("complete"));
  const [hcParam, setHcParam] = useQueryState("hc", parseAsStringArray.withDefault([]));
  const [hpParam, setHpParam] = useQueryState("hp", parseAsStringArray.withDefault([]));

  const [customFlavors, setCustomFlavors] = useState<CustomFlavor[]>(() => loadCustomFlavors());
  const allFlavors = useMemo<ResumeFlavor[]>(() => [...FLAVORS, ...customFlavors], [customFlavors]);

  const [filters, setFilters] = useState<FilterState>(() => {
    const flavor = allFlavors.find((f) => f.id === flavorParam);
    const cf = flavor as CustomFlavor | undefined;
    return {
      ...DEFAULT_FILTER_STATE,
      flavorId: flavor?.id ?? "complete",
      sections: flavor?.sections ?? DEFAULT_FILTER_STATE.sections,
      hiddenCompanies: hcParam.length > 0 ? hcParam : (cf?.hiddenCompanies ?? []),
      hiddenProjects: hpParam.length > 0 ? hpParam : (cf?.hiddenProjects ?? []),
    };
  });
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setFlavorParam(filters.flavorId === "complete" ? null : filters.flavorId);
  }, [filters.flavorId, setFlavorParam]);

  useEffect(() => {
    setHcParam(filters.hiddenCompanies.length > 0 ? filters.hiddenCompanies : null);
  }, [filters.hiddenCompanies, setHcParam]);

  useEffect(() => {
    setHpParam(filters.hiddenProjects.length > 0 ? filters.hiddenProjects : null);
  }, [filters.hiddenProjects, setHpParam]);

  const flavor = useMemo(
    () => allFlavors.find((f) => f.id === filters.flavorId) ?? FLAVORS[0]!,
    [allFlavors, filters.flavorId],
  );
  const allTags = useMemo(() => getAllTags(data), [data]);

  const { entries: workEntries, matches: workMatches, tags: workTags } = useMemo(
    () => resolveWork(data, flavor, filters), [data, flavor, filters],
  );
  const { entries: projectEntries, matches: projectMatches, tags: projectTags } = useMemo(
    () => resolveProjects(data, flavor, filters), [data, flavor, filters],
  );

  const flavorCompanies = useMemo(() => getFlavorVisibleCompanies(data, flavor), [data, flavor]);
  const flavorProjects = useMemo(() => getFlavorVisibleProjects(data, flavor), [data, flavor]);

  const basics = useMemo(() => ({
    ...data.basics,
    label: flavor.tagline,
    summary: data.basics.summary.replace(
      /EXPERTISE:.*?(?=\n\n)/s,
      `EXPERTISE: ${flavor.expertise}`,
    ),
  }), [data.basics, flavor]);

  const handleExport = useCallback((format: ExportFormat) => {
    const exportData = buildExportData(data, basics, flavor, filters);
    void exportResume(format, exportData);
  }, [data, basics, flavor, filters]);

  const handleSaveCustomFlavor = useCallback((name: string) => {
    const cf = filterStateToCustomFlavor(filters, name, flavor);
    saveCustomFlavor(cf);
    setCustomFlavors(loadCustomFlavors());
    setFilters((prev) => ({ ...prev, flavorId: cf.id }));
  }, [filters, flavor]);

  const handleDeleteCustomFlavor = useCallback((id: string) => {
    deleteCustomFlavor(id);
    setCustomFlavors(loadCustomFlavors());
    if (filters.flavorId === id) {
      const base = FLAVORS[0]!;
      setFilters({ ...DEFAULT_FILTER_STATE, flavorId: base.id, sections: base.sections });
    }
  }, [filters.flavorId]);

  const filterPanelRef = useRef<HTMLDivElement>(null);
  const filterChangeCountRef = useRef(0);
  const [filterFlash, setFilterFlash] = useState(0);

  useEffect(() => {
    filterChangeCountRef.current++;
    if (filterChangeCountRef.current <= 1) return;
    setFilterFlash((n) => n + 1);
    if (filterPanelRef.current) {
      void animate(
        filterPanelRef.current,
        { boxShadow: ["0 0 0 2px hsl(12 50% 48% / 0.35)", "0 0 0 0px hsl(12 50% 48% / 0)"] },
        { duration: 0.75, ease: "easeOut" },
      );
    }
  }, [filters]);

  const activeFilterCount = useMemo(
    () =>
      Object.values(filters.sections).filter((v) => !v).length +
      filters.selectedTags.length +
      filters.hiddenCompanies.length +
      filters.hiddenProjects.length,
    [filters],
  );

  const filterPanelProps = {
    filters, allTags, workMatches, projectMatches,
    totalWork: flavorCompanies.length,
    totalProjects: flavorProjects.length,
    flavorCompanies,
    flavorProjects,
    allFlavors,
    customFlavors,
    onFiltersChange: setFilters,
    onExport: handleExport,
    onSaveCustomFlavor: handleSaveCustomFlavor,
    onDeleteCustomFlavor: handleDeleteCustomFlavor,
  };

  return (
    <div className="resume-grain relative mx-auto max-w-6xl px-4 py-10 mt-[var(--header-height)] print:mt-0">
      <div className="flex gap-10">
        {/* Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0 print:hidden">
          <div ref={filterPanelRef} className="sticky top-[calc(var(--header-height)+0.5rem)] flex max-h-[calc(100vh-var(--header-height)-2rem)] flex-col overflow-hidden rounded border border-border/60 bg-card/80 backdrop-blur-sm print:top-0 print:max-h-none">
            <FilterPanel {...filterPanelProps} />
          </div>
        </aside>

        {/* Main content */}
        <main className="relative min-w-0 flex-1 print:max-w-none" id="resume-content">
          {filterFlash > 0 && (
            <>
              <motion.div
                key={`ov-${filterFlash}`}
                className="pointer-events-none absolute inset-0 print:hidden"
                style={{ backgroundColor: "hsl(12 50% 48% / 0.04)", zIndex: 1 }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
              <motion.div
                key={`bar-${filterFlash}`}
                className="pointer-events-none absolute inset-x-0 top-0 h-[1px] print:hidden origin-left"
                style={{ zIndex: 2, background: "linear-gradient(to right, transparent, hsl(12 50% 48% / 0.6), transparent)" }}
                initial={{ scaleX: 0, opacity: 1 }}
                animate={{ scaleX: [0, 1, 1], opacity: [1, 1, 0] }}
                transition={{ duration: 1, times: [0, 0.55, 1] }}
              />
            </>
          )}

          <ResumeHeader basics={basics} />

          <AnimatePresence initial={false}>
            {filters.sections.work && (
              <motion.div key="work" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} layout>
                <Section title="Work Experience">
                  <WorkSection entries={workEntries} matches={workMatches} tags={workTags} />
                </Section>
              </motion.div>
            )}
            {filters.sections.projects && projectEntries.length > 0 && (
              <motion.div key="projects" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} layout>
                <Section title="Projects">
                  <ProjectsSection entries={projectEntries} matches={projectMatches} tags={projectTags} />
                </Section>
              </motion.div>
            )}
            {filters.sections.skills && (
              <motion.div key="skills" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} layout>
                <Section title="Skills"><SkillsSection skills={data.skills} /></Section>
              </motion.div>
            )}
            {filters.sections.education && (
              <motion.div key="education" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} layout>
                <Section title="Education"><EducationSection education={data.education} /></Section>
              </motion.div>
            )}
          </AnimatePresence>

          <ExtrasSection interests={data.interests} awards={data.awards} references={data.references}
            showInterests={filters.sections.interests} showAwards={filters.sections.awards} showReferences={filters.sections.references} />
        </main>
      </div>

      {/* Mobile filter FAB */}
      <div className="fixed bottom-6 right-6 lg:hidden print:hidden z-50">
        <div className="relative">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="h-14 w-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90">
                <SlidersHorizontal className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl p-0">
              <FilterPanel {...filterPanelProps} onClose={() => setSheetOpen(false)} />
            </SheetContent>
          </Sheet>
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.div
                key={activeFilterCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="pointer-events-none absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              >
                {activeFilterCount}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
