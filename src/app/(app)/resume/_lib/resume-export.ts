import type { ResumeSchema, ResumeWork, ResumeProject } from "./resume-types";
import type { FilterState, MatchResult } from "./resume-filters";
import type { ResumeFlavor } from "./resume-flavors";
import { resolveWork, resolveProjects } from "./resume-filters";

export type ExportFormat = "pdf" | "docx" | "html";

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
  return new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric" });
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
<title>${basics.name} - Resume</title>
<style>
body { font-family: 'Segoe UI', system-ui, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; max-width: 8.5in; margin: 0 auto; padding: 0.5in 0.6in; }
h1 { font-size: 22pt; margin: 0; }
h2 { font-size: 10pt; text-transform: uppercase; letter-spacing: 0.15em; color: #666; border-bottom: 1px solid #ddd; padding-bottom: 4px; margin-top: 1.5em; margin-bottom: 0.75em; }
h3 { font-size: 11pt; margin: 0; }
.subtitle { color: #666; font-size: 12pt; margin-top: 2px; }
.location { color: #888; font-size: 10pt; }
.contact { font-size: 10pt; color: #555; margin-top: 4px; }
.summary { margin-top: 12px; font-size: 10pt; }
.expertise { font-size: 9pt; color: #666; margin-top: 6px; }
.entry { margin-bottom: 12px; }
.entry-header { display: flex; justify-content: space-between; align-items: baseline; }
.entry-title { font-weight: 600; }
.entry-company { font-size: 10pt; color: #555; }
.entry-date { font-size: 10pt; color: #666; white-space: nowrap; }
.entry-summary { font-size: 10pt; color: #444; margin-top: 3px; }
.entry-highlights { margin: 4px 0 0 0; padding-left: 16px; font-size: 10pt; color: #444; }
.entry-highlights li { margin-bottom: 2px; }
.skills-group { margin-bottom: 8px; }
.skills-name { font-weight: 600; font-size: 10pt; }
.skills-keywords { font-size: 10pt; color: #555; }
.edu-entry { margin-bottom: 8px; }
a { color: inherit; text-decoration: none; }
@media print { body { padding: 0; } }
</style>
</head>
<body>
<header>
<h1>${esc(basics.name)}</h1>
<div class="subtitle">${esc(basics.label)}</div>
${location ? `<div class="location">${esc(location)}</div>` : ""}
<div class="contact">${esc(basics.phone)} | ${esc(basics.email)} | <a href="${esc(basics.url)}">${esc(basics.url.replace("http://", ""))}</a></div>
<div class="summary">${esc(intro)}</div>
${expertise ? `<div class="expertise"><strong>Expertise:</strong> ${esc(expertise)}</div>` : ""}
</header>
`;

  if (filters.sections.work && work.length > 0) {
    html += `<h2>Work Experience</h2>\n`;
    for (const entry of work) {
      html += `<div class="entry">
<div class="entry-header"><div><span class="entry-title">${esc(entry.position)}</span> <span class="entry-company">— ${esc(entry.name)}</span></div><span class="entry-date">${esc(formatDateRange(entry.startDate, entry.endDate))}</span></div>
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
      html += `<p><strong>${esc(a.title)}</strong> — ${esc(a.awarder)}, ${new Date(a.date).getFullYear()}</p>\n`;
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
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
  const filename = `${data.basics.name.replace(/\s+/g, "_")}_Resume`;

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

  const checkPage = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(basics.name, margin, y);
  y += 18;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(basics.label, margin, y);
  y += 14;

  doc.setFontSize(9);
  const contactLine = [basics.phone, basics.email, basics.url.replace("http://", ""), location].filter(Boolean).join("  |  ");
  doc.text(contactLine, margin, y);
  y += 16;

  doc.setTextColor(50);
  doc.setFontSize(9.5);
  const introLines = doc.splitTextToSize(intro, contentWidth);
  checkPage(introLines.length * 12 + 8);
  doc.text(introLines, margin, y);
  y += introLines.length * 12 + 4;

  if (expertise) {
    doc.setFont("helvetica", "bold");
    doc.text("Expertise: ", margin, y);
    const exWidth = doc.getTextWidth("Expertise: ");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80);
    const exLines = doc.splitTextToSize(expertise, contentWidth - exWidth);
    doc.text(exLines[0], margin + exWidth, y);
    if (exLines.length > 1) {
      for (let i = 1; i < exLines.length; i++) {
        y += 11;
        doc.text(exLines[i], margin, y);
      }
    }
    y += 14;
  }

  doc.setTextColor(0);

  const drawSectionHeader = (title: string) => {
    checkPage(30);
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100);
    doc.text(title.toUpperCase(), margin, y);
    y += 4;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;
    doc.setTextColor(0);
  };

  // Work
  if (filters.sections.work && work.length > 0) {
    drawSectionHeader("Work Experience");
    for (const entry of work) {
      checkPage(60);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(entry.position, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const dateStr = formatDateRange(entry.startDate, entry.endDate);
      doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), y);
      y += 12;
      doc.setFontSize(9.5);
      doc.text(entry.name, margin, y);
      doc.setTextColor(0);
      y += 12;

      doc.setFontSize(9);
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
      doc.text(project.name, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100);
      const dateStr = formatDateRange(project.startDate, project.endDate);
      doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), y);
      doc.setTextColor(0);
      y += 12;

      doc.setFontSize(9);
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
      doc.text(`${group.name} (${group.level}): `, margin, y);
      const labelWidth = doc.getTextWidth(`${group.name} (${group.level}): `);
      doc.setFont("helvetica", "normal");
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
      doc.text(`${edu.studyType} — ${edu.area}`, margin, y);
      y += 12;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
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
    return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r></w:p>`;
  };

  // Header
  body += p(basics.name, { bold: true, size: 28 });
  body += p(basics.label, { size: 14, color: "666666" });
  if (location) body += p(location, { size: 10, color: "888888" });
  body += p([basics.phone, basics.email, basics.url.replace("http://", "")].filter(Boolean).join("  |  "), { size: 10, color: "555555" });
  body += p("");
  body += p(intro, { size: 11 });
  if (expertise) body += p(`Expertise: ${expertise}`, { size: 10, color: "666666" });
  body += p("");

  // Work
  if (filters.sections.work && work.length > 0) {
    body += p("WORK EXPERIENCE", { bold: true, size: 11, color: "666666" });
    for (const entry of work) {
      body += p(`${entry.position} — ${entry.name}    ${formatDateRange(entry.startDate, entry.endDate)}`, { bold: true, size: 11 });
      body += p(entry.summary, { size: 10 });
      if (entry.highlights?.length) {
        for (const h of entry.highlights.filter(Boolean)) {
          body += p(`• ${h}`, { size: 10 });
        }
      }
      body += p("");
    }
  }

  // Projects
  if (filters.sections.projects && projects.length > 0) {
    body += p("PROJECTS", { bold: true, size: 11, color: "666666" });
    for (const project of projects) {
      body += p(`${project.name}    ${formatDateRange(project.startDate, project.endDate)}`, { bold: true, size: 11 });
      body += p(project.summary, { size: 10 });
      if (project.highlights?.length) {
        for (const h of project.highlights.filter(Boolean)) {
          body += p(`• ${h}`, { size: 10 });
        }
      }
      body += p("");
    }
  }

  // Skills
  if (filters.sections.skills && data.skills.length > 0) {
    body += p("SKILLS", { bold: true, size: 11, color: "666666" });
    for (const group of data.skills) {
      body += p(`${group.name} (${group.level}): ${group.keywords.join(", ")}`, { size: 10 });
    }
    body += p("");
  }

  // Education
  if (filters.sections.education && data.education.length > 0) {
    body += p("EDUCATION", { bold: true, size: 11, color: "666666" });
    for (const edu of data.education) {
      body += p(`${edu.studyType} — ${edu.area}`, { bold: true, size: 11 });
      body += p(`${edu.institution} | ${formatDateRange(edu.startDate, edu.endDate)}`, { size: 10 });
    }
    body += p("");
  }

  // Interests
  if (filters.sections.interests && data.interests.length > 0) {
    body += p("INTERESTS", { bold: true, size: 11, color: "666666" });
    body += p(data.interests.map((i) => i.name).join(", "), { size: 10 });
    body += p("");
  }

  // Awards
  if (filters.sections.awards && data.awards.length > 0) {
    body += p("AWARDS", { bold: true, size: 11, color: "666666" });
    for (const a of data.awards) {
      body += p(`${a.title} — ${a.awarder}, ${new Date(a.date).getFullYear()}`, { size: 10 });
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
