"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import { useQueryState, parseAsString } from "nuqs";
import type { ResumeSchema } from "../lib/types";
import { resolveWork, resolveProjects, DEFAULT_FILTER_STATE } from "../lib/filters";
import { FLAVORS } from "../lib/flavors";
import { type ExportFormat, exportResume, buildExportData } from "../lib/export";
import { contactRows } from "../lib/export-shared";
import { SPECTRUM, SPECTRUM_ACCENTS, getAccent, getStatement } from "../lib/spectrum";
import {
  TopRule, StatementBlock, SectionBlock, FlavorButton, SF,
} from "./spectrum-parts";
import { buildSections } from "../lib/sections";

const S = SPECTRUM;

const SPECTRUM_CSS = `
  .spectrum-frame a.ha:hover { color: var(--accent) !important; text-decoration: underline; text-underline-offset: 3px; }
  .spectrum-frame .project-link:hover { background: ${S.lift} !important; }
  .spectrum-frame .project-link:hover .project-arrow { transform: translateX(3px); }
  @media (prefers-reduced-motion: reduce) {
    .spectrum-frame *, .spectrum-frame *::before, .spectrum-frame *::after { transition: none !important; }
  }
  @media (max-width: 860px) {
    .spectrum-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
    .spectrum-rail { position: static !important; height: auto !important; }
    .spectrum-desk { margin-top: 1.75rem !important; padding-top: 0 !important; }
    .spectrum-desk [role="radiogroup"] { flex-direction: row !important; flex-wrap: wrap !important; gap: 0.25rem 0.5rem !important; }
    .spectrum-desk button { margin-left: 0 !important; }
    .spectrum-main { padding-top: 3rem !important; }
    .spectrum-entry { grid-template-columns: 1fr !important; gap: 0.25rem !important; }
  }
`;

export function ResumeViewer({ data }: { data: ResumeSchema }) {
  const [flavorParam, setFlavorParam] = useQueryState("flavor", parseAsString.withDefault("complete"));
  const [flavorId, setFlavorId] = useState(flavorParam);

  const flavor = useMemo(() => FLAVORS.find((f) => f.id === flavorId) ?? FLAVORS[0]!, [flavorId]);
  const accent = useMemo(() => getAccent(flavorId), [flavorId]);
  const statement = useMemo(() => getStatement(flavorId), [flavorId]);

  useEffect(() => {
    setFlavorParam(flavorId === "complete" ? null : flavorId);
  }, [flavorId, setFlavorParam]);

  const filters = useMemo(
    () => ({ ...DEFAULT_FILTER_STATE, flavorId, sections: flavor.sections }),
    [flavorId, flavor.sections],
  );
  const { entries: workEntries } = useMemo(() => resolveWork(data, flavor, filters), [data, flavor, filters]);
  const { entries: projectEntries } = useMemo(() => resolveProjects(data, flavor, filters), [data, flavor, filters]);

  const sections = useMemo(
    () => buildSections(data, { work: workEntries, projects: projectEntries }, filters.sections),
    [data, workEntries, projectEntries, filters.sections],
  );

  const basics = useMemo(() => ({ ...data.basics, label: flavor.tagline }), [data.basics, flavor.tagline]);
  const contacts = useMemo(() => contactRows(basics), [basics]);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  const handleExport = useCallback(
    (format: ExportFormat) => {
      const ed = buildExportData(data, basics, flavor, filters);
      void exportResume(format, ed);
    },
    [data, basics, flavor, filters],
  );

  // Roving tabindex for flavor radiogroup
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const flavorIds = FLAVORS.map((f) => f.id);

  const handleFlavorKey = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      let next = idx;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % flavorIds.length;
      else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + flavorIds.length) % flavorIds.length;
      else return;
      e.preventDefault();
      setFlavorId(flavorIds[next]!);
      btnRefs.current[next]?.focus();
    },
    [flavorIds],
  );

  return (
    <>
      <style>{SPECTRUM_CSS}</style>
      <TopRule accent={accent} />

      <div
        className="spectrum-frame"
        style={{
          "--accent": accent,
          background: S.bg,
          color: S.ink,
          fontFamily: SF,
          fontSize: 16,
          lineHeight: 1.55,
          WebkitFontSmoothing: "antialiased",
          minHeight: "100dvh",
          transition: "color 300ms ease",
        } as React.CSSProperties}
      >
        <div
          className="spectrum-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr)",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 2rem",
            gap: "4rem",
          }}
        >
          {/* ── Rail ── */}
          <header
            className="spectrum-rail"
            style={{
              position: "sticky",
              top: 0,
              alignSelf: "start",
              height: "100dvh",
              display: "flex",
              flexDirection: "column",
              padding: "3.5rem 0 2.5rem",
            }}
          >
            <h1 style={{ fontSize: "1.35rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              {basics.name}
            </h1>
            <p style={{ color: S.dim, fontSize: "0.9rem", marginTop: "0.35rem", maxWidth: "24ch" }}>
              {basics.label}{location ? `. ${location}.` : ""}
            </p>

            <nav aria-label="Contact" style={{ marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              {contacts.map((row) =>
                row.href ? (
                  <a key={row.text} href={row.href} style={{ color: S.dim, fontSize: "0.85rem", textDecoration: "none", transition: "color 300ms ease" }} className="ha">
                    {row.text}
                  </a>
                ) : (
                  <span key={row.text} style={{ color: S.dim, fontSize: "0.85rem" }}>{row.text}</span>
                )
              )}
            </nav>

            {/* Mixing desk */}
            <div className="spectrum-desk" style={{ marginTop: "auto", paddingTop: "2.5rem" }}>
              <p id="desk-label" style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.14em", color: S.dim, marginBottom: "0.9rem" }}>
                Render as
              </p>
              <div role="radiogroup" aria-labelledby="desk-label" style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}>
                {FLAVORS.map((f, i) => (
                  <FlavorButton
                    key={f.id}
                    id={f.id}
                    label={f.label}
                    swatch={SPECTRUM_ACCENTS[f.id] ?? SPECTRUM_ACCENTS.complete!}
                    selected={flavorId === f.id}
                    onClick={() => setFlavorId(f.id)}
                    onKeyDown={(e) => handleFlavorKey(e, i)}
                    btnRef={(el) => { btnRefs.current[i] = el; }}
                  />
                ))}
              </div>
              <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {(["pdf", "docx", "html"] as ExportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => handleExport(fmt)}
                    style={{
                      background: "none", border: "none", color: S.dim, fontFamily: SF,
                      fontSize: "0.75rem", cursor: "pointer", padding: 0,
                      textTransform: "uppercase", letterSpacing: "0.08em", transition: "color 200ms ease",
                    }}
                    className="ha"
                  >
                    ↓ {fmt.toUpperCase()}
                  </button>
                ))}
                <button
                  onClick={() => window.print()}
                  style={{
                    background: "none", border: "none", color: S.dim, fontFamily: SF,
                    fontSize: "0.75rem", cursor: "pointer", padding: 0,
                    textTransform: "uppercase", letterSpacing: "0.08em", transition: "color 200ms ease",
                  }}
                  className="ha"
                >
                  ⎙ Print
                </button>
              </div>
            </div>
          </header>

          {/* ── Main ── */}
          <main className="spectrum-main" style={{ padding: "6rem 0 4rem", maxWidth: 720 }}>
            <StatementBlock statement={statement} />

            {sections.map((section) => (
              <SectionBlock key={section.key} section={section} />
            ))}

            <footer style={{ marginTop: "6rem", paddingTop: "2rem", borderTop: `1px solid ${S.hairline}`, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.8rem", color: S.dim }}>
              <span>{basics.name} · resume.lacy.sh</span>
              <a href="https://lacymorrow.com" target="_blank" rel="noopener noreferrer" style={{ color: S.dim, textDecoration: "none", transition: "color 300ms ease" }} className="ha">lacymorrow.com</a>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}
