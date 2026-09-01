import type React from "react";
import { type ContactRow, PRINT } from "../lib/export-shared";
import type { NormalizedSection } from "../lib/sections";
import { type FlavorStatement, SCREEN } from "../lib/theme";
import { SectionBlock, SF, StatementBlock, TopRule } from "./parts";

const S = SCREEN;

/**
 * Hover, responsive, and print rules that inline styles cannot express.
 * Rendered once by the frame, so every page that shows a resume gets them.
 */
export const RESUME_CSS = `
  .resume-frame a.ha:hover { color: var(--accent) !important; text-decoration: underline; text-underline-offset: 3px; }
  .resume-frame .project-link:hover { background: ${S.lift} !important; }
  .resume-frame .project-link:hover .project-arrow { transform: translateX(3px); }
  @media (prefers-reduced-motion: reduce) {
    .resume-frame *, .resume-frame *::before, .resume-frame *::after { transition: none !important; }
    ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }
  }

  /*
   * Switching flavors is a page change: a different headline, a different set
   * of roles, a different accent. The browser cross-fades the two states so the
   * resume reads as being re-cut rather than reloaded. See lib/transitions.ts
   * for the navigation side of it.
   *
   * The rail and the accent rule are named out of the page snapshot so they
   * hold still. The name, the contacts, and the flavor list are identical
   * either side of the switch, and drifting them would pull the eye away from
   * the part that actually changed.
   */
  .resume-rail { view-transition-name: resume-rail; }
  .resume-topbar { view-transition-name: resume-topbar; }

  /* The default cross-fade blends the two snapshots additively, which only
     looks right while neither of them moves. Both leave before the incoming
     one arrives, so the two states barely overlap and nothing ghosts. */
  ::view-transition-image-pair(root) { isolation: auto; }
  ::view-transition-old(root), ::view-transition-new(root) { mix-blend-mode: normal; }
  ::view-transition-old(root) { animation: resume-leave 150ms ease-in both; }
  ::view-transition-new(root) { animation: resume-enter 280ms 90ms cubic-bezier(0.22, 0.68, 0.24, 1) both; }

  /* The rail keeps the default cross-fade: it holds its place and its contents
     barely change, so sequencing it the way the body is sequenced only opens a
     gap where the name and the contacts dip out to nothing. */
  ::view-transition-group(resume-rail), ::view-transition-group(resume-topbar) { animation-duration: 240ms; }

  @keyframes resume-leave { to { opacity: 0; transform: translateY(-8px); } }
  @keyframes resume-enter { from { opacity: 0; transform: translateY(14px); } }

  /* Colour transitions are still in flight when the incoming state is
     captured, so the new snapshot would otherwise show the outgoing accent. */
  [data-flavor-changing] .resume-frame, [data-flavor-changing] .resume-frame *,
  [data-flavor-changing] .resume-topbar { transition: none !important; }

  @media (max-width: 860px) {
    .resume-grid { grid-template-columns: 1fr !important; gap: 0 !important; }
    .resume-rail { position: static !important; height: auto !important; margin-right: 0 !important; padding-right: 0 !important; }
    .resume-desk { margin-top: 1.75rem !important; padding-top: 0 !important; }
    .resume-desk [role="radiogroup"] { flex-direction: row !important; flex-wrap: wrap !important; gap: 0.25rem 0.5rem !important; }
    .resume-desk button, .resume-desk a { margin-left: 0 !important; }
    .resume-main { padding-top: 3rem !important; }
    .resume-entry { grid-template-columns: 1fr !important; gap: 0.25rem !important; }
  }

  /*
   * Printing the page from the browser, as opposed to exporting a PDF.
   *
   * The screen design is near-white on near-black, which prints as an unreadable
   * black page, so print re-colours the frame with the print palette from
   * resume.config.ts — the same values the PDF and DOCX exporters use.
   *
   * Colours are set on the frame's own elements rather than on body, because the
   * screen theme is applied as inline styles: only an !important author rule
   * outranks those. The universal selector sets the floor and the rules under
   * it are more specific, so headings, dates, and section labels keep theirs.
   */
  @media print {
    @page { size: letter; margin: 0.5in; }

    body { background: #fff !important; }

    /* Chrome, not content: a fixed rule repeats on every sheet, and the
       flavor switcher and export buttons do nothing on paper. */
    .resume-topbar, .resume-desk { display: none !important; }

    .resume-frame {
      --accent: ${PRINT.accent};
      background: #fff !important;
      font-family: ${PRINT.fontStack} !important;
      font-size: 10pt !important;
      min-height: 0 !important;
    }

    /* Colour transitions are mid-flight when the print snapshot is taken, so a
       date can land halfway between its screen and print colour. */
    .resume-frame *, .resume-frame *::before, .resume-frame *::after { transition: none !important; }

    .resume-frame *, .resume-frame { color: ${PRINT.body} !important; border-color: ${PRINT.rail} !important; }
    .resume-frame h1, .resume-frame h2, .resume-frame h3, .resume-frame dt { color: ${PRINT.ink} !important; }
    .resume-frame h2 { font-size: 17pt !important; }
    .resume-frame h2 em, .resume-entry > span:first-child { color: ${PRINT.accent} !important; }
    .resume-frame section > div[id^="sh-"] { color: ${PRINT.heading} !important; }
    .resume-frame footer { color: ${PRINT.footer} !important; }
    .resume-frame a { text-decoration: none !important; }

    /* The rail is a sticky, scrolling, fixed-height column on screen; on paper
       it is just the masthead above the resume. */
    .resume-grid { display: block !important; max-width: none !important; padding: 0 !important; gap: 0 !important; }
    .resume-rail { position: static !important; max-height: none !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
    .resume-main { padding: 0.75rem 0 0 !important; max-width: none !important; }

    .resume-frame section { margin-top: 1.5rem !important; }
    .resume-entry { break-inside: avoid; page-break-inside: avoid; padding: 0.6rem 0 !important; }
  }
`;

export interface ResumeFrameProps {
  accent: string;
  name: string;
  tagline: string;
  location?: string;
  contacts: ContactRow[];
  statement: FlavorStatement;
  sections: NormalizedSection[];
  /**
   * Rail controls. Flavors render as real links so they stay reachable and
   * crawlable before any JavaScript runs; the viewer intercepts the clicks.
   */
  desk: React.ReactNode;
  footerNote: string;
  footerLinkLabel: string;
  footerLinkHref: string;
}

/**
 * The single on-screen resume layout. The prerendered HTML and the hydrated
 * viewer render through here, so there is nothing to drift and no design swap
 * at hydration.
 */
export function ResumeFrame({
  accent,
  name,
  tagline,
  location,
  contacts,
  statement,
  sections,
  desk,
  footerNote,
  footerLinkLabel,
  footerLinkHref,
}: ResumeFrameProps) {
  return (
    <>
      <style>{RESUME_CSS}</style>
      <TopRule accent={accent} />

      <div
        className="resume-frame"
        style={
          {
            "--accent": accent,
            background: S.bg,
            color: S.ink,
            fontFamily: SF,
            fontSize: 16,
            lineHeight: 1.55,
            WebkitFontSmoothing: "antialiased",
            minHeight: "100dvh",
            transition: "color 300ms ease",
          } as React.CSSProperties
        }
      >
        <div
          className="resume-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr)",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 2rem",
            gap: "4rem",
          }}
        >
          <header
            className="resume-rail"
            style={{
              position: "sticky",
              top: 0,
              alignSelf: "start",
              maxHeight: "100dvh",
              // The rail is a fixed-height sticky box, so anything past the
              // fold used to be unreachable — it could not scroll and the page
              // behind it does not move it. The builder panel makes that much
              // easier to hit.
              overflowY: "auto",
              scrollbarWidth: "thin",
              // The scrollbar is drawn over the rail rather than beside it on
              // any platform with overlay scrollbars, and it lands on the
              // panel's right-hand controls. Hanging the scroll edge out into
              // the column gap gives the bar a strip of its own without
              // narrowing anything.
              marginRight: "-14px",
              display: "flex",
              flexDirection: "column",
              padding: "3.5rem 14px 2.5rem 0",
            }}
          >
            <h1 style={{ fontSize: "1.35rem", fontWeight: 600, letterSpacing: "-0.01em" }}>
              {name}
            </h1>
            <p style={{ color: S.dim, fontSize: "0.9rem", marginTop: "0.35rem", maxWidth: "24ch" }}>
              {tagline}
              {location ? `. ${location}.` : ""}
            </p>

            <nav
              aria-label="Contact"
              style={{
                marginTop: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              {contacts.map((row) =>
                row.href ? (
                  <a
                    key={row.text}
                    href={row.href}
                    style={{
                      color: S.dim,
                      fontSize: "0.85rem",
                      textDecoration: "none",
                      transition: "color 300ms ease",
                    }}
                    className="ha"
                  >
                    {row.text}
                  </a>
                ) : (
                  <span key={row.text} style={{ color: S.dim, fontSize: "0.85rem" }}>
                    {row.text}
                  </span>
                )
              )}
            </nav>

            <div className="resume-desk" style={{ marginTop: "auto", paddingTop: "2.5rem" }}>
              {desk}
            </div>
          </header>

          <main className="resume-main" style={{ padding: "6rem 0 4rem", maxWidth: 720 }}>
            <StatementBlock statement={statement} />

            {sections.map((section) => (
              <SectionBlock key={section.key} section={section} />
            ))}

            <footer
              style={{
                marginTop: "6rem",
                paddingTop: "2rem",
                borderTop: `1px solid ${S.hairline}`,
                display: "flex",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
                fontSize: "0.8rem",
                color: S.dim,
              }}
            >
              <span>{footerNote}</span>
              <a
                href={footerLinkHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: S.dim, textDecoration: "none", transition: "color 300ms ease" }}
                className="ha"
              >
                {footerLinkLabel}
              </a>
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}

/** Shared label above the flavor controls in both desks. */
export function DeskLabel({ id }: { id: string }) {
  return (
    <p
      id={id}
      style={{
        fontSize: "0.7rem",
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        color: S.dim,
        marginBottom: "0.9rem",
      }}
    >
      Render as
    </p>
  );
}
