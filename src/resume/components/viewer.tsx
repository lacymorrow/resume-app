"use client";

import { parseAsArrayOf, parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resumeConfig } from "../inputs";
import {
  type CustomFlavor,
  deleteCustomFlavor,
  filterStateToCustomFlavor,
  flavorToFile,
  loadCustomFlavors,
  saveCustomFlavor,
  slugify,
} from "../lib/custom-flavors";
import { buildExportData, type ExportFormat, exportResume } from "../lib/export";
import { contactRows, downloadBlob } from "../lib/export-shared";
import {
  DEFAULT_FILTER_STATE,
  type FilterState,
  resolveProjects,
  resolveWork,
} from "../lib/filters";
import { FLAVORS, type ResumeFlavor } from "../lib/flavors";
import { buildSections, DEFAULT_SECTIONS } from "../lib/sections";
import { SCREEN } from "../lib/theme";
import type { ResumeSchema } from "../lib/types";
import { DeskLabel, ResumeFrame } from "./frame";
import { ResumePanel } from "./panel";
import { FlavorButton, SF } from "./parts";

const S = SCREEN;

const arrayParam = parseAsArrayOf(parseAsString).withDefault([]);
const matchParam = parseAsStringLiteral(["any", "all"] as const).withDefault("any");

const EXPORT_FORMATS: ExportFormat[] = ["pdf", "docx", "html"];

const deskActionStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: S.dim,
  fontFamily: SF,
  fontSize: "0.75rem",
  cursor: "pointer",
  padding: 0,
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  transition: "color 200ms ease",
};

export function ResumeViewer({ data }: { data: ResumeSchema }) {
  // Every piece of builder state lives in the URL, so a tuned resume is a
  // shareable link and the server fallback reads the same parameters the client
  // writes. `hc` and `hp` were previously read by the server and then discarded
  // on hydration.
  const [flavorId, setFlavorId] = useQueryState("flavor", parseAsString.withDefault("complete"));
  const [hiddenCompanies, setHiddenCompanies] = useQueryState("hc", arrayParam);
  const [hiddenProjects, setHiddenProjects] = useQueryState("hp", arrayParam);
  const [selectedTags, setSelectedTags] = useQueryState("tags", arrayParam);
  const [tagMatchMode, setTagMatchMode] = useQueryState("match", matchParam);
  const [sectionsOff, setSectionsOff] = useQueryState("off", arrayParam);

  const [panelOpen, setPanelOpen] = useState(false);
  const [customFlavors, setCustomFlavors] = useState<CustomFlavor[]>([]);

  // localStorage is unavailable during SSR, so saved flavors load after mount.
  useEffect(() => {
    setCustomFlavors(loadCustomFlavors());
  }, []);

  const allFlavors = useMemo<ResumeFlavor[]>(() => [...FLAVORS, ...customFlavors], [customFlavors]);
  const flavor = useMemo(
    () => allFlavors.find((f) => f.id === flavorId) ?? allFlavors[0]!,
    [allFlavors, flavorId]
  );

  const filters = useMemo<FilterState>(() => {
    // The flavor supplies section defaults; `off` records what the reader
    // switched off on top of that.
    const sections = { ...flavor.sections };
    for (const key of sectionsOff) sections[key] = false;
    return {
      ...DEFAULT_FILTER_STATE,
      flavorId: flavor.id,
      sections,
      selectedTags,
      tagMatchMode,
      hiddenCompanies,
      hiddenProjects,
    };
  }, [flavor, sectionsOff, selectedTags, tagMatchMode, hiddenCompanies, hiddenProjects]);

  const work = useMemo(() => resolveWork(data, flavor, filters), [data, flavor, filters]);
  const projects = useMemo(() => resolveProjects(data, flavor, filters), [data, flavor, filters]);

  const visibleWork = useMemo(
    () => work.entries.filter((e) => work.matches.get(e.originalIndex)?.matched !== false),
    [work]
  );
  const visibleProjects = useMemo(
    () => projects.entries.filter((e) => projects.matches.get(e.originalIndex)?.matched !== false),
    [projects]
  );

  const sections = useMemo(
    () => buildSections(data, { work: visibleWork, projects: visibleProjects }, filters.sections),
    [data, visibleWork, visibleProjects, filters.sections]
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const tags of work.tags.values()) for (const t of tags) set.add(t);
    for (const tags of projects.tags.values()) for (const t of tags) set.add(t);
    return Array.from(set).sort();
  }, [work.tags, projects.tags]);

  const basics = useMemo(
    () => ({ ...data.basics, label: flavor.tagline }),
    [data.basics, flavor.tagline]
  );
  const contacts = useMemo(() => contactRows(basics), [basics]);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  const handleFiltersChange = useCallback(
    (next: FilterState) => {
      void setHiddenCompanies(next.hiddenCompanies.length ? next.hiddenCompanies : null);
      void setHiddenProjects(next.hiddenProjects.length ? next.hiddenProjects : null);
      void setSelectedTags(next.selectedTags.length ? next.selectedTags : null);
      void setTagMatchMode(next.tagMatchMode === "any" ? null : next.tagMatchMode);
      // Only record sections switched off relative to the flavor's own defaults.
      const off = DEFAULT_SECTIONS.filter(
        (s) => flavor.sections[s.key] && !next.sections[s.key]
      ).map((s) => s.key);
      void setSectionsOff(off.length ? off : null);
    },
    [
      flavor.sections,
      setHiddenCompanies,
      setHiddenProjects,
      setSelectedTags,
      setTagMatchMode,
      setSectionsOff,
    ]
  );

  const selectFlavor = useCallback(
    (id: string) => {
      void setFlavorId(id === "complete" ? null : id);
      const custom = customFlavors.find((f) => f.id === id);
      void setHiddenCompanies(custom?.hiddenCompanies.length ? custom.hiddenCompanies : null);
      void setHiddenProjects(custom?.hiddenProjects.length ? custom.hiddenProjects : null);
      void setSectionsOff(null);
      void setSelectedTags(null);
    },
    [
      customFlavors,
      setFlavorId,
      setHiddenCompanies,
      setHiddenProjects,
      setSectionsOff,
      setSelectedTags,
    ]
  );

  const reset = useCallback(() => {
    void setFlavorId(null);
    void setHiddenCompanies(null);
    void setHiddenProjects(null);
    void setSelectedTags(null);
    void setTagMatchMode(null);
    void setSectionsOff(null);
  }, [
    setFlavorId,
    setHiddenCompanies,
    setHiddenProjects,
    setSelectedTags,
    setTagMatchMode,
    setSectionsOff,
  ]);

  const handleExport = useCallback(
    (format: ExportFormat) => {
      void exportResume(format, buildExportData(data, basics, flavor, filters));
    },
    [data, basics, flavor, filters]
  );

  const handleSaveFlavor = useCallback(
    (name: string) => {
      const custom = filterStateToCustomFlavor(filters, name, flavor);
      saveCustomFlavor(custom);
      setCustomFlavors(loadCustomFlavors());
      void setFlavorId(custom.id);
    },
    [filters, flavor, setFlavorId]
  );

  const handleDeleteFlavor = useCallback(
    (id: string) => {
      deleteCustomFlavor(id);
      setCustomFlavors(loadCustomFlavors());
      if (flavorId === id) void setFlavorId(null);
    },
    [flavorId, setFlavorId]
  );

  /**
   * Download the current variant as a /flavors/*.json file. This is the bridge
   * from tuning a resume in the browser to committing the result to a repo.
   */
  const handleDownloadFlavor = useCallback(
    (name: string) => {
      const id = slugify(name);
      const file = flavorToFile(filterStateToCustomFlavor(filters, name, flavor), id);
      const blob = new Blob([`${JSON.stringify(file, null, 2)}\n`], { type: "application/json" });
      downloadBlob(blob, `${id}.json`);
    },
    [filters, flavor]
  );

  // Roving tabindex: the flavor list is a radiogroup, so arrows move between
  // options and only the selected one is in the tab order.
  const btnRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const handleFlavorKey = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const count = allFlavors.length;
      let next = idx;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % count;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + count) % count;
      else return;
      e.preventDefault();
      selectFlavor(allFlavors[next]!.id);
      btnRefs.current[next]?.focus();
    },
    [allFlavors, selectFlavor]
  );

  const desk = (
    <>
      <DeskLabel id="desk-label" />
      <div
        role="radiogroup"
        aria-labelledby="desk-label"
        style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}
      >
        {allFlavors.map((f, i) => (
          <FlavorButton
            key={f.id}
            id={f.id}
            label={f.label}
            swatch={f.accent}
            selected={flavor.id === f.id}
            onClick={() => selectFlavor(f.id)}
            onKeyDown={(e) => handleFlavorKey(e, i)}
            btnRef={(el) => {
              btnRefs.current[i] = el;
            }}
          />
        ))}
      </div>

      {panelOpen ? (
        <div style={{ marginTop: "1.75rem" }}>
          <ResumePanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            flavors={FLAVORS}
            customFlavors={customFlavors}
            activeFlavor={flavor}
            onSelectFlavor={selectFlavor}
            allTags={allTags}
            matchedWork={visibleWork.length}
            totalWork={work.entries.length}
            matchedProjects={visibleProjects.length}
            totalProjects={projects.entries.length}
            companies={work.entries.map((e) => e.name)}
            projects={projects.entries.map((e) => e.name)}
            onExport={handleExport}
            onSaveFlavor={handleSaveFlavor}
            onDeleteFlavor={handleDeleteFlavor}
            onDownloadFlavor={handleDownloadFlavor}
            onReset={reset}
            onClose={() => setPanelOpen(false)}
          />
        </div>
      ) : (
        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            style={deskActionStyle}
            className="ha"
          >
            ⚙ Customize
          </button>
          {EXPORT_FORMATS.map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => handleExport(fmt)}
              style={deskActionStyle}
              className="ha"
            >
              ↓ {fmt.toUpperCase()}
            </button>
          ))}
          <button
            type="button"
            onClick={() => window.print()}
            style={deskActionStyle}
            className="ha"
          >
            ⎙ Print
          </button>
        </div>
      )}
    </>
  );

  return (
    <ResumeFrame
      accent={flavor.accent}
      name={basics.name}
      tagline={basics.label}
      location={location}
      contacts={contacts}
      statement={flavor.statement}
      sections={sections}
      desk={desk}
      footerNote={`${basics.name} · ${resumeConfig.site.host}`}
      footerLinkLabel={basics.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      footerLinkHref={basics.url}
    />
  );
}
