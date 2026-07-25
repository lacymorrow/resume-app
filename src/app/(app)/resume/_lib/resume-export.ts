import { exportDocx } from "./resume-export-docx";
import { buildHtmlContent } from "./resume-export-html";
import { exportPdf } from "./resume-export-pdf";
import { downloadBlob, type ExportData } from "./resume-export-shared";
import type { FilterState } from "./resume-filters";
import { resolveProjects, resolveWork } from "./resume-filters";
import type { ResumeFlavor } from "./resume-flavors";
import type { ResumeSchema } from "./resume-types";

export type ExportFormat = "pdf" | "docx" | "html";
export type { ExportData } from "./resume-export-shared";

export async function exportResume(format: ExportFormat, data: ExportData) {
  const filename = `${data.basics.name.replace(/[^a-z0-9]/gi, "_")}_Resume`;

  switch (format) {
    case "html": {
      const html = buildHtmlContent(data);
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      downloadBlob(blob, `${filename}.html`);
      break;
    }
    case "pdf": {
      await exportPdf(data, filename);
      break;
    }
    case "docx": {
      exportDocx(data, filename);
      break;
    }
  }
}

export function buildExportData(
  data: ResumeSchema,
  basics: ResumeSchema["basics"] & { label: string; summary: string },
  flavor: ResumeFlavor,
  filters: FilterState
): ExportData {
  const { entries: workEntries, matches: workMatches } = resolveWork(data, flavor, filters);
  const { entries: projectEntries, matches: projectMatches } = resolveProjects(
    data,
    flavor,
    filters
  );

  return {
    basics,
    workEntries,
    workMatches,
    projectEntries,
    projectMatches,
    skills: data.skills,
    education: data.education,
    interests: data.interests,
    awards: data.awards,
    references: data.references,
    filters,
  };
}
