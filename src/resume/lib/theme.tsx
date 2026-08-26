import type React from "react";
import { resumeConfig } from "../config";

/**
 * On-screen theme tokens. Values live in resume.config.ts; this re-exports them
 * under short names because renderers reference them on nearly every element.
 */
export const SCREEN = resumeConfig.theme.screen;
export const THEME_SANS = SCREEN.fontSans;
export const THEME_SERIF = SCREEN.fontSerif;

export interface FlavorStatement {
  statement: string;
  sub: string;
}

/**
 * Per-flavor accent and hero copy.
 *
 * These are keyed by flavor id and read with a fallback to `complete`, so a
 * flavor added without a matching entry here renders with the default accent
 * and generic copy rather than failing loudly. Keeping them beside the flavor
 * definitions is tracked separately.
 */
export const FLAVOR_ACCENTS: Record<string, string> = {
  complete: "#EDEAE3",
  ai: "#9FE7C0",
  frontend: "#F4B860",
  fullstack: "#E8A0BF",
  devops: "#97A8F0",
  gtm: "#F0C797",
  lead: "#C4B5FD",
};

export const FLAVOR_STATEMENTS: Record<string, FlavorStatement> = {
  complete: {
    statement:
      "I build <em>agents</em>, <em>interfaces</em>, and <em>hardware</em>. Twenty years of shipping the web.",
    sub: "Full-stack engineering, AI agents, design systems, and infrastructure. Twenty years across startups, agencies, and enterprise teams.",
  },
  ai: {
    statement:
      "I build <em>autonomous agents</em> and the <em>orchestration</em> that keeps them honest.",
    sub: "Multi-agent systems, RAG pipelines, and MCP tooling in production. Twelve engineering agents at BizJournals; a voice-operated desktop with Juno.",
  },
  frontend: {
    statement:
      "I turn polished designs into <em>fast</em>, <em>accessible</em> interfaces people actually use.",
    sub: "Design systems, App Router migrations, and pixel-perfect React for airlines, fintech dashboards, and a million-visitor marketing site.",
  },
  devops: {
    statement: "I keep the <em>pipelines</em> green and the <em>infrastructure</em> boring.",
    sub: "CI/CD, cloud migrations, and on-call ownership. AWS and Azure deployments that ship every day without drama.",
  },
  fullstack: {
    statement: "I build the <em>frontend</em>, the <em>backend</em>, and everything in between.",
    sub: "React plus Node, Python, and PHP end-to-end. API design, database architecture, and deployment for products that scale.",
  },
  gtm: {
    statement: "I ship <em>products</em> to <em>market</em>, from landing page to growth loop.",
    sub: "Launch engineering, e-commerce funnels, marketing sites, and AI-powered GTM automation. Getting products in front of users.",
  },
  lead: {
    statement: "I lead <em>teams</em> that ship <em>great software</em> on time.",
    sub: "Technical architecture, project management, and hiring. Building engineering cultures from startup to enterprise.",
  },
};

export function getAccent(flavorId: string): string {
  return FLAVOR_ACCENTS[flavorId] ?? FLAVOR_ACCENTS.complete!;
}

export function getStatement(flavorId: string): FlavorStatement {
  return FLAVOR_STATEMENTS[flavorId] ?? FLAVOR_STATEMENTS.complete!;
}

/** Renders `<em>` runs in a statement as accented serif italics. */
export function renderStatement(html: string): React.ReactNode[] {
  return html.split(/(<em>.*?<\/em>)/).map((part, i) => {
    const m = part.match(/^<em>(.*?)<\/em>$/);
    if (m) {
      return (
        <em
          key={i}
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
    return <span key={i}>{part}</span>;
  });
}
