/** A resume small enough to reason about, in the real schema. */

import type { ResumeSchema, ResumeWork } from "@/resume/lib/types";

export function work(name: string, summary: string, extra: Partial<ResumeWork> = {}): ResumeWork {
  return {
    name,
    position: "Engineer",
    startDate: "2020-01-01",
    endDate: "2021-01-01",
    summary,
    ...extra,
  };
}

export function makeResume(overrides: Partial<ResumeSchema> = {}): ResumeSchema {
  return {
    basics: {
      name: "Test Person",
      label: "Engineer",
      image: "",
      email: "test@example.com",
      phone: "",
      url: "https://example.com",
      summary: "",
      location: { countryCode: "US", city: "Charlotte", state: "NC", address: "" },
      profiles: [],
    },
    work: [
      work("Newest Co", "Built things with Rust and Docker."),
      work("Second Co", "Built things with Swift."),
      work("Third Co", "Built things with Vue."),
      work("Fourth Co", "Built things with React and TypeScript and Next.js."),
      work("Fifth Co", "Built things with React."),
      work("Sixth Co", "Ran a print shop. Nothing technical here."),
    ],
    projects: [
      { name: "Alpha", startDate: "2020-01-01", summary: "A React and TypeScript thing." },
      { name: "Beta", startDate: "2020-01-01", summary: "A Rust thing." },
      { name: "Gamma", startDate: "2020-01-01", summary: "A watercolour thing." },
    ],
    volunteer: [],
    education: [],
    awards: [],
    certificates: [],
    publications: [],
    skills: [],
    languages: [],
    interests: [],
    references: [],
    ...overrides,
  };
}
