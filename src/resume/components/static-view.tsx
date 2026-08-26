import { resumeConfig } from "../config";
import { contactRows } from "../lib/export-shared";
import { DEFAULT_FILTER_STATE, resolveProjects, resolveWork } from "../lib/filters";
import { FLAVORS, type ResumeFlavor } from "../lib/flavors";
import { buildSections } from "../lib/sections";
import { getAccent, getStatement, SPECTRUM, SPECTRUM_ACCENTS } from "../lib/spectrum";
import type { ResumeSchema } from "../lib/types";
import { DeskLabel, ResumeFrame } from "./frame";
import { SF } from "./spectrum-parts";

const S = SPECTRUM;

interface ResumeStaticProps {
  data: ResumeSchema;
  flavor: ResumeFlavor;
  hiddenCompanies?: string[];
  hiddenProjects?: string[];
}

/**
 * Server-rendered resume for crawlers, ATS, link previews, and the moment
 * before hydration. Renders the same frame and sections as the interactive
 * viewer — only the rail controls differ, since anchors work without
 * JavaScript and buttons do not.
 */
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

  const { entries: workEntries } = resolveWork(data, flavor, filters);
  const { entries: projectEntries } = resolveProjects(data, flavor, filters);
  const sections = buildSections(
    data,
    { work: workEntries, projects: projectEntries },
    filters.sections
  );

  const basics = { ...data.basics, label: flavor.tagline };
  const contacts = contactRows(basics);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  const desk = (
    <>
      <DeskLabel id="desk-label" />
      <nav
        aria-labelledby="desk-label"
        style={{ display: "flex", flexDirection: "column", gap: "0.15rem" }}
      >
        {FLAVORS.map((f) => (
          <StaticFlavorLink
            key={f.id}
            id={f.id}
            label={f.label}
            swatch={SPECTRUM_ACCENTS[f.id] ?? SPECTRUM_ACCENTS.complete!}
            selected={flavor.id === f.id}
          />
        ))}
      </nav>
    </>
  );

  return (
    <ResumeFrame
      accent={getAccent(flavor.id)}
      name={basics.name}
      tagline={basics.label}
      location={location}
      contacts={contacts}
      statement={getStatement(flavor.id)}
      sections={sections}
      desk={desk}
      footerNote={`${basics.name} · ${resumeConfig.site.host}`}
      footerLinkLabel={basics.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      footerLinkHref={basics.url}
    />
  );
}

/**
 * The no-JS counterpart to FlavorButton. Real links, so every flavor is
 * crawlable and reachable before hydration — each one has its own metadata.
 */
function StaticFlavorLink({
  id,
  label,
  swatch,
  selected,
}: {
  id: string;
  label: string;
  swatch: string;
  selected: boolean;
}) {
  return (
    <a
      href={id === "complete" ? "/" : `/?flavor=${id}`}
      aria-current={selected ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        color: selected ? "var(--accent)" : S.dim,
        fontFamily: SF,
        fontSize: "0.95rem",
        fontWeight: selected ? 600 : 400,
        padding: "0.45rem 0.6rem",
        marginLeft: "-0.6rem",
        textDecoration: "none",
        borderRadius: 4,
        transition: "color 300ms ease, background 200ms ease",
      }}
      className="ha"
    >
      <span
        aria-hidden="true"
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          background: swatch,
          flexShrink: 0,
          opacity: selected ? 1 : 0.75,
          boxShadow: selected ? `0 0 0 3px color-mix(in srgb, ${swatch} 22%, transparent)` : "none",
        }}
      />
      {label}
    </a>
  );
}
