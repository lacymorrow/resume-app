import { describe, expect, it } from "vitest";
import { matchPosting } from "../../../scripts/flavor/steps/match";
import { readPosting } from "../../../scripts/flavor/steps/posting";
import { makeResume } from "./fixtures";

const LONG = "We need a senior engineer. ".repeat(20);

describe("readPosting", () => {
  it("refuses a posting too short to tailor against", () => {
    expect(() => readPosting("tests/unit/resume/__missing__.txt", process.cwd())).toThrow(
      /No such file/
    );
  });
});

describe("matchPosting", () => {
  it("reads the posting in the resume's canonical tag vocabulary", () => {
    const match = matchPosting(
      { text: `${LONG} You will use nextjs, ecommerce funnels, and postgres.`, source: "t" },
      makeResume()
    );

    // Aliases collapse: "nextjs" is the resume's "Next.js", never a raw word.
    expect(match.shared).toContain("Next.js");
  });

  it("separates what the resume can answer from what it cannot", () => {
    const match = matchPosting(
      { text: `${LONG} We use Svelte and React.`, source: "t" },
      makeResume()
    );

    expect(match.shared).toContain("React");
    expect(match.shared).not.toContain("Svelte");
    expect(match.missing).toContain("Svelte");
  });

  it("is empty rather than noisy when nothing overlaps", () => {
    const match = matchPosting({ text: `${LONG} We bake bread.`, source: "t" }, makeResume());
    expect(match.shared).toEqual([]);
  });
});
