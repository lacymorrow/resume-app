import {
  contactRows,
  displayUrl,
  downloadBlob,
  type ExportData,
  escXml,
  footerHref,
  footerParts,
  formatProjectYear,
  formatYearRange,
  getVisibleProjects,
  getVisibleWork,
  isTechLine,
  PRINT,
  parseSummary,
  splitProjectSummary,
  splitTrailingTechList,
  summaryBlockLabel,
} from "./export-shared";

const INK = PRINT.ink.replace("#", "");
const BODY = PRINT.body.replace("#", "");
const MUTED = PRINT.muted.replace("#", "");
const RAIL = PRINT.rail.replace("#", "");
const PINK = PRINT.accent.replace("#", "");
const BLUE = PRINT.heading.replace("#", "");
const FOOTER = PRINT.footer.replace("#", "");

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

  const hyperlinks: { id: string; url: string }[] = [];
  let linkCounter = 0;

  function addHyperlink(url: string, textXml: string): string {
    const id = `rLink${++linkCounter}`;
    hyperlinks.push({ id, url });
    return `<w:hyperlink r:id="${id}">${textXml}</w:hyperlink>`;
  }

  let body = "";

  // ---- Masthead ----
  body += p(`${basics.name} ★`, { bold: true, size: 30, color: INK }, 60);
  body += p(basics.label, { size: 10.5, color: MUTED }, 60);
  body += para(
    contactRows(basics)
      .map((row) => {
        const textXml = run(row.text, { size: 8.5, color: INK });
        return row.href ? addHyperlink(row.href, textXml) : textXml;
      })
      .join(run("   |   ", { size: 8.5, color: RAIL })),
    120
  );
  body += p(summary.intro, { bold: true, size: 10.5, color: MUTED }, 160);

  // ---- Expertise ----
  if (summary.blocks.expertise) {
    body += sectionLabel(summaryBlockLabel("expertise"));
    body += p(summary.blocks.expertise, { size: 9.5, color: BODY }, 60);
    if (summary.emphasis) body += p(summary.emphasis, { bold: true, size: 9.5, color: INK }, 160);
  }

  // ---- Developer Experience ----
  if (filters.sections.work && work.length > 0) {
    body += sectionLabel("Developer Experience");
    for (const entry of work) {
      body += para(run(entry.position, { bold: true, size: 11, color: BLUE }), 20);
      const orgRun = run(`   ${entry.name}`, { bold: true, size: 9.5, color: INK });
      body += para(
        run(formatYearRange(entry.startDate, entry.endDate), {
          bold: true,
          size: 10,
          color: PINK,
        }) +
          (entry.url ? addHyperlink(entry.url, orgRun) : orgRun) +
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
  if (summary.blocks.qualities) {
    body += sectionLabel(summaryBlockLabel("qualities"));
    body += p(summary.blocks.qualities, { size: 9.5, color: BODY }, 100);
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
      const projTitleRun = run(tagline ? `${project.name}: ${tagline}` : project.name, {
        bold: true,
        size: 11,
        color: BLUE,
      });
      body += para(
        (project.url ? addHyperlink(project.url, projTitleRun) : projTitleRun) +
          (project.featured ? run(" ★", { size: 11, color: INK }) : ""),
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
  const { before, after } = footerParts();
  const portfolioHref = footerHref(basics.url);
  const footerLinkRun = run(displayUrl(portfolioHref), { size: 8, color: FOOTER });
  body += para(
    run(before, { size: 8, color: FOOTER }) +
      addHyperlink(portfolioHref, footerLinkRun) +
      run(after, { size: 8, color: FOOTER }),
    0
  );

  const docXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
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

  const linkRels = hyperlinks
    .map(
      (h) =>
        `<Relationship Id="${h.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${escXml(h.url)}" TargetMode="External"/>`
    )
    .join("\n");
  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${linkRels}
</Relationships>`;

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
