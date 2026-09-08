import { describe, expect, it } from "vitest";
import { resolveHighlightedOrg, roleSlug } from "@/resume/lib/highlight";

/** Names shaped like the real resume: punctuation, slashes, a suffix. */
const ORGS = [
  "Duke Energy",
  "Credit Karma",
  "Novant Health / Red Ventures",
  "OptumRX Health / Red Ventures",
  "Twilio Inc.",
  "10up",
];

describe("roleSlug", () => {
  it("reduces a company name to one URL-safe token", () => {
    expect(roleSlug("Credit Karma")).toBe("credit-karma");
    expect(roleSlug("Twilio Inc.")).toBe("twilio-inc");
    expect(roleSlug("Novant Health / Red Ventures")).toBe("novant-health-red-ventures");
    expect(roleSlug("10up")).toBe("10up");
  });

  it("leaves a name with nothing slug-able empty", () => {
    // custom-flavors' slugify substitutes a placeholder here so a saved flavor
    // always has an id. A placeholder in this one would let "?role=..." match.
    expect(roleSlug("...")).toBe("");
  });
});

describe("resolveHighlightedOrg", () => {
  it("resolves the slug an inbound link would carry", () => {
    expect(resolveHighlightedOrg("credit-karma", ORGS)).toBe("Credit Karma");
  });

  it("resolves the company name itself, however it is cased", () => {
    expect(resolveHighlightedOrg("Credit Karma", ORGS)).toBe("Credit Karma");
    expect(resolveHighlightedOrg("  cREDIT kARMA ", ORGS)).toBe("Credit Karma");
  });

  it("resolves an unambiguous prefix, so links can be written from memory", () => {
    expect(resolveHighlightedOrg("credit", ORGS)).toBe("Credit Karma");
    expect(resolveHighlightedOrg("novant", ORGS)).toBe("Novant Health / Red Ventures");
  });

  it("resolves nothing when a prefix fits more than one company", () => {
    // Picking either would point the reader at a job the link did not mean, and
    // a highlight on the wrong role is worse than no highlight at all.
    expect(resolveHighlightedOrg("red", ["Red Ventures", "Red Ventures Studio"])).toBeNull();
  });

  it("resolves nothing for a role this flavor does not show", () => {
    // The flavor is the list: a role it cuts is simply not a candidate, so the
    // link renders the ordinary resume rather than a marker with nothing under it.
    expect(resolveHighlightedOrg("credit-karma", ["Duke Energy"])).toBeNull();
  });

  it("resolves nothing for an absent, empty, or unrecognised parameter", () => {
    expect(resolveHighlightedOrg(null, ORGS)).toBeNull();
    expect(resolveHighlightedOrg(undefined, ORGS)).toBeNull();
    expect(resolveHighlightedOrg("", ORGS)).toBeNull();
    expect(resolveHighlightedOrg("   ", ORGS)).toBeNull();
    expect(resolveHighlightedOrg("-", ORGS)).toBeNull();
    expect(resolveHighlightedOrg("a-company-that-left", ORGS)).toBeNull();
  });

  it("prefers an exact match over a prefix that would also fit", () => {
    const orgs = ["Red Ventures", "Red Ventures Studio"];
    expect(resolveHighlightedOrg("red-ventures", orgs)).toBe("Red Ventures");
  });
});
