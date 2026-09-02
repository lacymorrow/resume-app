import { describe, expect, it } from "vitest";
import { selectEntries } from "../../../scripts/flavor/steps/select";
import { verifyProse } from "../../../scripts/flavor/steps/verify";
import type { GenerateOptions, Match, Prose, Selection } from "../../../scripts/flavor/types";
import { makeResume, work } from "./fixtures";

const data = makeResume({
  work: [
    work(
      "Newest Co",
      "Led a team of 4 building a checkout flow with React and TypeScript. React, TypeScript"
    ),
  ],
});

const selection: Selection = selectEntries(
  data,
  { shared: ["React"], missing: [] } as Match,
  {
    root: process.cwd(),
    model: "test",
    maxWork: 4,
    maxProjects: 2,
    keepRecent: 1,
    maxRewrites: 6,
    dryRun: false,
    register: false,
    force: false,
    yes: false,
  } as GenerateOptions
);

function prose(overrides: Partial<Prose> = {}): Prose {
  return {
    label: "Frontend Engineer",
    description: "React, TypeScript",
    tagline: "Frontend engineer + product developer",
    expertise: "React; TypeScript",
    accent: "#9FE7C0",
    statement: { headline: "Builds <em>interfaces</em>.", sub: "React and TypeScript." },
    work: {},
    gaps: [],
    ...overrides,
  };
}

const errors = (issues: { level: string }[]) => issues.filter((i) => i.level === "error");

describe("verifyProse", () => {
  it("passes a rewrite that only re-angles what the entry already says", () => {
    const issues = verifyProse(
      prose({
        work: {
          "Newest Co": { summary: "Built a checkout flow in React. React, TypeScript" },
        },
      }),
      data,
      selection
    );

    expect(issues).toEqual([]);
  });

  it("catches a number the entry never claimed", () => {
    const issues = verifyProse(
      prose({ work: { "Newest Co": { summary: "Led a team of 40. React, TypeScript" } } }),
      data,
      selection
    );

    expect(errors(issues)).toHaveLength(1);
    expect(errors(issues)[0]?.message).toContain("40");
  });

  it("catches a technology the entry never mentioned", () => {
    const issues = verifyProse(
      prose({
        work: { "Newest Co": { summary: "Built it in React and Rust. React, TypeScript, Rust" } },
      }),
      data,
      selection
    );

    expect(errors(issues)).toHaveLength(1);
    expect(errors(issues)[0]?.message).toContain("Rust");
  });

  it("catches a retitle that inflates the role", () => {
    const issues = verifyProse(
      prose({ work: { "Newest Co": { position: "Director of 12 Engineers" } } }),
      data,
      selection
    );

    expect(errors(issues)[0]?.path).toBe('work["Newest Co"].position');
  });

  it("catches a key that does not name a visible entry, which would silently no-op", () => {
    const issues = verifyProse(
      prose({ work: { "Newest Co.": { summary: "Anything." } } }),
      data,
      selection
    );

    expect(errors(issues)).toHaveLength(1);
    expect(errors(issues)[0]?.message).toContain("silently ignored");
  });

  it("warns, rather than fails, on an off-palette accent", () => {
    const issues = verifyProse(prose({ accent: "#123456" }), data, selection);

    expect(errors(issues)).toEqual([]);
    expect(issues.map((i) => i.path)).toContain("accent");
  });

  it("warns when prose runs past what the layout is built for", () => {
    const issues = verifyProse(prose({ tagline: "x".repeat(200) }), data, selection);

    expect(issues.map((i) => i.path)).toContain("tagline");
  });
});
