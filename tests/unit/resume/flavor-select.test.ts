import { describe, expect, it } from "vitest";
import { selectEntries } from "../../../scripts/flavor/steps/select";
import type { GenerateOptions, Match } from "../../../scripts/flavor/types";
import { makeResume } from "./fixtures";

const options = (overrides: Partial<GenerateOptions> = {}): GenerateOptions => ({
  root: process.cwd(),
  model: "test",
  maxWork: 4,
  maxProjects: 2,
  keepRecent: 2,
  maxRewrites: 6,
  dryRun: false,
  register: false,
  force: false,
  yes: false,
  ...overrides,
});

const match = (shared: string[]): Match => ({ shared, missing: [] });

function kept(candidates: { name: string; keep: boolean }[]): string[] {
  return candidates.filter((c) => c.keep).map((c) => c.name);
}

describe("selectEntries — work", () => {
  it("keeps the newest roles whatever they score", () => {
    // Neither of the two newest mentions React; both survive anyway, because a
    // resume that skips the last two years reads as a gap.
    const selection = selectEntries(makeResume(), match(["React"]), options());

    expect(kept(selection.work)).toContain("Newest Co");
    expect(kept(selection.work)).toContain("Second Co");
    expect(selection.work[0]?.reason).toBe("recent");
  });

  it("keeps older roles only when they overlap, best first", () => {
    const selection = selectEntries(makeResume(), match(["React", "TypeScript"]), options());

    // Fourth Co covers both tags, Fifth Co only one, Third and Sixth neither.
    expect(kept(selection.work)).toEqual(["Newest Co", "Second Co", "Fourth Co", "Fifth Co"]);
    expect(selection.work.find((c) => c.name === "Third Co")?.reason).toBe("no overlap");
  });

  it("never keeps more than the budget allows", () => {
    const selection = selectEntries(
      makeResume(),
      match(["React", "TypeScript"]),
      options({ maxWork: 3 })
    );

    expect(kept(selection.work)).toHaveLength(3);
    expect(selection.work.find((c) => c.name === "Fifth Co")?.reason).toBe("past the limit");
  });

  it("gives the same answer twice", () => {
    const args = [makeResume(), match(["React", "Rust"]), options()] as const;
    expect(selectEntries(...args)).toEqual(selectEntries(...args));
  });

  it("reports entries in resume order, not score order", () => {
    const selection = selectEntries(makeResume(), match(["React"]), options());
    expect(selection.work.map((c) => c.index)).toEqual([0, 1, 2, 3, 4, 5]);
  });
});

describe("selectEntries — projects", () => {
  it("ranks by overlap", () => {
    const selection = selectEntries(makeResume(), match(["React"]), options());
    expect(kept(selection.projects)).toEqual(["Alpha"]);
  });

  it("falls back to the resume's own order rather than showing an empty section", () => {
    const selection = selectEntries(makeResume(), match(["Elixir"]), options());

    expect(kept(selection.projects)).toEqual(["Alpha", "Beta"]);
    expect(selection.projects[0]?.reason).toBe("portfolio floor");
  });
});
