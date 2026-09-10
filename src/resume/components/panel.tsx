"use client";

import { useEffect, useRef, useState } from "react";
import type { CustomFlavor } from "../lib/custom-flavors";
import type { ExportFormat } from "../lib/export";
import type { FilterState } from "../lib/filters";
import type { ResumeFlavor } from "../lib/flavors";
import { DEFAULT_SECTIONS } from "../lib/sections";
import { SCREEN, THEME_SANS } from "../lib/theme";
import type { SectionKey } from "../lib/types";

const S = SCREEN;

/**
 * The label of a role or project switched off in the builder.
 *
 * It used to be `S.dim` at half opacity, which composites to 2.19:1 on the
 * page background and fails WCAG AA for text. This is the dimmest value that
 * still clears 4.5:1. The strike-through carries the state on its own, so the
 * colour is only reinforcing it.
 */
const HIDDEN_INK = "#807D74";

/**
 * The edge of a switch in its off state. `S.hairline` is right for a divider,
 * which is decorative and exempt, but this is the boundary of a control and
 * has to clear 3:1 against the page. This is 3.6:1.
 */
const CONTROL_EDGE = "rgba(237, 234, 227, 0.42)";

export interface ResumePanelProps {
  filters: FilterState;
  onFiltersChange: (next: FilterState) => void;
  flavors: ResumeFlavor[];
  customFlavors: CustomFlavor[];
  activeFlavor: ResumeFlavor;
  onSelectFlavor: (id: string) => void;
  allTags: string[];
  matchedWork: number;
  totalWork: number;
  matchedProjects: number;
  totalProjects: number;
  companies: string[];
  projects: string[];
  onExport: (format: ExportFormat) => void;
  onSaveFlavor: (name: string) => void;
  onDeleteFlavor: (id: string) => void;
  onDownloadFlavor: (name: string) => void;
  onReset: () => void;
  onClose: () => void;
}

const label: React.CSSProperties = {
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: S.dim,
  marginBottom: "0.6rem",
  display: "block",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "0.75rem",
  padding: "0.3rem 0",
  fontSize: "0.85rem",
};

const linkButton: React.CSSProperties = {
  background: "none",
  border: "none",
  color: S.dim,
  fontFamily: THEME_SANS,
  fontSize: "0.72rem",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  cursor: "pointer",
  padding: 0,
};

function Toggle({ checked, onChange, id }: { checked: boolean; onChange: () => void; id: string }) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      style={{
        width: 30,
        height: 17,
        flexShrink: 0,
        borderRadius: 999,
        border: `1px solid ${checked ? "var(--accent)" : CONTROL_EDGE}`,
        background: checked ? "var(--accent)" : "transparent",
        cursor: "pointer",
        padding: 0,
        position: "relative",
        transition: "background 180ms ease, border-color 180ms ease",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 14 : 2,
          width: 11,
          height: 11,
          borderRadius: "50%",
          background: checked ? S.bg : S.dim,
          transition: "left 180ms ease",
        }}
      />
    </button>
  );
}

function Collapsible({
  title,
  hiddenCount,
  children,
}: {
  title: string;
  hiddenCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: "1.4rem" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          ...linkButton,
          display: "flex",
          width: "100%",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: open ? "0.6rem" : 0,
        }}
      >
        <span>
          {title}
          {hiddenCount > 0 && (
            <span style={{ color: "var(--accent)", marginLeft: "0.5rem" }}>
              {hiddenCount} hidden
            </span>
          )}
        </span>
        <span aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && children}
    </div>
  );
}

export function ResumePanel({
  filters,
  onFiltersChange,
  flavors,
  customFlavors,
  activeFlavor,
  onSelectFlavor,
  allTags,
  matchedWork,
  totalWork,
  matchedProjects,
  totalProjects,
  companies,
  projects,
  onExport,
  onSaveFlavor,
  onDeleteFlavor,
  onDownloadFlavor,
  onReset,
  onClose,
}: ResumePanelProps) {
  const [naming, setNaming] = useState<"save" | "download" | null>(null);
  const [draftName, setDraftName] = useState("");

  // The name field replaces the button that opened it, which would otherwise
  // drop focus to the body mid-task.
  const nameRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (naming) nameRef.current?.focus();
  }, [naming]);

  const isCustomActive = customFlavors.some((f) => f.id === activeFlavor.id);
  const hiddenCount = filters.hiddenCompanies.length + filters.hiddenProjects.length;

  const toggleSection = (key: SectionKey) =>
    onFiltersChange({
      ...filters,
      sections: { ...filters.sections, [key]: !filters.sections[key] },
    });

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // Entry names contain spaces and slashes; ids must not.
  const domId = (prefix: string, name: string) =>
    `${prefix}-${name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")}`;

  const commitName = () => {
    const name = draftName.trim();
    if (!name) return;
    if (naming === "save") onSaveFlavor(name);
    else onDownloadFlavor(name);
    setDraftName("");
    setNaming(null);
  };

  return (
    // Not <aside>: this sits inside the rail's <header>, and a complementary
    // landmark nested inside another landmark is not exposed as a landmark at
    // all. The "Builder" heading below names the group instead.
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        fontFamily: THEME_SANS,
        color: S.ink,
      }}
    >
      <div style={{ ...rowStyle, marginBottom: "0.5rem" }}>
        <h2 style={{ fontSize: "0.9rem", fontWeight: 600, margin: 0 }}>Builder</h2>
        <span style={{ display: "flex", gap: "0.9rem" }}>
          <button type="button" onClick={onReset} style={linkButton} className="ha">
            Reset
          </button>
          <button type="button" onClick={onClose} style={linkButton} className="ha">
            Close
          </button>
        </span>
      </div>

      <p aria-live="polite" style={{ fontSize: "0.78rem", color: S.dim, margin: "0 0 1rem" }}>
        <span style={{ color: S.ink, fontVariantNumeric: "tabular-nums" }}>{matchedWork}</span>/
        {totalWork} roles,{" "}
        <span style={{ color: S.ink, fontVariantNumeric: "tabular-nums" }}>{matchedProjects}</span>/
        {totalProjects} projects
        {hiddenCount > 0 && <span style={{ color: "var(--accent)" }}> · {hiddenCount} hidden</span>}
      </p>

      {customFlavors.length > 0 && (
        <div style={{ marginBottom: "1.2rem" }}>
          <span style={label}>Saved</span>
          {customFlavors.map((f) => (
            <div key={f.id} style={rowStyle}>
              <button
                type="button"
                onClick={() => onSelectFlavor(f.id)}
                style={{
                  ...linkButton,
                  textTransform: "none",
                  letterSpacing: 0,
                  fontSize: "0.85rem",
                  color: activeFlavor.id === f.id ? "var(--accent)" : S.ink,
                }}
                className="ha"
              >
                {f.label}
              </button>
              <button
                type="button"
                onClick={() => onDeleteFlavor(f.id)}
                aria-label={`Delete ${f.label}`}
                style={{ ...linkButton, fontSize: "0.9rem" }}
                className="ha"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <span style={label}>Sections</span>
        {DEFAULT_SECTIONS.map((section) => (
          <div key={section.key} style={rowStyle}>
            <label htmlFor={`section-${section.key}`} style={{ color: S.dim }}>
              {section.label}
            </label>
            <Toggle
              id={`section-${section.key}`}
              checked={filters.sections[section.key] ?? false}
              onChange={() => toggleSection(section.key)}
            />
          </div>
        ))}
      </div>

      <Collapsible title="Roles" hiddenCount={filters.hiddenCompanies.length}>
        {companies.map((name) => {
          const visible = !filters.hiddenCompanies.includes(name);
          return (
            <div key={name} style={rowStyle}>
              <label
                htmlFor={domId("company", name)}
                style={{
                  color: visible ? S.dim : HIDDEN_INK,
                  textDecoration: visible ? "none" : "line-through",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={name}
              >
                {name}
              </label>
              <Toggle
                id={domId("company", name)}
                checked={visible}
                onChange={() =>
                  onFiltersChange({
                    ...filters,
                    hiddenCompanies: toggleIn(filters.hiddenCompanies, name),
                  })
                }
              />
            </div>
          );
        })}
        {filters.hiddenCompanies.length > 0 && (
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, hiddenCompanies: [] })}
            style={{ ...linkButton, marginTop: "0.5rem" }}
            className="ha"
          >
            Show all roles
          </button>
        )}
      </Collapsible>

      <Collapsible title="Projects" hiddenCount={filters.hiddenProjects.length}>
        {projects.map((name) => {
          const visible = !filters.hiddenProjects.includes(name);
          return (
            <div key={name} style={rowStyle}>
              <label
                htmlFor={domId("project", name)}
                style={{
                  color: visible ? S.dim : HIDDEN_INK,
                  textDecoration: visible ? "none" : "line-through",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={name}
              >
                {name}
              </label>
              <Toggle
                id={domId("project", name)}
                checked={visible}
                onChange={() =>
                  onFiltersChange({
                    ...filters,
                    hiddenProjects: toggleIn(filters.hiddenProjects, name),
                  })
                }
              />
            </div>
          );
        })}
        {filters.hiddenProjects.length > 0 && (
          <button
            type="button"
            onClick={() => onFiltersChange({ ...filters, hiddenProjects: [] })}
            style={{ ...linkButton, marginTop: "0.5rem" }}
            className="ha"
          >
            Show all projects
          </button>
        )}
      </Collapsible>

      <div style={{ marginTop: "1.4rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={label}>Technologies</span>
          <span style={{ display: "flex", gap: "0.75rem", marginBottom: "0.6rem" }}>
            <button
              type="button"
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  tagMatchMode: filters.tagMatchMode === "any" ? "all" : "any",
                })
              }
              style={linkButton}
              className="ha"
              // No aria-label here. The visible text is "match any", and an
              // aria-label replaces it, so the accessible name would no longer
              // contain the words on the button: WCAG 2.5.3, and it breaks
              // "click match any" for anyone driving the page by voice.
              title="Whether an entry must match any selected tag or all of them"
            >
              match {filters.tagMatchMode}
            </button>
            {filters.selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => onFiltersChange({ ...filters, selectedTags: [] })}
                style={linkButton}
                className="ha"
              >
                Clear
              </button>
            )}
          </span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
          {allTags.map((tag) => {
            const on = filters.selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  onFiltersChange({
                    ...filters,
                    selectedTags: toggleIn(filters.selectedTags, tag),
                  })
                }
                style={{
                  fontFamily: THEME_SANS,
                  fontSize: "0.72rem",
                  padding: "0.2rem 0.5rem",
                  borderRadius: 3,
                  cursor: "pointer",
                  border: `1px solid ${on ? "var(--accent)" : S.hairline}`,
                  background: on ? "var(--accent)" : "transparent",
                  color: on ? S.bg : S.dim,
                  transition: "border-color 180ms ease, color 180ms ease",
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{ marginTop: "1.6rem", borderTop: `1px solid ${S.hairline}`, paddingTop: "1rem" }}
      >
        {naming ? (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              ref={nameRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") setNaming(null);
              }}
              placeholder={naming === "save" ? "Flavor name" : "File name"}
              aria-label={naming === "save" ? "Flavor name" : "File name"}
              style={{
                flex: 1,
                minWidth: 0,
                background: "transparent",
                border: `1px solid ${S.hairline}`,
                borderRadius: 3,
                color: S.ink,
                fontFamily: THEME_SANS,
                fontSize: "0.8rem",
                padding: "0.3rem 0.5rem",
              }}
            />
            <button type="button" onClick={commitName} style={linkButton} className="ha">
              OK
            </button>
            <button
              type="button"
              onClick={() => setNaming(null)}
              aria-label="Cancel"
              style={linkButton}
              className="ha"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
            {!isCustomActive && (
              <button
                type="button"
                onClick={() => setNaming("save")}
                style={linkButton}
                className="ha"
              >
                Save flavor
              </button>
            )}
            <button
              type="button"
              onClick={() => setNaming("download")}
              style={linkButton}
              className="ha"
              title="Download this variant as a /flavors/*.json file"
            >
              <span aria-hidden="true">↓ </span>Flavor JSON
            </button>
            {(["pdf", "docx", "html"] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => onExport(fmt)}
                style={linkButton}
                className="ha"
              >
                <span aria-hidden="true">↓ </span>
                {fmt.toUpperCase()}
              </button>
            ))}
            <button type="button" onClick={() => window.print()} style={linkButton} className="ha">
              <span aria-hidden="true">⎙ </span>Print
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
