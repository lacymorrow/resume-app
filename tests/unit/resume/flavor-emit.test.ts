import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildFlavorFile, registerFlavor } from "../../../scripts/flavor/steps/emit";
import type { Candidate, Prose, Selection } from "../../../scripts/flavor/types";

function candidate(name: string, keep: boolean, index: number): Candidate {
  return {
    name,
    index,
    tags: [],
    score: keep ? 1 : 0,
    keep,
    reason: keep ? "recent" : "no overlap",
  };
}

const selection: Selection = {
  work: [candidate("Kept Co", true, 0), candidate("Dropped Co", false, 1)],
  projects: [candidate("Alpha", true, 0), candidate("Beta", false, 1)],
};

const prose: Prose = {
  label: "Frontend Engineer",
  description: "React",
  tagline: "Frontend engineer",
  expertise: "React",
  accent: "#9FE7C0",
  statement: { headline: "h", sub: "s" },
  work: { "Kept Co": { summary: "rewritten" } },
  gaps: ["Kubernetes"],
};

describe("buildFlavorFile", () => {
  it("names only what the flavor changes", () => {
    const file = buildFlavorFile("acme", prose, selection);

    expect(file.work).toEqual({
      "Dropped Co": { visible: false },
      "Kept Co": { summary: "rewritten" },
    });
    expect(file.projects).toEqual({ Beta: { visible: false } });
  });

  it("keeps the gaps note out of the committed file", () => {
    expect(buildFlavorFile("acme", prose, selection)).not.toHaveProperty("gaps");
  });

  it("does not let a rewrite resurrect a hidden entry", () => {
    const file = buildFlavorFile(
      "acme",
      { ...prose, work: { "Dropped Co": { summary: "rewritten" } } },
      selection
    );

    expect(file.work?.["Dropped Co"]).toEqual({ visible: false });
  });

  it("omits empty override maps rather than writing dead keys", () => {
    const everythingKept: Selection = {
      work: [candidate("Kept Co", true, 0)],
      projects: [candidate("Alpha", true, 0)],
    };
    const file = buildFlavorFile("acme", { ...prose, work: {} }, everythingKept);

    expect(file).not.toHaveProperty("work");
    expect(file).not.toHaveProperty("projects");
  });
});

describe("registerFlavor", () => {
  const INDEX = `import ai from "./ai.json";
import complete from "./complete.json";
import zebra from "./zebra.json";

export const FLAVOR_FILES = [complete, ai, zebra];
`;

  function scratchRepo(): string {
    const root = mkdtempSync(join(tmpdir(), "flavor-"));
    mkdirSync(join(root, "flavors"));
    writeFileSync(join(root, "flavors", "index.ts"), INDEX);
    return root;
  }

  it("adds the import in sorted position and the entry at the end of the rail", () => {
    const root = scratchRepo();
    expect(registerFlavor(root, "senior-frontend")).toBe("added");

    const source = readFileSync(join(root, "flavors", "index.ts"), "utf-8");
    expect(source).toContain('import seniorFrontend from "./senior-frontend.json";');
    // Between "complete" and "zebra", so the block stays sorted.
    expect(source.indexOf("seniorFrontend")).toBeGreaterThan(source.indexOf("complete"));
    expect(source.indexOf("seniorFrontend")).toBeLessThan(source.indexOf('"./zebra.json"'));
    expect(source).toContain("export const FLAVOR_FILES = [complete, ai, zebra, seniorFrontend];");
  });

  it("sorts an id that belongs before every existing import", () => {
    const root = scratchRepo();
    registerFlavor(root, "aardvark");

    const source = readFileSync(join(root, "flavors", "index.ts"), "utf-8");
    expect(source.indexOf("aardvark")).toBeLessThan(source.indexOf('"./ai.json"'));
  });

  it("is safe to run twice", () => {
    const root = scratchRepo();
    registerFlavor(root, "senior-frontend");
    expect(registerFlavor(root, "senior-frontend")).toBe("already-registered");

    const source = readFileSync(join(root, "flavors", "index.ts"), "utf-8");
    expect(source.match(/seniorFrontend/g)).toHaveLength(2);
  });
});
