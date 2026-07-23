import {
  contactRows,
  downloadBlob,
  type ExportData,
  escXml,
  FOOTER_TEXT,
  formatProjectYear,
  formatYearRange,
  getVisibleProjects,
  getVisibleWork,
  isTechLine,
  parseSummary,
  SIGNATURE,
  splitProjectSummary,
  splitTrailingTechList,
} from "./resume-export-shared";

const INK = SIGNATURE.ink.replace("#", "");
const BODY = SIGNATURE.body.replace("#", "");
const MUTED = SIGNATURE.muted.replace("#", "");
const RAIL = SIGNATURE.rail.replace("#", "");
const PINK = SIGNATURE.pink.replace("#", "");
const BLUE = SIGNATURE.blue.replace("#", "");
const FOOTER = SIGNATURE.footer.replace("#", "");

interface RunOpts {
  bold?: boolean;
  italic?: boolean;
  size?: number;
  color?: string;
  caps?: boolean;
  spacing?: number; // letterspacing in twentieths of a point
}

function run(text: string, opts?: RunOpts): string {
  const sz = (opts?.size ?? 10) * 2;
  let rPr = `<w:rFonts w:ascii="Helvetica Neue" w:hAnsi="Helvetica Neue"/><w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>`;
  if (opts?.bold) rPr += "<w:b/>";
  if (opts?.italic) rPr += "<w:i/>";
  if (opts?.color) rPr += `<w:color w:val="${opts.color}"/>`;
  if (opts?.caps) rPr += "<w:caps/>";
  if (opts?.spacing) rPr += `<w:spacing w:val="${opts.spacing}"/>`;
  return `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${escXml(text)}</w:t></w:r>`;
}

function para(runs: string, spaceAfter = 40): string {
  return `<w:p><w:pPr><w:spacing w:after="${spaceAfter}"/></w:pPr>${runs}</w:p>`;
}

function p(text: string, opts?: RunOpts, spaceAfter?: number): string {
  const lines = text.split("\n");
  const runs = lines
    .map((line, i) => run(line, opts) + (i < lines.length - 1 ? "<w:br/>" : ""))
    .join("");
  return para(runs, spaceAfter);
}

/** Gray letterspaced section label, like the handmade left rail. */
function sectionLabel(title: string): string {
  return p(title, { bold: true, size: 9, color: RAIL, caps: true, spacing: 40 }, 120);
}

export function exportDocx(data: ExportData, filename: string) {
  const { basics, filters } = data;
  const summary = parseSummary(basics.summary);
  const work = getVisibleWork(data);
  const projects = getVisibleProjects(data);

  let body = "";

  // ---- Masthead ----
  body += p(`${basics.name} ★`, { bold: true, size: 30, color: INK }, 60);
  body += p(basics.label, { size: 10.5, color: MUTED }, 60);
  body += para(
    contactRows(basics)
      .map((row) => run(row.text, { size: 8.5, color: INK }))
      .join(run("   |   ", { size: 8.5, color: RAIL })),
    120
  );
  body += p(summary.intro, { bold: true, size: 10.5, color: MUTED }, 160);

  // ---- Expertise ----
  if (summary.expertise) {
    body += sectionLabel("Expertise");
    body += p(summary.expertise, { size: 9.5, color: BODY }, 60);
    if (summary.interested)
      body += p(summary.interested, { bold: true, size: 9.5, color: INK }, 160);
  }

  // ---- Developer Experience ----
  if (filters.sections.work && work.length > 0) {
    body += sectionLabel("Developer Experience");
    for (const entry of work) {
      body += para(run(entry.position, { bold: true, size: 11, color: BLUE }), 20);
      body += para(
        run(formatYearRange(entry.startDate, entry.endDate), {
          bold: true,
          size: 10,
          color: PINK,
        }) +
          run(`   ${entry.name}`, { bold: true, size: 9.5, color: INK }) +
          (entry.sector ? run(`  (${entry.sector})`, { size: 8.5, color: MUTED }) : ""),
        40
      );
      if (entry.summary) {
        const { body: summaryBody, tech: summaryTech } = splitTrailingTechList(entry.summary);
        if (summaryBody) body += p(summaryBody, { size: 9.5, color: BODY }, 40);
        if (summaryTech) body += p(summaryTech, { bold: true, size: 9.5, color: INK }, 40);
      }
      const highlights = (entry.highlights ?? []).filter(Boolean);
      for (let i = 0; i < highlights.length; i++) {
        const h = highlights[i]!;
        const tech = i === highlights.length - 1 && isTechLine(h);
        body += p(`• ${h}`, { size: 9.5, color: tech ? INK : BODY, bold: tech }, 20);
      }
      body += p("", { size: 6 }, 60);
    }
  }

  // ---- Personal ----
  if (filters.sections.skills && data.skills.length > 0) {
    body += sectionLabel("Personal — Tech Stack ♥");
    for (const group of data.skills) {
      body += para(
        run(`${group.name}: `, { bold: true, size: 9.5, color: INK }) +
          run(group.keywords.join(" / "), { size: 9.5, color: BODY }) +
          run(`  : ${group.level}`, { italic: true, size: 9.5, color: MUTED }),
        30
      );
    }
    body += p("", { size: 6 }, 60);
  }
  if (filters.sections.interests && data.interests.length > 0) {
    body += sectionLabel("Interests");
    body += p(data.interests.map((i) => i.name).join(", "), { size: 9.5, color: BODY }, 100);
  }
  if (summary.qualities) {
    body += sectionLabel("Qualities");
    body += p(summary.qualities, { size: 9.5, color: BODY }, 100);
  }
  if (filters.sections.education && data.education.length > 0) {
    body += sectionLabel("Education");
    for (const edu of data.education) {
      body += p(`${edu.studyType} — ${edu.area}`, { bold: true, size: 10, color: INK }, 20);
      body += p(
        `${formatYearRange(edu.startDate, edu.endDate)} | ${edu.institution}`,
        { size: 9.5, color: MUTED },
        100
      );
    }
  }
  if (filters.sections.awards && data.awards.length > 0) {
    body += sectionLabel("Awards");
    for (const award of data.awards) {
      body += para(
        run(award.title, { bold: true, size: 9.5, color: INK }) +
          run(` — ${award.awarder}, ${new Date(award.date).getUTCFullYear()}`, {
            size: 9.5,
            color: BODY,
          }),
        100
      );
    }
  }

  // ---- Open-Source ----
  if (filters.sections.projects && projects.length > 0) {
    body += sectionLabel("Open-Source");
    for (const project of projects) {
      const { tagline, body: projBody } = splitProjectSummary(project.summary);
      body += para(
        run(tagline ? `${project.name}: ${tagline}` : project.name, {
          bold: true,
          size: 11,
          color: BLUE,
        }) + (project.featured ? run(" ★", { size: 11, color: INK }) : ""),
        20
      );
      body += para(
        run(formatProjectYear(project.startDate, project.endDate), {
          bold: true,
          size: 10,
          color: PINK,
        }),
        40
      );
      if (projBody) body += p(projBody, { size: 9.5, color: BODY }, 40);
      for (const h of (project.highlights ?? []).filter(Boolean)) {
        body += p(`• ${h}`, { size: 9.5, color: BODY }, 20);
      }
      body += p("", { size: 6 }, 60);
    }
  }

  // ---- References + footer line ----
  if (filters.sections.references && data.references.length > 0) {
    body += sectionLabel("References");
    for (const ref of data.references) {
      body += p(`“${ref.reference}”`, { italic: true, size: 9.5, color: MUTED }, 30);
      body += p(`— ${ref.name}`, { size: 9.5, color: INK }, 100);
    }
  }
  body += p(FOOTER_TEXT, { size: 8, color: FOOTER }, 0);

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

  void import("jszip").then((mod) => {
    const JSZip = mod.default;
    const zip = new JSZip();
    zip.file("[Content_Types].xml", contentTypes);
    zip.file("_rels/.rels", rels);
    zip.file("word/document.xml", docXml);
    zip.file("word/_rels/document.xml.rels", wordRels);

    void zip
      .generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      })
      .then((blob) => {
        downloadBlob(blob, `${filename}.docx`);
      });
  });
}
