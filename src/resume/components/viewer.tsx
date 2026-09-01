"use client";

import { useRouter } from "next/navigation";
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
import { contactRows, displayUrl, downloadBlob, footerHref } from "../lib/export-shared";
import {
  DEFAULT_FILTER_STATE,
  type FilterState,
  getFlavorVisibleCompanies,
  getFlavorVisibleProjects,
  resolveProjects,
  resolveWork,
} from "../lib/filters";
import { FLAVORS, type ResumeFlavor } from "../lib/flavors";
import { DEFAULT_FLAVOR_ID, flavorHref } from "../lib/routes";
import { buildSections, DEFAULT_SECTIONS } from "../lib/sections";
import { SCREEN } from "../lib/theme";
import { markFlavor, transitionToFlavor } from "../lib/transitions";
import type { ResumeSchema } from "../lib/types";
import { DeskLabel, ResumeFrame } from "./frame";
import { ResumePanel } from "./panel";
import { FlavorButton, SF } from "./parts";

const S = SCREEN;

const arrayParam = parseAsArrayOf(parseAsString).withDefault([]);
const matchParam = parseAsStringLiteral(["any", "all"] as const).withDefault("any");

const EXPORT_FORMATS: ExportFormat[] = ["pdf", "docx", "html"];

/** Stable empty array so the pre-mount memo doesn't churn. */
const NONE: string[] = [];

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

export function ResumeViewer({
  data,
  flavorId,
}: {
  data: ResumeSchema;
  /** Comes from the route, so the prerendered HTML is already the right flavor. */
  flavorId: string;
}) {
  const router = useRouter();

  // Builder state lives in the query string so a tuned resume is a shareable
  // link. It is read from window.location rather than useSearchParams, which is
  // what keeps these pages statically prerenderable.
  //
  // The prerendered HTML cannot know the query string, so the first client
  // render has to match it exactly or hydration mismatches. `applied` stays
  // false until after mount; the untuned resume is what the server produced,
  // and the tuning lands on the next render.
  const [applied, setApplied] = useState(false);
  useEffect(() => setApplied(true), []);

  // Legacy /?flavor=x links redirect to /x, but Next forwards the original
  // query string, so a stale `flavor` parameter rides along. Drop it so a
  // shared old link still ends up on the clean canonical URL.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("flavor")) return;
    url.searchParams.delete("flavor");
    window.history.replaceState(window.history.state, "", url);
  }, []);

  // Saved flavors live only in this browser's localStorage, so they are a query
  // parameter rather than a path — no server could prerender them.
  const [savedFlavorId, setSavedFlavorId] = useQueryState("saved", parseAsString);
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

  // A saved flavor overrides the route's flavor once localStorage has loaded.
  const activeFlavorId = applied && savedFlavorId ? savedFlavorId : flavorId;
  const flavor = useMemo(
    () =>
      allFlavors.find((f) => f.id === activeFlavorId) ??
      allFlavors.find((f) => f.id === flavorId) ??
      allFlavors[0]!,
    [allFlavors, activeFlavorId, flavorId]
  );

  /**
   * The flavor on screen, published where the transition helper can see it.
   * Built-in flavors are separate pages, so the switch remounts this component
   * and an attribute on the document is the only thing that outlives it.
   */
  useEffect(() => {
    markFlavor(flavor.id);
  }, [flavor.id]);

  /**
   * A view transition freezes the page until the new flavor renders, so an
   * unprefetched push would stall it for as long as the request takes. The
   * flavor pages are static and there are a handful of them; fetching them
   * while the browser is idle makes every switch a local render.
   */
  useEffect(() => {
    const warm = () => {
      for (const f of FLAVORS) router.prefetch(flavorHref(f.id));
    };
    if (typeof window.requestIdleCallback !== "function") {
      const t = setTimeout(warm, 1200);
      return () => clearTimeout(t);
    }
    const id = window.requestIdleCallback(warm, { timeout: 3000 });
    return () => window.cancelIdleCallback(id);
  }, [router]);

  const filters = useMemo<FilterState>(() => {
    // The flavor supplies section defaults; `off` records what the reader
    // switched off on top of that. Nothing from the query string counts until
    // after mount, so this matches the prerendered HTML on the first render.
    const sections = { ...flavor.sections };
    if (applied) for (const key of sectionsOff) sections[key] = false;
    return {
      ...DEFAULT_FILTER_STATE,
      flavorId: flavor.id,
      sections,
      selectedTags: applied ? selectedTags : NONE,
      tagMatchMode: applied ? tagMatchMode : DEFAULT_FILTER_STATE.tagMatchMode,
      hiddenCompanies: applied ? hiddenCompanies : NONE,
      hiddenProjects: applied ? hiddenProjects : NONE,
    };
  }, [applied, flavor, sectionsOff, selectedTags, tagMatchMode, hiddenCompanies, hiddenProjects]);

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

  /**
   * The builder lists every role and project the *flavor* shows, not the ones
   * that survive the current filters. Sourcing it from the filtered set instead
   * would drop a row the moment its toggle was switched off, leaving no way to
   * switch it back on again.
   */
  const flavorCompanies = useMemo(() => getFlavorVisibleCompanies(data, flavor), [data, flavor]);
  const flavorProjects = useMemo(() => getFlavorVisibleProjects(data, flavor), [data, flavor]);

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

  /**
   * Built-in flavors are pages, so switching one is a navigation. Saved flavors
   * exist only in this browser, so they stay a query parameter.
   *
   * The query state is cleared explicitly rather than left to the new URL:
   * router.push does not emit popstate, so nuqs would otherwise keep serving
   * the previous page's builder state.
   */
  const selectFlavor = useCallback(
    (id: string) => {
      const custom = customFlavors.find((f) => f.id === id);
      transitionToFlavor(id, () => {
        void setHiddenCompanies(custom?.hiddenCompanies.length ? custom.hiddenCompanies : null);
        void setHiddenProjects(custom?.hiddenProjects.length ? custom.hiddenProjects : null);
        void setSectionsOff(null);
        void setSelectedTags(null);

        if (custom) {
          void setSavedFlavorId(id);
          return;
        }
        void setSavedFlavorId(null);
        router.push(flavorHref(id));
      });
    },
    [
      customFlavors,
      router,
      setSavedFlavorId,
      setHiddenCompanies,
      setHiddenProjects,
      setSectionsOff,
      setSelectedTags,
    ]
  );

  const reset = useCallback(() => {
    transitionToFlavor(DEFAULT_FLAVOR_ID, () => {
      void setSavedFlavorId(null);
      void setHiddenCompanies(null);
      void setHiddenProjects(null);
      void setSelectedTags(null);
      void setTagMatchMode(null);
      void setSectionsOff(null);
      router.push(flavorHref(DEFAULT_FLAVOR_ID));
    });
  }, [
    router,
    setSavedFlavorId,
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
      void setSavedFlavorId(custom.id);
    },
    [filters, flavor, setSavedFlavorId]
  );

  const handleDeleteFlavor = useCallback(
    (id: string) => {
      deleteCustomFlavor(id);
      setCustomFlavors(loadCustomFlavors());
      if (savedFlavorId === id) void setSavedFlavorId(null);
    },
    [savedFlavorId, setSavedFlavorId]
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
            href={
              customFlavors.some((c) => c.id === f.id)
                ? `?saved=${encodeURIComponent(f.id)}`
                : flavorHref(f.id)
            }
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
            companies={flavorCompanies}
            projects={flavorProjects}
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
      footerLinkLabel={displayUrl(footerHref(basics.url))}
      footerLinkHref={footerHref(basics.url)}
    />
  );
}
