import { resumeConfig } from "../inputs";
import { resumeData } from "../lib/data";

/**
 * The favicon and app icon: initials on the resume's own ground.
 *
 * Same source as everything else — the name comes from resume.json and the
 * colours from resume.config.ts — so a fork inherits its own mark without
 * opening an image editor.
 *
 * Deliberately monochrome. Accent belongs to a flavor, and the icon stands for
 * all seven; a colour picked from one of them would read as arbitrary
 * everywhere else. Rendered at each size rather than scaled from one master,
 * because letters set for a 512px tile are illegible at 16px.
 */

/** First letter of the first and last word of the name, e.g. "Lacy Morrow" -> "LM". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const first = words[0]?.[0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}

export function BrandMark({ size }: { size: number }) {
  const { screen } = resumeConfig.theme;
  const letters = initials(resumeData.basics.name);

  // Two letters need to sit proportionally larger in a 16px box than in a
  // 512px one to survive, so the ratio opens up as the box shrinks. The floor
  // leaves enough margin that a maskable launcher crop cannot clip them.
  const scale = size <= 48 ? 0.56 : size <= 192 ? 0.5 : 0.46;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: screen.bg,
        color: screen.ink,
        fontFamily: "Instrument Sans",
        fontWeight: 500,
        fontSize: Math.round(size * scale),
        lineHeight: 1,
        letterSpacing: -size * 0.015,
        // Capitals occupy the top of their line box, so centring the box
        // leaves them sitting high in the tile. This drops them onto the
        // optical centre.
        paddingTop: Math.round(size * 0.05),
      }}
    >
      {letters}
    </div>
  );
}
