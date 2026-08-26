"use client";

import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resumeConfig } from "../config";
import { buildExportData, type ExportFormat, exportResume } from "../lib/export";
import { contactRows } from "../lib/export-shared";
import { DEFAULT_FILTER_STATE, resolveProjects, resolveWork } from "../lib/filters";
import { FLAVORS } from "../lib/flavors";
import { buildSections } from "../lib/sections";
import { FLAVOR_ACCENTS, getAccent, getStatement, SCREEN } from "../lib/theme";
import type { ResumeSchema } from "../lib/types";
import { DeskLabel, ResumeFrame } from "./frame";
import { FlavorButton, SF } from "./parts";

const S = SCREEN;

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
  const [flavorParam, setFlavorParam] = useQueryState(
    "flavor",
    parseAsString.withDefault("complete")
  );
  const [flavorId, setFlavorId] = useState(flavorParam);

  const flavor = useMemo(() => FLAVORS.find((f) => f.id === flavorId) ?? FLAVORS[0]!, [flavorId]);
  const accent = useMemo(() => getAccent(flavorId), [flavorId]);
  const statement = useMemo(() => getStatement(flavorId), [flavorId]);

  useEffect(() => {
    setFlavorParam(flavorId === "complete" ? null : flavorId);
  }, [flavorId, setFlavorParam]);

  const filters = useMemo(
    () => ({ ...DEFAULT_FILTER_STATE, flavorId, sections: flavor.sections }),
    [flavorId, flavor.sections]
  );
  const { entries: workEntries } = useMemo(
    () => resolveWork(data, flavor, filters),
    [data, flavor, filters]
  );
  const { entries: projectEntries } = useMemo(
    () => resolveProjects(data, flavor, filters),
    [data, flavor, filters]
  );

  const sections = useMemo(
    () => buildSections(data, { work: workEntries, projects: projectEntries }, filters.sections),
    [data, workEntries, projectEntries, filters.sections]
  );

  const basics = useMemo(
    () => ({ ...data.basics, label: flavor.tagline }),
    [data.basics, flavor.tagline]
  );
  const contacts = useMemo(() => contactRows(basics), [basics]);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  const handleExport = useCallback(
    (format: ExportFormat) => {
      const ed = buildExportData(data, basics, flavor, filters);
      void exportResume(format, ed);
    },
    [data, basics, flavor, filters]
  );

  // Roving tabindex for the flavor radiogroup.
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flavorIds = FLAVORS.map((f) => f.id);

  const handleFlavorKey = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      let next = idx;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % flavorIds.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
        next = (idx - 1 + flavorIds.length) % flavorIds.length;
      else return;
      e.preventDefault();
      setFlavorId(flavorIds[next]!);
      btnRefs.current[next]?.focus();
    },
    [flavorIds]
  );

  const desk = (
    <>
      <DeskLabel id="desk-label" />
      <div
        role="radiogroup"
        aria-labelledby="desk-label"
        style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}
      >
        {FLAVORS.map((f, i) => (
          <FlavorButton
            key={f.id}
            id={f.id}
            label={f.label}
            swatch={FLAVOR_ACCENTS[f.id] ?? FLAVOR_ACCENTS.complete!}
            selected={flavorId === f.id}
            onClick={() => setFlavorId(f.id)}
            onKeyDown={(e) => handleFlavorKey(e, i)}
            btnRef={(el) => {
              btnRefs.current[i] = el;
            }}
          />
        ))}
      </div>
      <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
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
        <button type="button" onClick={() => window.print()} style={deskActionStyle} className="ha">
          ⎙ Print
        </button>
      </div>
    </>
  );

  return (
    <ResumeFrame
      accent={accent}
      name={basics.name}
      tagline={basics.label}
      location={location}
      contacts={contacts}
      statement={statement}
      sections={sections}
      desk={desk}
      footerNote={`${basics.name} · ${resumeConfig.site.host}`}
      footerLinkLabel={basics.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      footerLinkHref={basics.url}
    />
  );
}
