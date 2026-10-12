import { describe, expect, it } from "vitest";
import { formatWorkDates } from "@/resume/lib/export-shared";

describe("formatWorkDates", () => {
  it("shows months for YYYY-MM dates", () => {
    expect(formatWorkDates("2024-02", "2024-06")).toBe("Feb 2024 - Jun 2024");
  });

  it("keeps year-only dates as years", () => {
    expect(formatWorkDates("2016", "2016")).toBe("2016");
    expect(formatWorkDates("2014-06", "2015")).toBe("Jun 2014 - 2015");
  });

  it("appends the employment type", () => {
    expect(formatWorkDates("2025-12", "2026-03", "Consulting")).toBe(
      "Dec 2025 - Mar 2026 · Consulting"
    );
  });

  it("collapses a single-month role", () => {
    expect(formatWorkDates("2023-03", "2023-03")).toBe("Mar 2023");
  });
});
