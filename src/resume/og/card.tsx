import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type React from "react";
import { resumeConfig } from "../inputs";
import { resumeData } from "../lib/data";
import { findFlavor } from "../lib/flavors";

/**
 * The social card, drawn from the same data the page is.
 *
 * A link preview is the first thing a recruiter sees, usually before the site
 * itself, so it renders the flavor's own statement rather than a generic
 * banner: the accent, the headline, and the serif italics are the ones on the
 * page behind the link. Nothing here is a separate asset to keep in sync — a
 * new flavor gets a card the moment it gets a page.
 */

/** Facebook and LinkedIn both crop anything other than 1.91:1. */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png";

const FONT_DIR = join(process.cwd(), "src/resume/og/fonts");
const SANS = "Instrument Sans";
const SERIF = "Instrument Serif";

/**
 * Static TrueType instances, committed so the build never depends on reaching
 * Google Fonts. Satori reads neither woff2 nor a variable font's fvar table —
 * the variable Instrument Sans crashes its parser outright — so each weight the
 * card uses is its own file.
 */
export async function ogFonts() {
  const [regular, medium, serif] = await Promise.all([
    readFile(join(FONT_DIR, "InstrumentSans-Regular.ttf")),
    readFile(join(FONT_DIR, "InstrumentSans-Medium.ttf")),
    readFile(join(FONT_DIR, "InstrumentSerif-Italic.ttf")),
  ]);

  return [
    { name: SANS, data: regular, weight: 400 as const, style: "normal" as const },
    { name: SANS, data: medium, weight: 500 as const, style: "normal" as const },
    { name: SERIF, data: serif, weight: 400 as const, style: "italic" as const },
  ];
}

interface Segment {
  text: string;
  accented: boolean;
}

/** A whitespace-delimited word, which may be part accented and part not. */
type Word = Segment[];

/**
 * Splits a flavor headline into words, each carrying whichever `<em>` runs it
 * overlaps. The viewer does the same split with React elements; this returns
 * data because satori has no cascade and no custom properties, so every style
 * has to resolve to a literal.
 *
 * Words rather than runs are the unit because satori lays a flex container out
 * from its children and trims the whitespace at each child's edges. Splitting
 * on runs loses the space in front of every italic; splitting on words and
 * spacing them with `gap` restores it, and keeps punctuation attached to the
 * word it follows — "<em>fast</em>," stays one box, so the comma cannot wrap
 * onto a line of its own.
 */
function statementWords(html: string): Word[] {
  const runs: Segment[] = html
    .split(/(<em>.*?<\/em>)/)
    .map((part) => {
      const m = part.match(/^<em>(.*?)<\/em>$/);
      return m ? { text: m[1] ?? "", accented: true } : { text: part, accented: false };
    })
    .filter((run) => run.text.length > 0);

  const words: Word[] = [];
  let current: Word = [];

  for (const run of runs) {
    // The split keeps the delimiters, so a word can straddle two runs; only a
    // space closes one off.
    const pieces = run.text.split(/(\s+)/);
    for (const piece of pieces) {
      if (piece === "") continue;
      if (/^\s+$/.test(piece)) {
        if (current.length > 0) words.push(current);
        current = [];
        continue;
      }
      current.push({ text: piece, accented: run.accented });
    }
  }
  if (current.length > 0) words.push(current);

  return words;
}

/**
 * Headlines step down a size as they get longer rather than overflowing the
 * card, and step up when they are short enough to leave the frame looking
 * empty. The thresholds are where the existing flavor statements change how
 * many lines they take at 1000px wide.
 */
function headlineSize(length: number): number {
  if (length > 92) return 48;
  if (length > 68) return 56;
  if (length > 48) return 64;
  return 72;
}

/** The bases from `basics.location`, rendered the way the rail renders them. */
function locationLine(): string {
  const { location } = resumeData.basics;
  return [location, ...(location.also ?? [])]
    .map((l) => [l.city, l.state].filter(Boolean).join(", "))
    .filter(Boolean)
    .join("  ·  ");
}

export function OgCard({ flavorId }: { flavorId: string }) {
  const flavor = findFlavor(flavorId);
  const { screen } = resumeConfig.theme;
  const headline = flavor.statement.headline || flavor.tagline;
  const size = headlineSize(headline.replace(/<\/?em>/g, "").length);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: screen.bg,
        color: screen.ink,
        fontFamily: SANS,
      }}
    >
      {/* The rule that sits across the top of every page, at share scale. */}
      <div style={{ height: 10, background: flavor.accent }} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "62px 76px 58px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: screen.dim,
            }}
          >
            {flavor.label}
          </div>

          <div style={{ fontSize: 68, fontWeight: 500, letterSpacing: -1.5, marginTop: 22 }}>
            {resumeData.basics.name}
          </div>

          {/* One box per word, spaced by `gap`, wrapping between words. */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              columnGap: size * 0.26,
              rowGap: size * 0.24,
              marginTop: 30,
              fontSize: size,
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: -1,
              maxWidth: 1000,
            }}
          >
            {statementWords(headline).map((word, w) => (
              <div key={`w${w}-${word.map((s) => s.text).join("")}`} style={{ display: "flex" }}>
                {word.map((seg, s) => (
                  <span
                    key={`s${s}-${seg.text}`}
                    style={
                      seg.accented
                        ? { fontFamily: SERIF, fontStyle: "italic", color: flavor.accent }
                        : {}
                    }
                  >
                    {seg.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 26,
            borderTop: `1px solid ${screen.hairline}`,
            fontSize: 24,
            color: screen.dim,
          }}
        >
          <span>{resumeConfig.site.host}</span>
          <span>{locationLine()}</span>
        </div>
      </div>
    </div>
  );
}

/** Everything an `opengraph-image` route needs for one flavor. */
export async function ogImageOptions(): Promise<{
  width: number;
  height: number;
  fonts: Awaited<ReturnType<typeof ogFonts>>;
}> {
  return { ...OG_SIZE, fonts: await ogFonts() };
}

export type OgElement = React.ReactElement;
