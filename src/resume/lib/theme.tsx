import type React from "react";
import { resumeConfig } from "../inputs";
import { type FlavorStatement, findFlavor } from "./flavors";

/**
 * On-screen theme tokens. Values live in resume.config.ts; this re-exports them
 * under short names because renderers reference them on nearly every element.
 */
export const SCREEN = resumeConfig.theme.screen;
export const THEME_SANS = SCREEN.fontSans;
export const THEME_SERIF = SCREEN.fontSerif;

export type { FlavorStatement };

/**
 * Accent and hero copy now live in the flavor's own JSON file, so a flavor is
 * one file rather than an entry in three. These read through to it.
 */
export function getAccent(flavorId: string): string {
  return findFlavor(flavorId).accent;
}

export function getStatement(flavorId: string): FlavorStatement {
  return findFlavor(flavorId).statement;
}

/** Renders `<em>` runs in a statement as accented serif italics. */
export function renderStatement(html: string): React.ReactNode[] {
  return html.split(/(<em>.*?<\/em>)/).map((part, i) => {
    const m = part.match(/^<em>(.*?)<\/em>$/);
    if (m) {
      return (
        <em
          key={`em-${i}`}
          style={{
            fontFamily: THEME_SERIF,
            fontStyle: "italic",
            fontWeight: 400,
            color: "var(--accent)",
            letterSpacing: 0,
            transition: "color 300ms ease",
          }}
        >
          {m[1]}
        </em>
      );
    }
    return <span key={`text-${i}`}>{part}</span>;
  });
}
