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
  /* Buttons share the class but not the underline: there is nothing to
     underline on a control that is not a link. */
  .resume-frame button.ha:hover:not(:disabled) { color: var(--accent) !important; }
  .resume-frame .project-link:hover { background: ${S.lift} !important; }
  .resume-frame .project-link:hover .project-arrow { transform: translateX(3px); }

  /*
   * A designed focus ring. Most controls here are borderless text on a dark
   * ground, and the browser default lands a thin dark outline on top of that,
   * so the ring is drawn in the flavor's accent with an offset gap instead.
   * :focus-visible, so a mouse click does not leave a ring behind.
   */
  .resume-frame a:focus-visible,
  .resume-frame button:focus-visible,
  .resume-frame input:focus-visible,
  .resume-frame [tabindex]:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
    border-radius: 2px;
  }

  /*
   * Ten tab stops sat between the top of the page and the first line of the
   * resume: four contacts, the flavor list, and the export controls. The link
   * is off-screen until focused, which is the first Tab on the page.
   */
  .resume-skip {
    position: absolute;
    left: -9999px;
    top: 0;
    z-index: 60;
    padding: 0.7rem 1rem;
    background: ${S.bg};
    color: ${S.ink};
    border: 1px solid var(--accent);
    border-radius: 3px;
    font-size: 0.85rem;
    text-decoration: none;
  }
  .resume-skip:focus { left: 1rem; top: 1rem; }

  /* The filled PDF control. A wash of the accent rather than a fill, so it
     does not outshout the resume it is a button for. */
  .resume-frame .resume-dl-primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent) 14%, transparent);
  }
  /* Every download disables the whole bar while it runs, so the two states
     have to look different: the one being generated keeps its colour and the
     others go quiet. */
  .resume-frame .resume-actionbar button:disabled { cursor: default; opacity: 0.4; }
  .resume-frame .resume-actionbar button[aria-busy="true"] { cursor: progress; opacity: 1; }

  /*
   * The role an inbound ?role= link points at: an accent edge and a wash of the
   * same colour, so the marking belongs to whichever flavor is on screen rather
   * than introducing a colour of its own.
   *
   * The entry holds its place in the grid because the padding that makes room
   * for the edge is cancelled by an equal negative margin, so the resume reads
   * identically with and without a highlight and only the marked entry moves.
   */
  .resume-frame .resume-entry[data-highlighted] {
    background: color-mix(in srgb, var(--accent) 8%, transparent);
    box-shadow: inset 3px 0 0 var(--accent);
    border-radius: 4px;
    padding-left: 1.1rem;
    margin-left: -1.1rem;
    padding-right: 0.85rem;
    margin-right: -0.85rem;
  }

  /* Focused only by script, to carry the scroll across to a screen reader, and
     never reachable by tab. The accent edge is already the visible marker, and
     a browser focus ring on top of it draws a second box saying the same thing. */
  .resume-frame .resume-entry[data-highlighted]:focus { outline: none; }

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
  .resume-actionbar { view-transition-name: resume-actionbar; }

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
  ::view-transition-group(resume-rail), ::view-transition-group(resume-topbar),
  ::view-transition-group(resume-actionbar) { animation-duration: 240ms; }

  @keyframes resume-leave { to { opacity: 0; transform: translateY(-8px); } }
  @keyframes resume-enter { from { opacity: 0; transform: translateY(14px); } }

  /* Colour transitions are still in flight when the incoming state is
     captured, so the new snapshot would otherwise show the outgoing accent. */
  [data-flavor-changing] .resume-frame, [data-flavor-changing] .resume-frame *,
  [data-flavor-changing] .resume-topbar { transition: none !important; }

  /*
   * The rail scrolls but draws no scrollbar. Any author scrollbar styling, even
   * scrollbar-width: thin, opts an element out of the platform's overlay
   * scrollbars and back into a classic bar that is always on screen, and this
   * one landed in the gutter between the rail and the resume where it read as a
   * divider the design never drew. Hidden instead: the wheel, the trackpad, and
   * focusing a control inside still scroll it.
   */
  .resume-rail { scrollbar-width: none; }
  .resume-rail::-webkit-scrollbar { display: none; }

  /*
   * The two rows built on a fixed 10rem label column. There is no width at
   * which 10rem plus a 1.5rem gap plus readable text fits a phone, and the
   * project row also carries an arrow in a third column: at 320px its middle
   * column was squeezed to 32px wanting 70, which is where the page's
   * sideways scroll came from. Stacked, the label is a line of its own.
   */
  @media (max-width: 640px) {
    .resume-frame .resume-project { grid-template-columns: 1fr !important; gap: 0.3rem !important; }
    /* The arrow pointed across a gap that no longer exists. */
    .resume-frame .project-arrow { display: none !important; }
    .resume-frame .resume-kv { grid-template-columns: 1fr !important; gap: 0.2rem !important; }
  }

  /*
   * Anything driven by a finger rather than a pointer. The download bar's
   * controls were 19px tall and the contact links 21px, well under the 44px
   * a fingertip needs, and they sit next to each other. Scoped to coarse
   * pointers so the drawn design is untouched wherever there is a cursor.
   */
  @media (pointer: coarse) {
    .resume-frame .resume-actionbar button,
    .resume-frame .resume-rail nav a,
    .resume-frame .resume-flavors a,
    .resume-frame .resume-desk button {
      min-height: 44px;
      display: inline-flex;
      align-items: center;
      /* Flex drops the whitespace between the glyph span and the label, so
         "down-arrow PDF" came out as one run. The flavor links set their own
         gap inline, which still wins here. */
      gap: 0.3rem;
    }
  }

  @media (max-width: 860px) {
    /* Matches the download bar's own side padding, so its first control sits
       directly above the name instead of 12px inside it. 2rem was also an
       eighth of the screen at 320px. */
    .resume-grid { grid-template-columns: 1fr !important; gap: 0 !important; padding: 0 1.25rem !important; }
    /* 5vw never reaches the 2.5rem floor on a phone, so the headline sat at
       40px in a 256px column: seven lines and 269px of it before a word of
       the resume. This band gets its own ramp. */
    .resume-statement { font-size: clamp(1.9rem, 7.5vw, 3rem) !important; }
    /* Four controls still fit on one line at 360px once the gaps close up,
       and they have to: a bar that wraps changes height, and the clearance
       the rail leaves for it is a fixed number. */
    .resume-actionbar > div { padding: 0.55rem 1.25rem !important; gap: 0.85rem !important; }
    /* Stacked above the resume rather than sticky beside it, so it has no
       reason to keep the desktop rail's own scroll box: nested scrolling on a
       touch screen is awkward. It grows to fit and the page scrolls. */
    .resume-rail { position: static !important; height: auto !important; max-height: none !important; overflow: visible !important; }
    .resume-desk { margin-top: 1.75rem !important; padding-top: 0 !important; }
    .resume-desk .resume-flavors { flex-direction: row !important; flex-wrap: wrap !important; gap: 0.25rem 0.5rem !important; }
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
    .resume-topbar, .resume-desk, .resume-actionbar { display: none !important; }

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
    .resume-frame h2:not([id^="sh-"]) { font-size: 17pt !important; }
    .resume-frame h2 em, .resume-entry > span:first-child { color: ${PRINT.accent} !important; }
    .resume-frame section > h2[id^="sh-"] { color: ${PRINT.heading} !important; }
    .resume-frame footer { color: ${PRINT.footer} !important; }
    .resume-frame a { text-decoration: none !important; }

    /* The rail is a sticky, scrolling, fixed-height column on screen; on paper
       it is just the masthead above the resume. */
    .resume-grid { display: block !important; max-width: none !important; padding: 0 !important; gap: 0 !important; }
    .resume-rail { position: static !important; max-height: none !important; overflow: visible !important; margin: 0 !important; padding: 0 !important; }
    .resume-main { padding: 0.75rem 0 0 !important; max-width: none !important; }

    .resume-frame section { margin-top: 1.5rem !important; }
    .resume-entry { break-inside: avoid; page-break-inside: avoid; padding: 0.6rem 0 !important; }

    /* A highlight answers "which role did that link mean", which is a question
       nobody holding the paper has asked. */
    .resume-entry[data-highlighted] { background: none !important; box-shadow: none !important; margin: 0 !important; }
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
   * Company whose role an inbound `?role=` link points at, already resolved
   * against what this flavor shows. Undefined is the ordinary resume.
   */
  highlightedOrg?: string;
  /**
   * Rail controls. Flavors render as real links so they stay reachable and
   * crawlable before any JavaScript runs; the viewer intercepts the clicks.
   */
  desk: React.ReactNode;
  /**
   * The download bar, fixed to the top of the viewport. Rendered after the
   * skip link so the first Tab still escapes to the resume, and inside the
   * frame so it reads `--accent`.
   */
  actions: React.ReactNode;
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
  highlightedOrg,
  desk,
  actions,
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
        <a className="resume-skip" href="#resume-main">
          Skip to resume
        </a>

        {actions}

        <div
          className="resume-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "clamp(220px, 24vw, 300px) minmax(0, 1fr)",
            maxWidth: 1200,
            margin: "0 auto",
            padding: "0 2rem",
            gap: "clamp(2rem, 4vw, 4rem)",
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
              display: "flex",
              flexDirection: "column",
              padding: "5.5rem 0 2.5rem 0",
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

          {/* tabIndex so the skip link actually moves focus and not just the
              viewport; -1 keeps it out of the tab order itself. */}
          <main
            id="resume-main"
            tabIndex={-1}
            className="resume-main"
            style={{ padding: "6rem 0 4rem", maxWidth: 720, outline: "none" }}
          >
            <StatementBlock statement={statement} />

            {sections.map((section) => (
              <SectionBlock key={section.key} section={section} highlightedOrg={highlightedOrg} />
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
