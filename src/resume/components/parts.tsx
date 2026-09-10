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
      className="resume-topbar"
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

/**
 * A section's label, and a real `h2`.
 *
 * It reads as a small caption rather than a heading, but it is the only thing
 * standing between the statement and twenty job titles: rendered as a `div`,
 * navigating this page by heading gave a screen reader a flat run of roles with
 * no way to tell where Experience ended and Education began. The size is
 * styling; the level is structure, and they are allowed to disagree.
 */
export function SectionHead({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2
      id={id}
      style={{
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: S.dim,
        fontWeight: 500,
        margin: "0 0 0.5rem",
        paddingBottom: "0.9rem",
        borderBottom: `1px solid ${S.hairline}`,
      }}
    >
      {children}
    </h2>
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
        {renderStatement(statement.headline)}
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
  highlighted,
}: {
  position: string;
  name: string;
  startDate: string;
  endDate?: string;
  summary?: string;
  highlights?: string[];
  url?: string;
  /**
   * The role an inbound `?role=` link points at. Styling lives in RESUME_CSS
   * against the data attribute, which is also how the viewer finds the entry to
   * scroll to and how print drops the marking again.
   */
  highlighted?: boolean;
}) {
  const years = formatYearRange(startDate, endDate);
  return (
    <li
      className="resume-entry"
      data-highlighted={highlighted ? "" : undefined}
      aria-current={highlighted ? "true" : undefined}
      // A scroll moves the page but not a screen reader's position, so the
      // entry is made focusable and the viewer focuses it. Without this the
      // deep link does nothing at all for a reader who is not looking.
      tabIndex={highlighted ? -1 : undefined}
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
        {/*
         * The company sits inside the heading rather than in a paragraph after
         * it. Two roles on this resume are both "Full-Stack Next.js Developer",
         * so a heading list built from the title alone repeats itself and names
         * neither employer. It renders exactly as it did as a sibling.
         */}
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
          {position}
          <span
            style={{
              display: "block",
              color: S.dim,
              fontSize: "0.9rem",
              fontWeight: 400,
              letterSpacing: 0,
              marginTop: "0.15rem",
            }}
          >
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
          </span>
        </h3>
        {summary && (
          <p style={{ marginTop: "0.6rem", fontSize: "0.95rem", maxWidth: "56ch" }}>{summary}</p>
        )}
        {highlights && highlights.length > 0 && (
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.2rem" }}>
            {highlights.slice(0, 3).map((h, i) => (
              <li
                key={`${i}-${h}`}
                style={{ fontSize: "0.85rem", color: S.dim, marginTop: "0.2rem" }}
              >
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

/**
 * A flavor control that is a real link, and says so.
 *
 * Rendering it as an anchor means every variant is crawlable and works with
 * scripting disabled — each flavor has its own title and description via
 * generateMetadata. With JavaScript the click is intercepted so switching stays
 * client-side and instant.
 *
 * It used to carry `role="radio"` inside a radiogroup, which told a screen
 * reader these were options in a form and hid the fact that each one goes
 * somewhere. The radio pattern also brought a roving tabindex with it, so six
 * of the seven flavors were not reachable by Tab at all. They are links to
 * pages; `aria-current` is how a link says it is the one you are on.
 */
export function FlavorButton({
  href,
  label,
  swatch,
  selected,
  onClick,
}: {
  /** Real destination, so the list works as links before any JS runs. */
  href: string;
  label: string;
  swatch: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <a
      href={href}
      aria-current={selected ? "page" : undefined}
      onClick={(e) => {
        // Let modified clicks open a new tab the way any link would.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onClick();
      }}
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
        textDecoration: "none",
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
    </a>
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

/** The text of a keyword row: its terms, or the qualifier if it has none. */
function keywordTerms(item: KeywordItem) {
  return item.keywords.length > 0 ? item.keywords.join(", ") : (item.detail ?? "");
}

/** Skills, languages: a label and its terms. */
export function KeywordRow({ item }: { item: KeywordItem }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "10rem minmax(0, 1fr)",
        gap: "1.5rem",
        padding: "0.85rem 0",
        borderBottom: `1px solid ${S.hairline}`,
        fontSize: "0.9rem",
      }}
    >
      <dt style={{ fontWeight: 600 }}>{item.name}</dt>
      <dd style={{ color: S.dim, margin: 0 }}>{keywordTerms(item)}</dd>
    </div>
  );
}

/**
 * The collapsed bare-name list sections.ts produces for interests: one run of
 * names with nothing defining anything. It rendered as a `dd` with no `dt`,
 * which is not a definition list, so it is prose instead.
 */
export function KeywordRun({ item }: { item: KeywordItem }) {
  return (
    <p
      style={{
        margin: 0,
        padding: "0.85rem 0",
        borderBottom: `1px solid ${S.hairline}`,
        fontSize: "0.9rem",
        color: S.dim,
      }}
    >
      {keywordTerms(item)}
    </p>
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
export function SectionBlock({
  section,
  highlightedOrg,
}: {
  section: NormalizedSection;
  /** Resolved company name, matched by equality so the lookup happens once. */
  highlightedOrg?: string;
}) {
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
                highlighted={!!highlightedOrg && e.org === highlightedOrg}
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
      case "keywords": {
        // sections.ts collapses a collection of bare names into a single
        // unlabelled item; that is prose, not a term and its definition.
        const only = section.items.length === 1 ? section.items[0] : undefined;
        if (only && only.name === "") return <KeywordRun item={only} />;
        return (
          <dl style={{ margin: 0, padding: 0 }}>
            {section.items.map((e) => (
              <KeywordRow key={e.key} item={e} />
            ))}
          </dl>
        );
      }
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
