import React from "react";

export const SPECTRUM = {
  bg: "#0E0D0B",
  ink: "#EDEAE3",
  dim: "#8A867C",
  hairline: "rgba(237, 234, 227, 0.12)",
  lift: "rgba(237, 234, 227, 0.045)",
} as const;

export const SPECTRUM_FONT =
  "var(--font-instrument-sans), 'Instrument Sans', system-ui, sans-serif";
export const SPECTRUM_SERIF =
  "var(--font-instrument-serif), 'Instrument Serif', Georgia, serif";

export const SPECTRUM_ACCENTS: Record<string, string> = {
  complete: "#EDEAE3",
  ai: "#9FE7C0",
  frontend: "#F4B860",
  fullstack: "#E8A0BF",
  devops: "#97A8F0",
  gtm: "#F0C797",
  lead: "#C4B5FD",
};

export interface FlavorStatement {
  statement: string;
  sub: string;
}

export const SPECTRUM_STATEMENTS: Record<string, FlavorStatement> = {
  complete: {
    statement:
      "I build <em>agents</em>, <em>interfaces</em>, and <em>hardware</em> — twenty years of shipping the web.",
    sub: "One résumé, rendered per role. Pick a flavor — titles retitle, entries re-rank, and the page re-tints to match.",
  },
  ai: {
    statement:
      "I build <em>autonomous agents</em> and the <em>orchestration</em> that keeps them honest.",
    sub: "Multi-agent systems, RAG pipelines, and MCP tooling in production — from a 12-agent engineering fleet to voice-operated desktops.",
  },
  frontend: {
    statement:
      "I turn polished designs into <em>fast</em>, <em>accessible</em> interfaces people actually use.",
    sub: "Design systems, App Router migrations, and pixel-perfect React — for airlines, fintech dashboards, and a million-visitor marketing site.",
  },
  devops: {
    statement:
      "I keep the <em>pipelines</em> green and the <em>infrastructure</em> boring.",
    sub: "CI/CD, cloud migrations, and on-call ownership — AWS and Azure deployments that ship every day without drama.",
  },
  fullstack: {
    statement:
      "I build the <em>frontend</em>, the <em>backend</em>, and everything in between.",
    sub: "React + Node / Python / PHP end-to-end — API design, database architecture, and deployment for products that scale.",
  },
  gtm: {
    statement:
      "I ship <em>products</em> to <em>market</em> — from landing page to growth loop.",
    sub: "Launch engineering, e-commerce funnels, marketing sites, and AI-powered GTM automation — getting products in front of users.",
  },
  lead: {
    statement:
      "I lead <em>teams</em> that ship <em>great software</em> on time.",
    sub: "Technical architecture, project management, and hiring — building engineering cultures from startup to enterprise.",
  },
};

export function getAccent(flavorId: string): string {
  return SPECTRUM_ACCENTS[flavorId] ?? SPECTRUM_ACCENTS.complete!;
}

export function getStatement(flavorId: string): FlavorStatement {
  return SPECTRUM_STATEMENTS[flavorId] ?? SPECTRUM_STATEMENTS.complete!;
}

export function renderStatement(html: string): React.ReactNode[] {
  return html.split(/(<em>.*?<\/em>)/).map((part, i) => {
    const m = part.match(/^<em>(.*?)<\/em>$/);
    if (m) {
      return (
        <em
          key={i}
          style={{
            fontFamily: SPECTRUM_SERIF,
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
