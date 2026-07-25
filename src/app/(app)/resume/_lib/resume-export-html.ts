import {
  boldTechTermsHtml,
  buildTechKeywords,
  contactRows,
  type ExportData,
  esc,
  FOOTER_TEXT,
  formatProjectYear,
  formatYearRange,
  getVisibleProjects,
  getVisibleWork,
  isTechLine,
  parseSummary,
  SIGNATURE,
  SIGNATURE_FONT_STACK,
  splitProjectSummary,
  splitTrailingTechList,
} from "./resume-export-shared";

/**
 * "Signature" HTML resume — a faithful systemization of Lacy's handmade
 * Swiss-style resume: giant Helvetica name with a star, pink dates,
 * blue role titles, gray left-rail section labels, three-column grid.
 */
export function buildHtmlContent(data: ExportData): string {
  const { basics, filters } = data;
  const summary = parseSummary(basics.summary);
  const work = getVisibleWork(data);
  const projects = getVisibleProjects(data);
  const keywords = buildTechKeywords(data.skills);
  const bold = (s: string) => boldTechTermsHtml(esc(s), keywords);

  const contact = contactRows(basics)
    .map((row) => {
      const inner = row.href ? `<a href="${esc(row.href)}">${esc(row.text)}</a>` : esc(row.text);
      return `<div class="contact-row">${row.glyph ? `<span class="glyph">${row.glyph}</span>` : `<span class="glyph"></span>`}${inner}</div>`;
    })
    .join("\n");

  const workEntries = work
    .map((entry) => {
      const { body: summaryBody, tech: summaryTech } = splitTrailingTechList(entry.summary ?? "");
      const summaryHtml =
        (summaryBody ? `<p class="entry-summary">${bold(summaryBody)}</p>` : "") +
        (summaryTech
          ? `<p class="entry-summary tech-line"><strong>${esc(summaryTech)}</strong></p>`
          : "");
      const highlights = (entry.highlights ?? []).filter(Boolean);
      const bullets = highlights
        .map((h, i) => {
          const isLast = i === highlights.length - 1;
          if (isLast && isTechLine(h)) return `<li class="tech-line">${bold(h)}</li>`;
          return `<li>${bold(h)}</li>`;
        })
        .join("");
      return `<article class="entry">
	<div class="meta">
		<div class="dates">${esc(formatYearRange(entry.startDate, entry.endDate))}</div>
		<div class="org">${entry.url ? `<a href="${esc(entry.url)}">${esc(entry.name)}</a>` : esc(entry.name)}</div>
		${entry.sector ? `<div class="sector">(${esc(entry.sector)})</div>` : ""}
	</div>
	<div class="detail">
		<h3 class="role">${esc(entry.position)}</h3>
		${summaryHtml}
		${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
	</div>
</article>`;
    })
    .join("\n");

  const projectEntries = projects
    .map((project) => {
      const { tagline, body } = splitProjectSummary(project.summary);
      const star = project.featured ? ` <span class="star">★</span>` : "";
      const title = tagline ? `${esc(project.name)}: ${esc(tagline)}` : esc(project.name);
      const bullets = (project.highlights ?? [])
        .filter(Boolean)
        .map((h) => `<li>${bold(h)}</li>`)
        .join("");
      return `<article class="entry">
	<div class="meta">
		<div class="dates">${esc(formatProjectYear(project.startDate, project.endDate))}</div>
		<div class="org">${project.url ? `<a href="${esc(project.url)}">${esc(project.name)}</a>` : esc(project.name)}${star}</div>
	</div>
	<div class="detail">
		<h3 class="role">${title}</h3>
		${body ? `<p class="entry-summary">${bold(body)}</p>` : ""}
		${bullets ? `<ul class="bullets">${bullets}</ul>` : ""}
	</div>
</article>`;
    })
    .join("\n");

  const personalBlocks: string[] = [];
  if (filters.sections.skills && data.skills.length > 0) {
    const rows = data.skills
      .map(
        (group) =>
          `<div class="skill-row"><span class="skill-name">${esc(group.name)}:</span> ${esc(group.keywords.join(" / "))} <span class="skill-level">: ${esc(group.level)}</span></div>`
      )
      .join("\n");
    personalBlocks.push(subEntry(`<span class="heart">♥</span> TECH<br>STACK`, rows));
  }
  if (filters.sections.interests && data.interests.length > 0) {
    personalBlocks.push(
      subEntry("INTERESTS", `<p>${esc(data.interests.map((i) => i.name).join(", "))}</p>`)
    );
  }
  if (summary.qualities) {
    personalBlocks.push(subEntry("QUALITIES", `<p>${esc(summary.qualities)}</p>`));
  }
  if (filters.sections.education && data.education.length > 0) {
    const rows = data.education
      .map(
        (edu) =>
          `<p><strong>${esc(edu.studyType)} — ${esc(edu.area)}</strong><br><span class="edu-inst">${esc(formatYearRange(edu.startDate, edu.endDate))} | ${esc(edu.institution)}</span></p>`
      )
      .join("\n");
    personalBlocks.push(subEntry("EDUCATION", rows));
  }
  if (filters.sections.awards && data.awards.length > 0) {
    const rows = data.awards
      .map(
        (a) =>
          `<p><strong>${esc(a.title)}</strong> — ${esc(a.awarder)}, ${new Date(a.date).getUTCFullYear()}</p>`
      )
      .join("\n");
    personalBlocks.push(subEntry("AWARDS", rows));
  }

  const referencesBlock =
    filters.sections.references && data.references.length > 0
      ? data.references
          .map(
            (r) =>
              `<blockquote class="reference">&ldquo;${esc(r.reference)}&rdquo;<footer>— ${esc(r.name)}</footer></blockquote>`
          )
          .join("\n")
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(basics.name)} - Resume</title>
<style>
* { box-sizing: border-box; }
body {
	font-family: ${SIGNATURE_FONT_STACK};
	font-size: 9.5pt; line-height: 1.45; color: ${SIGNATURE.body};
	max-width: 8.5in; margin: 0 auto; padding: 0.5in 0.55in 0.7in;
	-webkit-print-color-adjust: exact; print-color-adjust: exact;
}
a { color: inherit; text-decoration: none; }
strong { font-weight: 700; color: ${SIGNATURE.ink}; }

/* ---- Masthead ---- */
.masthead { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; }
h1 {
	font-size: 34pt; line-height: 1; margin: 0; color: ${SIGNATURE.ink};
	font-weight: 800; letter-spacing: -0.02em;
}
h1 .star { font-weight: 400; font-size: 0.82em; }
.tagline { margin-top: 8px; font-size: 10pt; color: ${SIGNATURE.muted}; }
.contact { font-size: 8pt; color: ${SIGNATURE.ink}; line-height: 1.6; white-space: nowrap; padding-top: 4px; }
.contact-row .glyph { display: inline-block; width: 14px; color: ${SIGNATURE.muted}; }
.contact-row a { color: ${SIGNATURE.ink}; }
.lede { margin: 14px 0 0; font-size: 10.5pt; font-weight: 700; color: ${SIGNATURE.muted}; max-width: 6.6in; }

/* ---- Section grid ---- */
section { display: grid; grid-template-columns: 76px 1fr; gap: 0 18px; margin-top: 26px; }
.rail {
	font-size: 8.5pt; font-weight: 700; letter-spacing: 0.14em;
	color: ${SIGNATURE.rail}; text-transform: uppercase; line-height: 1.5; padding-top: 2px;
}
.entries { min-width: 0; }
.entry { display: grid; grid-template-columns: 128px 1fr; gap: 0 16px; margin-bottom: 15px; break-inside: avoid; page-break-inside: avoid; }
.meta { text-align: right; }
.dates { color: ${SIGNATURE.pink}; font-weight: 700; font-size: 10.5pt; }
.org { font-weight: 700; font-size: 9pt; color: ${SIGNATURE.ink}; line-height: 1.35; }
.org a { text-decoration: underline; text-decoration-color: ${SIGNATURE.underline}; text-underline-offset: 2px; }
.org .star { text-decoration: none; font-weight: 400; }
.sector { font-size: 7.5pt; color: ${SIGNATURE.muted}; }
.role { margin: 0 0 3px; font-size: 11pt; font-weight: 700; color: ${SIGNATURE.blue}; line-height: 1.25; }
.entry-summary { margin: 0 0 3px; white-space: pre-wrap; }
.bullets { margin: 0; padding-left: 13px; }
.bullets li { margin-bottom: 2.5px; }
.bullets li::marker { color: ${SIGNATURE.ink}; }
.tech-line, .tech-line strong { color: ${SIGNATURE.ink}; }

/* ---- Personal / sub-labeled blocks ---- */
.sublabel {
	font-size: 8.5pt; font-weight: 700; letter-spacing: 0.12em;
	color: ${SIGNATURE.rail}; text-transform: uppercase; line-height: 1.5;
}
.sublabel .heart { color: ${SIGNATURE.pink}; letter-spacing: 0; }
.skill-row { margin-bottom: 2px; }
.skill-name { font-weight: 700; color: ${SIGNATURE.ink}; }
.skill-level { color: ${SIGNATURE.muted}; font-style: italic; }
.edu-inst { color: ${SIGNATURE.muted}; }
.detail p { margin: 0 0 4px; }

/* ---- References + footer ---- */
.reference { margin: 4px 0 10px; font-style: italic; color: ${SIGNATURE.muted}; }
.reference footer { font-style: normal; margin-top: 3px; color: ${SIGNATURE.ink}; }
.doc-footer {
	margin-top: 34px; text-align: center; font-size: 8pt; color: ${SIGNATURE.footer};
}
.doc-footer a { text-decoration: underline; color: ${SIGNATURE.footer}; }

@page { size: letter; margin: 0.5in 0; }
@media print {
	body { padding: 0 0.55in; max-width: none; }
	section { margin-top: 20px; }
}
</style>
</head>
<body>
<header>
	<div class="masthead">
		<div class="ident">
			<h1>${esc(basics.name)} <span class="star">★</span></h1>
			<div class="tagline">${esc(basics.label)}</div>
		</div>
		<div class="contact">
${contact}
		</div>
	</div>
	<p class="lede">${esc(summary.intro)}</p>
</header>

${
  summary.expertise
    ? `<section>
	<div class="rail">Expertise</div>
	<div class="entries"><div class="entry"><div class="meta"></div><div class="detail">
		<p>${esc(summary.expertise)}</p>
		${summary.interested ? `<p>${bold(summary.interested)}</p>` : ""}
	</div></div></div>
</section>`
    : ""
}

${
  filters.sections.work && work.length > 0
    ? `<section>
	<div class="rail">Developer Experience</div>
	<div class="entries">
${workEntries}
	</div>
</section>`
    : ""
}

${
  personalBlocks.length > 0
    ? `<section>
	<div class="rail">Personal</div>
	<div class="entries">
${personalBlocks.join("\n")}
	</div>
</section>`
    : ""
}

${
  filters.sections.projects && projects.length > 0
    ? `<section>
	<div class="rail">Open-Source</div>
	<div class="entries">
${projectEntries}
	</div>
</section>`
    : ""
}

${
  referencesBlock
    ? `<section>
	<div class="rail">References</div>
	<div class="entries"><div class="entry"><div class="meta"></div><div class="detail">${referencesBlock}</div></div></div>
</section>`
    : ""
}

<footer class="doc-footer">${FOOTER_TEXT.replace(
    "lacymorrow.com",
    `<a href="https://lacymorrow.com">lacymorrow.com</a>`
  )}</footer>
</body></html>`;
}

function subEntry(label: string, detailHtml: string): string {
  return `<article class="entry">
	<div class="meta"><div class="sublabel">${label}</div></div>
	<div class="detail">${detailHtml}</div>
</article>`;
}
