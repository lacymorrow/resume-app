"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ExportFormat } from "../lib/export";
import { SCREEN } from "../lib/theme";
import { actionStyle } from "./parts";

const S = SCREEN;

/**
 * `name` rather than the label alone: "PDF" on its own is what the button
 * says, not what it does, and a screen reader reading the bar in isolation
 * gets four nouns with no verb.
 */
const DOWNLOADS: { format: ExportFormat; label: string; name: string }[] = [
  { format: "pdf", label: "PDF", name: "Download as PDF" },
  { format: "docx", label: "DOCX", name: "Download as Word document" },
  { format: "html", label: "HTML", name: "Download as HTML" },
];

/** How long a finished message stays up before the bar goes quiet again. */
const STATUS_LINGER = 4000;

/**
 * Only PDF is filled in. It is what a person reading a resume wants; DOCX is
 * what an applicant tracking system wants, and it is the reason the format
 * exists here at all. HTML and Print are for the few who ask.
 */
const primaryStyle: React.CSSProperties = {
  ...actionStyle,
  color: "var(--accent)",
  border: "1px solid var(--accent)",
  borderRadius: 3,
  padding: "0.4rem 0.75rem",
  transition: "background 200ms ease, color 200ms ease, border-color 200ms ease",
};

/**
 * The downloads, fixed to the top of the viewport.
 *
 * They used to sit at the bottom of the rail, below the flavor list and the
 * builder, which put the one thing most readers came for under the fold of a
 * column that scrolls on its own. Fixed here they are the first thing on the
 * page after the skip link, in the tab order as well as on screen.
 *
 * The bar draws no accent edge of its own: `TopRule` is a separate fixed
 * element at a higher z-index, so it lands across the bar's top 2px and reads
 * as its border without either one having to know about the other.
 */
export function ResumeActionBar({
  onExport,
}: {
  /** Rejects if the export fails, so the bar can say so. */
  onExport: (format: ExportFormat) => Promise<void>;
}) {
  // The PDF path imports jsPDF on first click and then lays out every page by
  // hand, so the first press is a chunk fetch plus real work. Without this the
  // button reads as one that did nothing.
  const [pending, setPending] = useState<ExportFormat | null>(null);
  const [status, setStatus] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const run = useCallback(
    async (format: ExportFormat, label: string) => {
      if (timer.current) clearTimeout(timer.current);
      setPending(format);
      setStatus(`Preparing ${label}`);
      try {
        await onExport(format);
        setStatus(`${label} downloaded`);
      } catch {
        // There is nothing for the reader to fix and nothing to retry on their
        // behalf, so say the one true thing and leave the button pressable.
        setStatus(`${label} could not be generated`);
      } finally {
        setPending(null);
        timer.current = setTimeout(() => setStatus(""), STATUS_LINGER);
      }
    },
    [onExport]
  );

  return (
    <div
      className="resume-actionbar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 45,
        // The resume scrolls underneath, so the bar paints the page ground back
        // in behind itself. The blur is the part that makes the text passing
        // under it read as behind rather than through.
        background: `color-mix(in srgb, ${S.bg} 90%, transparent)`,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${S.hairline}`,
      }}
    >
      <div
        // Same max width and side padding as .resume-grid, so the first button
        // sits directly above the name in the rail.
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0.6rem 2rem",
          display: "flex",
          alignItems: "center",
          gap: "1.25rem",
        }}
      >
        {DOWNLOADS.map(({ format, label, name }, i) => (
          <button
            key={format}
            type="button"
            onClick={() => void run(format, label)}
            disabled={pending !== null}
            aria-busy={pending === format}
            aria-label={name}
            style={i === 0 ? primaryStyle : actionStyle}
            className={i === 0 ? "resume-dl-primary ha" : "ha"}
          >
            <span aria-hidden="true">↓ </span>
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => window.print()}
          aria-label="Print this resume"
          style={actionStyle}
          className="ha"
        >
          <span aria-hidden="true">⎙ </span>Print
        </button>
        {/* Visible and announced: a download that quietly failed is the worst
            version of this bar. Empty between presses, so the bar is four
            controls at rest. */}
        <output
          style={{
            color: S.dim,
            fontSize: "0.72rem",
            letterSpacing: "0.04em",
            // Off the end of the controls rather than in the row with them:
            // sentence case already separates it, but at a glance a fifth item
            // at the same spacing reads as a fifth button.
            marginLeft: "0.5rem",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {status}
        </output>
      </div>
    </div>
  );
}
