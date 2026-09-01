/**
 * Generate sample resume exports (HTML + PDF) without a browser, for
 * design review. Run: bun run scripts/generate-resume-samples.ts [outDir] [flavorId]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import resumeJson from "../resume.json";
import { buildExportData } from "../src/resume/lib/export";
import { buildHtmlContent } from "../src/resume/lib/export-html";
import { buildPdfDoc } from "../src/resume/lib/export-pdf";
import { DEFAULT_FILTER_STATE } from "../src/resume/lib/filters";
import { FLAVORS } from "../src/resume/lib/flavors";
import type { ResumeSchema } from "../src/resume/lib/types";

const outDir = process.argv[2] ?? "/tmp/resume-samples";
const flavorId = process.argv[3] ?? "complete";

const data = resumeJson as unknown as ResumeSchema;
const flavor = FLAVORS.find((f) => f.id === flavorId) ?? FLAVORS[0]!;
const filters = { ...DEFAULT_FILTER_STATE, flavorId: flavor.id, sections: flavor.sections };
const basics = {
  ...data.basics,
  label: flavor.tagline,
  summary: data.basics.summary.replace(/EXPERTISE:.*?(?=\n\n)/s, `EXPERTISE: ${flavor.expertise}`),
};

const exportData = buildExportData(data, basics, flavor, filters);

mkdirSync(outDir, { recursive: true });

const html = buildHtmlContent(exportData);
const htmlPath = join(outDir, `resume-${flavor.id}.html`);
writeFileSync(htmlPath, html);
console.log("wrote", htmlPath);

const doc = await buildPdfDoc(exportData);
const pdfPath = join(outDir, `resume-${flavor.id}.pdf`);
writeFileSync(pdfPath, Buffer.from(doc.output("arraybuffer")));
console.log("wrote", pdfPath);
