import type { ResumeSchema, ResumeWork, ResumeProject } from "./resume-types";
import type { FilterState, MatchResult } from "./resume-filters";
import type { ResumeFlavor } from "./resume-flavors";
import { resolveWork, resolveProjects } from "./resume-filters";

export type ExportFormat = "pdf" | "docx" | "html";

const PALETTE = {
  navy: "#1e3a5f",
  rose: "#c9365e",
  dark: "#1a1a2e",
  body: "#2d2d3f",
  muted: "#5a5a72",
  subtle: "#8888a0",
  rule: "#e0dfe8",
  roseLight: "#f8e8ee",
};

interface ExportData {
  basics: ResumeSchema["basics"] & { label: string; summary: string };
  workEntries: (ResumeWork & { originalIndex: number })[];
  workMatches: Map<number, MatchResult>;
  projectEntries: (ResumeProject & { originalIndex: number })[];
  projectMatches: Map<number, MatchResult>;
  skills: ResumeSchema["skills"];
  education: ResumeSchema["education"];
  interests: ResumeSchema["interests"];
  awards: ResumeSchema["awards"];
  references: ResumeSchema["references"];
  filters: FilterState;
}

function getVisibleWork(data: ExportData): (ResumeWork & { originalIndex: number })[] {
  return data.workEntries.filter((entry) => {
    const match = data.workMatches.get(entry.originalIndex);
    return !match || match.matched;
  });
}

function getVisibleProjects(data: ExportData): (ResumeProject & { originalIndex: number })[] {
  return data.projectEntries.filter((entry) => {
    const match = data.projectMatches.get(entry.originalIndex);
    return !match || match.matched;
  });
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

function formatDateRange(startDate: string, endDate?: string): string {
  const start = formatDate(startDate);
  if (!endDate) return `${start} - Present`;
  const end = formatDate(endDate);
  if (start === end) return start;
  return `${start} - ${end}`;
}

function parseExpertise(summary: string): { intro: string; expertise: string | null } {
  const paragraphs = summary.split("\n\n");
  const intro = paragraphs[0] ?? "";
  const expertiseParagraph = paragraphs.find((p) => p.startsWith("EXPERTISE:"));
  const expertise = expertiseParagraph?.replace("EXPERTISE: ", "") ?? null;
  return { intro, expertise };
}

function buildHtmlContent(data: ExportData): string {
  const { basics, filters } = data;
  const { intro, expertise } = parseExpertise(basics.summary);
  const work = getVisibleWork(data);
  const projects = getVisibleProjects(data);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(basics.name)} - Resume</title>
<style>
body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; font-size: 10.5pt; line-height: 1.55; color: ${PALETTE.body}; max-width: 8.5in; margin: 0 auto; padding: 0.5in 0.6in; }
h1 { font-size: 24pt; margin: 0; color: ${PALETTE.navy}; font-weight: 700; letter-spacing: -0.01em; }
h2 { font-size: 9pt; text-transform: uppercase; letter-spacing: 0.18em; color: ${PALETTE.navy}; border-bottom: 2px solid ${PALETTE.rose}; padding-bottom: 4px; margin-top: 1.4em; margin-bottom: 0.7em; font-weight: 600; }
h3 { font-size: 11pt; margin: 0; }
.subtitle { color: ${PALETTE.rose}; font-size: 11pt; margin-top: 3px; font-weight: 500; }
.contact-bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 9pt; color: ${PALETTE.muted}; margin-top: 8px; padding-top: 8px; border-top: 1px solid ${PALETTE.rule}; }
.contact-bar .sep { color: ${PALETTE.rose}; margin: 0 2px; }
.summary { margin-top: 12px; font-size: 10pt; line-height: 1.6; white-space: pre-wrap; color: ${PALETTE.dark}; }
.expertise { font-size: 9pt; color: ${PALETTE.muted}; margin-top: 8px; line-height: 1.5; }
.expertise strong { color: ${PALETTE.navy}; }
.entry { margin-bottom: 14px; padding-left: 10px; border-left: 2px solid ${PALETTE.rule}; }
.entry-header { display: flex; justify-content: space-between; align-items: baseline; }
.entry-title { font-weight: 600; color: ${PALETTE.dark}; }
.entry-company { font-size: 10pt; color: ${PALETTE.muted}; }
.entry-sector { font-size: 8.5pt; color: ${PALETTE.subtle}; font-style: italic; margin-left: 6px; }
.entry-date { font-size: 9pt; color: ${PALETTE.rose}; white-space: nowrap; font-weight: 500; }
.entry-summary { font-size: 10pt; color: ${PALETTE.body}; margin-top: 3px; white-space: pre-wrap; }
.entry-highlights { margin: 6px 0 0 0; padding-left: 16px; font-size: 9.5pt; color: ${PALETTE.body}; }
.entry-highlights li { margin-bottom: 3px; }
.entry-highlights li::marker { color: ${PALETTE.rose}; }
.skills-group { margin-bottom: 8px; }
.skills-name { font-weight: 600; font-size: 10pt; color: ${PALETTE.navy}; }
.skills-keywords { font-size: 10pt; color: ${PALETTE.muted}; }
.edu-entry { margin-bottom: 10px; }
.edu-entry strong { color: ${PALETTE.dark}; }
a { color: ${PALETTE.navy}; text-decoration: none; }
a:hover { text-decoration: underline; }
@media print { body { padding: 0; } }
</style>
</head>
<body>
<header>
<h1>${esc(basics.name)}</h1>
<div class="subtitle">${esc(basics.label)}</div>
<div class="contact-bar">${[
    location ? esc(location) : "",
    esc(basics.phone),
    esc(basics.email),
    basics.url ? `<a href="${esc(basics.url)}">${esc(basics.url.replace(/^https?:\/\//, ""))}</a>` : "",
  ].filter(Boolean).join(`<span class="sep">|</span>`)}</div>
<div class="summary">${esc(intro)}</div>
${expertise ? `<div class="expertise"><strong>Expertise:</strong> ${esc(expertise)}</div>` : ""}
</header>
`;

  if (filters.sections.work && work.length > 0) {
    html += `<h2>Work Experience</h2>\n`;
    for (const entry of work) {
      html += `<div class="entry">
<div class="entry-header"><div><span class="entry-title">${esc(entry.position)}</span> <span class="entry-company">— ${esc(entry.name)}</span>${entry.sector ? `<span class="entry-sector">${esc(entry.sector)}</span>` : ""}</div><span class="entry-date">${esc(formatDateRange(entry.startDate, entry.endDate))}</span></div>
<div class="entry-summary">${esc(entry.summary)}</div>`;
      if (entry.highlights?.length) {
        html += `<ul class="entry-highlights">${entry.highlights.filter(Boolean).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`;
      }
      html += `</div>\n`;
    }
  }

  if (filters.sections.projects && projects.length > 0) {
    html += `<h2>Projects</h2>\n`;
    for (const project of projects) {
      html += `<div class="entry">
<div class="entry-header"><span class="entry-title">${esc(project.name)}</span><span class="entry-date">${esc(formatDateRange(project.startDate, project.endDate))}</span></div>
<div class="entry-summary">${esc(project.summary)}</div>`;
      if (project.highlights?.length) {
        html += `<ul class="entry-highlights">${project.highlights.filter(Boolean).map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`;
      }
      html += `</div>\n`;
    }
  }

  if (filters.sections.skills && data.skills.length > 0) {
    html += `<h2>Skills</h2>\n`;
    for (const group of data.skills) {
      html += `<div class="skills-group"><span class="skills-name">${esc(group.name)}</span> (${esc(group.level)}): <span class="skills-keywords">${esc(group.keywords.join(", "))}</span></div>\n`;
    }
  }

  if (filters.sections.education && data.education.length > 0) {
    html += `<h2>Education</h2>\n`;
    for (const edu of data.education) {
      html += `<div class="edu-entry"><strong>${esc(edu.studyType)} — ${esc(edu.area)}</strong><br>${esc(edu.institution)} | ${esc(formatDateRange(edu.startDate, edu.endDate))}</div>\n`;
    }
  }

  if (filters.sections.interests && data.interests.length > 0) {
    html += `<h2>Interests</h2>\n<p>${data.interests.map((i) => esc(i.name)).join(", ")}</p>\n`;
  }

  if (filters.sections.awards && data.awards.length > 0) {
    html += `<h2>Awards</h2>\n`;
    for (const a of data.awards) {
      html += `<p><strong>${esc(a.title)}</strong> — ${esc(a.awarder)}, ${new Date(a.date).getUTCFullYear()}</p>\n`;
    }
  }

  if (filters.sections.references && data.references.length > 0) {
    html += `<h2>References</h2>\n`;
    for (const r of data.references) {
      html += `<blockquote>&ldquo;${esc(r.reference)}&rdquo; — ${esc(r.name)}</blockquote>\n`;
    }
  }

  html += `</body></html>`;
  return html;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

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

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function exportPdf(data: ExportData, filename: string) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const { basics, filters } = data;
  const { intro, expertise } = parseExpertise(basics.summary);
  const work = getVisibleWork(data);
  const projects = getVisibleProjects(data);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  const navy = hexToRgb(PALETTE.navy);
  const rose = hexToRgb(PALETTE.rose);
  const body = hexToRgb(PALETTE.body);
  const muted = hexToRgb(PALETTE.muted);
  const dark = hexToRgb(PALETTE.dark);

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header — name in navy
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...navy);
  doc.text(basics.name, margin, y);
  y += 18;

  // Label in rose
  doc.setFontSize(10.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...rose);
  doc.text(basics.label, margin, y);
  y += 14;

  // Contact line
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  const contactLine = [basics.phone, basics.email, basics.url?.replace(/^https?:\/\//, ""), location].filter(Boolean).join("  |  ");
  doc.text(contactLine, margin, y);
  y += 6;

  // Accent rule under header
  doc.setDrawColor(...rose);
  doc.setLineWidth(1.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 14;

  // Summary
  doc.setTextColor(...dark);
  doc.setFontSize(9.5);
  const introLines = doc.splitTextToSize(intro, contentWidth);
  checkPage(introLines.length * 12 + 8);
  doc.text(introLines, margin, y);
  y += introLines.length * 12 + 4;

  if (expertise) {
    const exWidth = doc.getTextWidth("Expertise: ");
    const firstLineParts = doc.splitTextToSize(expertise, contentWidth - exWidth);
    const firstLine = firstLineParts[0] ?? "";
    const remaining = expertise.slice(firstLine.length).trimStart();
    const contLines = remaining ? doc.splitTextToSize(remaining, contentWidth) : [];
    const exLines = [firstLine, ...contLines];
    checkPage(exLines.length * 11 + 14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text("Expertise: ", margin, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...muted);
    doc.text(exLines[0] ?? "", margin + exWidth, y);
    for (let i = 1; i < exLines.length; i++) {
      y += 11;
      checkPage(12);
      doc.text(exLines[i] ?? "", margin, y);
    }
    y += 14;
  }

  const drawSectionHeader = (title: string) => {
    checkPage(30);
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...navy);
    doc.text(title.toUpperCase(), margin, y);
    y += 4;
    doc.setDrawColor(...rose);
    doc.setLineWidth(1.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
  };

  // Work
  if (filters.sections.work && work.length > 0) {
    drawSectionHeader("Work Experience");
    for (const entry of work) {
      checkPage(60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(entry.position, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...rose);
      doc.setFontSize(9);
      const dateStr = formatDateRange(entry.startDate, entry.endDate);
      doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), y);
      y += 12;
      doc.setFontSize(9.5);
      doc.setTextColor(...muted);
      const companyText = entry.sector ? `${entry.name}  ·  ${entry.sector}` : entry.name;
      doc.text(companyText, margin, y);
      y += 12;

      doc.setFontSize(9);
      doc.setTextColor(...body);
      const sumLines = doc.splitTextToSize(entry.summary, contentWidth);
      checkPage(sumLines.length * 11);
      doc.text(sumLines, margin, y);
      y += sumLines.length * 11 + 2;

      if (entry.highlights?.length) {
        for (const h of entry.highlights.filter(Boolean)) {
          const hLines = doc.splitTextToSize(`• ${h}`, contentWidth - 10);
          checkPage(hLines.length * 11);
          doc.text(hLines, margin + 10, y);
          y += hLines.length * 11;
        }
      }
      y += 8;
    }
  }

  // Projects
  if (filters.sections.projects && projects.length > 0) {
    drawSectionHeader("Projects");
    for (const project of projects) {
      checkPage(40);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(project.name, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...rose);
      doc.setFontSize(9);
      const dateStr = formatDateRange(project.startDate, project.endDate);
      doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), y);
      y += 12;

      doc.setFontSize(9);
      doc.setTextColor(...body);
      const sumLines = doc.splitTextToSize(project.summary, contentWidth);
      checkPage(sumLines.length * 11);
      doc.text(sumLines, margin, y);
      y += sumLines.length * 11 + 2;

      if (project.highlights?.length) {
        for (const h of project.highlights.filter(Boolean)) {
          const hLines = doc.splitTextToSize(`• ${h}`, contentWidth - 10);
          checkPage(hLines.length * 11);
          doc.text(hLines, margin + 10, y);
          y += hLines.length * 11;
        }
      }
      y += 8;
    }
  }

  // Skills
  if (filters.sections.skills && data.skills.length > 0) {
    drawSectionHeader("Skills");
    for (const group of data.skills) {
      checkPage(16);
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...navy);
      doc.text(`${group.name} (${group.level}): `, margin, y);
      const labelWidth = doc.getTextWidth(`${group.name} (${group.level}): `);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...body);
      const kwLines = doc.splitTextToSize(group.keywords.join(", "), contentWidth - labelWidth);
      doc.text(kwLines[0], margin + labelWidth, y);
      if (kwLines.length > 1) {
        for (let i = 1; i < kwLines.length; i++) {
          y += 11;
          doc.text(kwLines[i], margin, y);
        }
      }
      y += 14;
    }
  }

  // Education
  if (filters.sections.education && data.education.length > 0) {
    drawSectionHeader("Education");
    for (const edu of data.education) {
      checkPage(30);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...dark);
      doc.text(`${edu.studyType} — ${edu.area}`, margin, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(...muted);
      doc.text(`${edu.institution} | ${formatDateRange(edu.startDate, edu.endDate)}`, margin, y);
      y += 16;
    }
  }

  doc.save(`${filename}.pdf`);
}

function exportDocx(data: ExportData, filename: string) {
  const { basics, filters } = data;
  const { intro, expertise } = parseExpertise(basics.summary);
  const work = getVisibleWork(data);
  const projects = getVisibleProjects(data);
  const location = [basics.location.city, basics.location.state].filter(Boolean).join(", ");

  let body = "";

  const p = (text: string, opts?: { bold?: boolean; size?: number; heading?: number; color?: string }) => {
    const sz = (opts?.size ?? 22) * 2;
    let pPr = "";
    if (opts?.heading) pPr += `<w:pStyle w:val="Heading${opts.heading}"/>`;
    let rPr = `<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
    if (opts?.bold) rPr += `<w:b/>`;
    if (opts?.color) rPr += `<w:color w:val="${opts.color}"/>`;
    const lines = text.split("\n");
    if (lines.length <= 1) {
      return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;
    }
    const runs = lines.map((line, i) => {
      const br = i < lines.length - 1 ? "<w:br/>" : "";
      return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escXml(line)}</w:t>${br}</w:r>`;
    }).join("");
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}${runs}</w:p>`;
  };

  const navyHex = PALETTE.navy.replace("#", "");
  const roseHex = PALETTE.rose.replace("#", "");
  const bodyHex = PALETTE.body.replace("#", "");
  const mutedHex = PALETTE.muted.replace("#", "");
  const darkHex = PALETTE.dark.replace("#", "");

  // Header
  body += p(basics.name, { bold: true, size: 28, color: navyHex });
  body += p(basics.label, { size: 14, color: roseHex });
  if (location) body += p(location, { size: 10, color: mutedHex });
  body += p([basics.phone, basics.email, basics.url?.replace(/^https?:\/\//, "")].filter(Boolean).join("  |  "), { size: 10, color: mutedHex });
  body += p("");
  body += p(intro, { size: 11, color: darkHex });
  if (expertise) body += p(`Expertise: ${expertise}`, { size: 10, color: mutedHex });
  body += p("");

  // Work
  if (filters.sections.work && work.length > 0) {
    body += p("WORK EXPERIENCE", { bold: true, size: 11, color: navyHex });
    for (const entry of work) {
      const entryLabel = entry.sector ? `${entry.position} — ${entry.name}  ·  ${entry.sector}` : `${entry.position} — ${entry.name}`;
      body += p(`${entryLabel}    ${formatDateRange(entry.startDate, entry.endDate)}`, { bold: true, size: 11, color: darkHex });
      body += p(entry.summary, { size: 10, color: bodyHex });
      if (entry.highlights?.length) {
        for (const h of entry.highlights.filter(Boolean)) {
          body += p(`• ${h}`, { size: 10, color: bodyHex });
        }
      }
      body += p("");
    }
  }

  // Projects
  if (filters.sections.projects && projects.length > 0) {
    body += p("PROJECTS", { bold: true, size: 11, color: navyHex });
    for (const project of projects) {
      body += p(`${project.name}    ${formatDateRange(project.startDate, project.endDate)}`, { bold: true, size: 11, color: darkHex });
      body += p(project.summary, { size: 10, color: bodyHex });
      if (project.highlights?.length) {
        for (const h of project.highlights.filter(Boolean)) {
          body += p(`• ${h}`, { size: 10, color: bodyHex });
        }
      }
      body += p("");
    }
  }

  // Skills
  if (filters.sections.skills && data.skills.length > 0) {
    body += p("SKILLS", { bold: true, size: 11, color: navyHex });
    for (const group of data.skills) {
      body += p(`${group.name} (${group.level}): ${group.keywords.join(", ")}`, { size: 10, color: bodyHex });
    }
    body += p("");
  }

  // Education
  if (filters.sections.education && data.education.length > 0) {
    body += p("EDUCATION", { bold: true, size: 11, color: navyHex });
    for (const edu of data.education) {
      body += p(`${edu.studyType} — ${edu.area}`, { bold: true, size: 11, color: darkHex });
      body += p(`${edu.institution} | ${formatDateRange(edu.startDate, edu.endDate)}`, { size: 10, color: mutedHex });
    }
    body += p("");
  }

  // Interests
  if (filters.sections.interests && data.interests.length > 0) {
    body += p("INTERESTS", { bold: true, size: 11, color: navyHex });
    body += p(data.interests.map((i) => i.name).join(", "), { size: 10, color: bodyHex });
    body += p("");
  }

  // Awards
  if (filters.sections.awards && data.awards.length > 0) {
    body += p("AWARDS", { bold: true, size: 11, color: navyHex });
    for (const a of data.awards) {
      body += p(`${a.title} — ${a.awarder}, ${new Date(a.date).getUTCFullYear()}`, { size: 10, color: bodyHex });
    }
    body += p("");
  }

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>${body}</w:body>
</w:document>`;

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`;

  // Use JSZip to create the .docx (ZIP format)
  import("jszip").then((mod) => {
    const JSZip = mod.default;
    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rels);
    zip.file("word/document.xml", docXml);
    zip.file("word/_rels/document.xml.rels", wordRels);

    zip.generateAsync({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }).then((blob) => {
      downloadBlob(blob, `${filename}.docx`);
    });
  });
}

function escXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function buildExportData(
  data: ResumeSchema,
  basics: ResumeSchema["basics"] & { label: string; summary: string },
  flavor: ResumeFlavor,
  filters: FilterState,
): ExportData {
  const { entries: workEntries, matches: workMatches } = resolveWork(data, flavor, filters);
  const { entries: projectEntries, matches: projectMatches } = resolveProjects(data, flavor, filters);

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
