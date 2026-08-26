import type React from "react";
import { formatYearRange } from "../lib/export-shared";
import type { CredentialItem, KeywordItem, NormalizedSection, QuoteItem } from "../lib/sections";
import { type FlavorStatement, renderStatement, SCREEN } from "../lib/theme";

const S = SCREEN;
export const SF = `var(--font-instrument-sans), 'Instrument Sans', system-ui, sans-serif`;

export function TopRule({ accent }: { accent: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: accent,
        transition: "background 300ms ease",
        zIndex: 50,
      }}
    />
  );
}

export function SectionHead({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <div
      id={id}
      style={{
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: S.dim,
        fontWeight: 500,
        paddingBottom: "0.9rem",
        borderBottom: `1px solid ${S.hairline}`,
        marginBottom: "0.5rem",
      }}
    >
      {children}
    </div>
  );
}

export function StatementBlock({ statement }: { statement: FlavorStatement }) {
  return (
    <section aria-label="Introduction">
      <h2
        style={{
          fontSize: "clamp(2.5rem, 5vw, 4rem)",
          fontWeight: 500,
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
        }}
      >
        {renderStatement(statement.statement)}
      </h2>
      <p style={{ marginTop: "1.5rem", color: S.dim, fontSize: "1.05rem", maxWidth: "52ch" }}>
        {statement.sub}
      </p>
    </section>
  );
}

export function WorkEntry({
  position,
  name,
  startDate,
  endDate,
  summary,
  highlights,
  url,
}: {
  position: string;
  name: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  url?: string;
}) {
  const years = formatYearRange(startDate, endDate);
  return (
    <li
      className="resume-entry"
      style={{
        display: "grid",
        gridTemplateColumns: "5.5rem minmax(0, 1fr)",
        gap: "1.5rem",
        padding: "1.6rem 0",
        borderBottom: `1px solid ${S.hairline}`,
        listStyle: "none",
      }}
    >
      <span
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--accent)",
          fontVariantNumeric: "tabular-nums",
          paddingTop: "0.15rem",
          transition: "color 300ms ease",
        }}
      >
        {years}
      </span>
      <div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {position}
        </h3>
        <p style={{ color: S.dim, fontSize: "0.9rem", marginTop: "0.15rem" }}>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: S.dim, textDecoration: "none", transition: "color 300ms ease" }}
              className="ha"
            >
              {name}
            </a>
          ) : (
            name
          )}
        </p>
        {summary && (
          <p style={{ marginTop: "0.6rem", fontSize: "0.95rem", maxWidth: "56ch" }}>{summary}</p>
        )}
        {highlights && highlights.length > 0 && (
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.2rem" }}>
            {highlights.slice(0, 3).map((h, i) => (
              <li key={i} style={{ fontSize: "0.85rem", color: S.dim, marginTop: "0.2rem" }}>
                {h}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

export function ProjectRow({
  name,
  summary,
  url,
}: {
  name: string;
  summary: string;
  url?: string;
}) {
  const inner = (
    <>
      <span style={{ fontWeight: 600, fontSize: "1rem" }}>{name}</span>
      <span style={{ color: S.dim, fontSize: "0.9rem" }}>{summary}</span>
      <span
        aria-hidden="true"
        style={{
          color: "var(--accent)",
          fontSize: "0.95rem",
          transition: "color 300ms ease, transform 200ms ease",
        }}
        className="project-arrow"
      >
        →
      </span>
    </>
  );
  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "10rem minmax(0, 1fr) auto",
    gap: "1.5rem",
    alignItems: "baseline",
    padding: "1.15rem 0.75rem",
    margin: "0 -0.75rem",
    color: S.ink,
    borderBottom: `1px solid ${S.hairline}`,
    borderRadius: 4,
    textDecoration: "none",
    transition: "background 200ms ease",
  };
  return (
    <li style={{ listStyle: "none" }}>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={grid}
          className="project-link"
        >
          {inner}
        </a>
      ) : (
        <div style={grid}>{inner}</div>
      )}
    </li>
  );
}

export function FlavorButton({
  id,
  label,
  swatch,
  selected,
  onClick,
  onKeyDown,
  btnRef,
}: {
  id: string;
  label: string;
  swatch: string;
  selected: boolean;
  onClick: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  btnRef?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={btnRef}
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      onKeyDown={onKeyDown}
      tabIndex={selected ? 0 : -1}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.7rem",
        background: "none",
        border: "none",
        color: selected ? "var(--accent)" : S.dim,
        fontFamily: SF,
        fontSize: "0.95rem",
        fontWeight: selected ? 600 : 400,
        padding: "0.45rem 0.6rem",
        marginLeft: "-0.6rem",
        cursor: "pointer",
        textAlign: "left",
        borderRadius: 4,
        transition: "color 300ms ease, background 200ms ease",
      }}
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
          transition: "opacity 200ms ease, box-shadow 200ms ease",
        }}
      />
      {label}
    </button>
  );
}

/**
 * Credentials cover education, awards, certificates, and publications — all
 * "a thing, who issued it, when". One renderer, four collections.
 */
export function CredentialRow({ item }: { item: CredentialItem }) {
  const year = item.endDate
    ? formatYearRange(item.startDate ?? item.endDate, item.endDate)
    : item.startDate
      ? formatYearRange(item.startDate)
      : "";
  return (
    <li
      className="resume-entry"
      style={{
        display: "grid",
        gridTemplateColumns: "5.5rem minmax(0, 1fr)",
        gap: "1.5rem",
        padding: "1.1rem 0",
        borderBottom: `1px solid ${S.hairline}`,
        listStyle: "none",
      }}
    >
      <span
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--accent)",
          fontVariantNumeric: "tabular-nums",
          paddingTop: "0.15rem",
          transition: "color 300ms ease",
        }}
      >
        {year}
      </span>
      <div>
        <h3 style={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
          {item.url ? (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
              className="ha"
            >
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h3>
        {item.subtitle && (
          <p style={{ color: S.dim, fontSize: "0.9rem", marginTop: "0.15rem" }}>{item.subtitle}</p>
        )}
        {item.summary && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", maxWidth: "56ch" }}>
            {item.summary}
          </p>
        )}
      </div>
    </li>
  );
}

/** Skills, languages, interests: a label and its terms. */
export function KeywordRow({ item }: { item: KeywordItem }) {
  const terms = item.keywords.length > 0 ? item.keywords.join(", ") : (item.detail ?? "");
  // A collapsed bare-name list has no label, so it runs the full width.
  const unlabelled = item.name === "";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: unlabelled ? "minmax(0, 1fr)" : "10rem minmax(0, 1fr)",
        gap: "1.5rem",
        padding: "0.85rem 0",
        borderBottom: `1px solid ${S.hairline}`,
        fontSize: "0.9rem",
      }}
    >
      {!unlabelled && <dt style={{ fontWeight: 600 }}>{item.name}</dt>}
      <dd style={{ color: S.dim, margin: 0 }}>{terms}</dd>
    </div>
  );
}

export function QuoteBlock({ item }: { item: QuoteItem }) {
  return (
    <blockquote style={{ margin: 0 }}>
      <p
        style={{
          fontSize: "clamp(1.15rem, 2.2vw, 1.55rem)",
          lineHeight: 1.4,
          letterSpacing: "-0.01em",
          maxWidth: "30ch",
        }}
      >
        &ldquo;{item.quote}&rdquo;
      </p>
      <cite
        style={{
          display: "block",
          marginTop: "1.4rem",
          fontStyle: "normal",
          fontSize: "0.85rem",
          color: S.dim,
        }}
      >
        {item.attribution}
      </cite>
    </blockquote>
  );
}

/**
 * Dispatches a normalized section to its renderer. Adding a section to the
 * registry needs no change here unless it introduces a new renderer kind.
 */
export function SectionBlock({ section }: { section: NormalizedSection }) {
  const headingId = `sh-${section.key}`;
  const body = (() => {
    switch (section.renderer) {
      case "timeline":
        return (
          <ol style={{ margin: 0, padding: 0 }}>
            {section.items.map((e) => (
              <WorkEntry
                key={e.key}
                position={e.title}
                name={e.org}
                startDate={e.startDate ?? ""}
                endDate={e.endDate}
                summary={e.summary}
                highlights={e.highlights}
                url={e.url}
              />
            ))}
          </ol>
        );
      case "projects":
        return (
          <ul style={{ margin: 0, padding: 0 }}>
            {section.items.map((e) => (
              <ProjectRow key={e.key} name={e.name} summary={e.summary} url={e.url} />
            ))}
          </ul>
        );
      case "keywords":
        return (
          <dl style={{ margin: 0, padding: 0 }}>
            {section.items.map((e) => (
              <KeywordRow key={e.key} item={e} />
            ))}
          </dl>
        );
      case "credentials":
        return (
          <ol style={{ margin: 0, padding: 0 }}>
            {section.items.map((e) => (
              <CredentialRow key={e.key} item={e} />
            ))}
          </ol>
        );
      case "quotes":
        return section.items.map((e) => <QuoteBlock key={e.key} item={e} />);
    }
  })();

  return (
    <section aria-labelledby={headingId} style={{ marginTop: "5.5rem" }}>
      <SectionHead id={headingId}>{section.label}</SectionHead>
      {body}
    </section>
  );
}
