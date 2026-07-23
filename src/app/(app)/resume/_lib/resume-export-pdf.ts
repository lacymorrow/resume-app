import type { jsPDF } from "jspdf";
import {
  contactRows,
  type ExportData,
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

// Letter page geometry (points). Three columns like the handmade resume:
// gray rail labels | right-aligned pink dates + companies | content.
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 46;
const RAIL_X = MARGIN;
const META_RIGHT = 244;
const META_W = 112;
const CONTENT_X = 260;
const CONTENT_RIGHT = PAGE_W - MARGIN;
const CONTENT_W = CONTENT_RIGHT - CONTENT_X;
const FOOTER_Y = PAGE_H - 26;
const BOTTOM = PAGE_H - 56;

const LINE_BODY = 10.5;
const LINE_META = 11;
const LINE_ROLE = 13;

type Rgb = [number, number, number];

function rgb(hex: string): Rgb {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const INK = rgb(SIGNATURE.ink);
const BODY = rgb(SIGNATURE.body);
const MUTED = rgb(SIGNATURE.muted);
const RAIL = rgb(SIGNATURE.rail);
const PINK = rgb(SIGNATURE.pink);
const BLUE = rgb(SIGNATURE.blue);
const UNDERLINE = rgb(SIGNATURE.underline);
const FOOTER = rgb(SIGNATURE.footer);

/** Five-point star as a filled vector path (helvetica has no ★ glyph). */
function drawStar(doc: jsPDF, cx: number, cy: number, r: number, color: Rgb) {
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? r : r * 0.44;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)]);
  }
  const deltas: [number, number][] = [];
  for (let i = 1; i < pts.length; i++) {
    deltas.push([pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]]);
  }
  doc.setFillColor(...color);
  doc.lines(deltas, pts[0]![0], pts[0]![1], [1, 1], "F", true);
}

/** Small filled heart: two circles + a triangle. */
function drawHeart(doc: jsPDF, cx: number, cy: number, r: number, color: Rgb) {
  doc.setFillColor(...color);
  doc.circle(cx - r * 0.5, cy - r * 0.25, r * 0.55, "F");
  doc.circle(cx + r * 0.5, cy - r * 0.25, r * 0.55, "F");
  doc.triangle(cx - r * 1.02, cy, cx + r * 1.02, cy, cx, cy + r * 1.15, "F");
}

interface Cursor {
  y: number;
}

function setStyle(doc: jsPDF, size: number, style: "normal" | "bold" | "italic", color: Rgb) {
  doc.setFontSize(size);
  doc.setFont("helvetica", style === "bold" ? "bold" : style === "italic" ? "italic" : "normal");
  doc.setTextColor(...color);
}

function newPage(doc: jsPDF, cur: Cursor) {
  doc.addPage();
  cur.y = MARGIN + 6;
}

function ensure(doc: jsPDF, cur: Cursor, needed: number) {
  if (cur.y + needed > BOTTOM) newPage(doc, cur);
}

/** Rail label, one word per line, letterspaced gray caps. */
function drawRail(doc: jsPDF, cur: Cursor, label: string) {
  setStyle(doc, 8.5, "bold", RAIL);
  let y = cur.y;
  for (const word of label.toUpperCase().split(" ")) {
    doc.text(word, RAIL_X, y, { charSpace: 0.9 });
    y += 11;
  }
}

/** Bold prefix + normal continuation, wrapped with hanging alignment. */
function drawLabeled(
  doc: jsPDF,
  cur: Cursor,
  prefix: string,
  rest: string,
  size: number,
  prefixColor: Rgb,
  restColor: Rgb,
  suffix?: string
) {
  setStyle(doc, size, "bold", prefixColor);
  const prefixW = doc.getTextWidth(`${prefix} `);
  setStyle(doc, size, "normal", restColor);
  const full = suffix ? `${rest}  : ${suffix}` : rest;
  const firstWidth = CONTENT_W - prefixW;
  const firstParts = doc.splitTextToSize(full, firstWidth) as string[];
  const firstLine = firstParts[0] ?? "";
  const remaining = full.slice(firstLine.length).trimStart();
  const contLines = remaining ? (doc.splitTextToSize(remaining, CONTENT_W) as string[]) : [];
  ensure(doc, cur, (1 + contLines.length) * LINE_BODY);
  setStyle(doc, size, "bold", prefixColor);
  doc.text(prefix, CONTENT_X, cur.y);
  setStyle(doc, size, "normal", restColor);
  doc.text(firstLine, CONTENT_X + prefixW, cur.y);
  cur.y += LINE_BODY;
  for (const line of contLines) {
    ensure(doc, cur, LINE_BODY);
    doc.text(line, CONTENT_X, cur.y);
    cur.y += LINE_BODY;
  }
}

interface MetaBlock {
  dates: string;
  org?: string;
  orgUrl?: string;
  sector?: string;
  starred?: boolean;
}

/** Right-aligned meta column: pink dates, bold underlined org, optional star. */
function drawMeta(doc: jsPDF, topY: number, meta: MetaBlock): number {
  let y = topY;
  setStyle(doc, 10.5, "bold", PINK);
  doc.text(meta.dates, META_RIGHT, y, { align: "right" });
  y += LINE_META;
  if (meta.org) {
    setStyle(doc, 9, "bold", INK);
    const starGap = meta.starred ? 12 : 0;
    const lines = doc.splitTextToSize(meta.org, META_W - starGap) as string[];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const isLast = i === lines.length - 1;
      const rightEdge = META_RIGHT - (isLast ? starGap : 0);
      doc.text(line, rightEdge, y, { align: "right" });
      if (meta.orgUrl) {
        const w = doc.getTextWidth(line);
        doc.setDrawColor(...UNDERLINE);
        doc.setLineWidth(0.6);
        doc.line(rightEdge - w, y + 1.6, rightEdge, y + 1.6);
      }
      if (isLast && meta.starred) drawStar(doc, META_RIGHT - 5, y - 3, 4.6, INK);
      y += LINE_META;
    }
  }
  if (meta.sector) {
    setStyle(doc, 7.5, "normal", MUTED);
    doc.text(`(${meta.sector})`, META_RIGHT, y, { align: "right" });
    y += LINE_META;
  }
  return y - topY;
}

interface EntryBlock {
  meta: MetaBlock;
  title: string;
  summary?: string;
  highlights?: string[];
  boldLastTechLine?: boolean;
}

function drawEntry(doc: jsPDF, cur: Cursor, entry: EntryBlock) {
  setStyle(doc, 11, "bold", BLUE);
  const titleLines = doc.splitTextToSize(entry.title, CONTENT_W) as string[];
  setStyle(doc, 9, "normal", BODY);
  const { body: summaryBody, tech: summaryTech } = entry.summary
    ? splitTrailingTechList(entry.summary)
    : { body: "", tech: null };
  const summaryLines = summaryBody ? (doc.splitTextToSize(summaryBody, CONTENT_W) as string[]) : [];
  const techLines = summaryTech ? (doc.splitTextToSize(summaryTech, CONTENT_W) as string[]) : [];
  const highlights = (entry.highlights ?? []).filter(Boolean);
  const bulletLines = highlights.map((h) => doc.splitTextToSize(h, CONTENT_W - 11) as string[]);

  const contentH =
    titleLines.length * LINE_ROLE +
    (summaryLines.length + techLines.length) * LINE_BODY +
    bulletLines.reduce((acc, lines) => acc + lines.length * LINE_BODY, 0) +
    2;
  const metaH = 2 * LINE_META + (entry.meta.sector ? LINE_META : 0);
  ensure(doc, cur, Math.min(Math.max(contentH, metaH) + 4, BOTTOM - MARGIN - 20));

  const topY = cur.y;
  const metaHeight = drawMeta(doc, topY, entry.meta);

  setStyle(doc, 11, "bold", BLUE);
  for (const line of titleLines) {
    doc.text(line, CONTENT_X, cur.y);
    cur.y += LINE_ROLE;
  }
  setStyle(doc, 9, "normal", BODY);
  for (const line of summaryLines) {
    ensure(doc, cur, LINE_BODY);
    doc.text(line, CONTENT_X, cur.y);
    cur.y += LINE_BODY;
  }
  if (techLines.length > 0) {
    setStyle(doc, 9, "bold", INK);
    for (const line of techLines) {
      ensure(doc, cur, LINE_BODY);
      doc.text(line, CONTENT_X, cur.y);
      cur.y += LINE_BODY;
    }
  }
  for (let i = 0; i < bulletLines.length; i++) {
    const isTech =
      entry.boldLastTechLine && i === highlights.length - 1 && isTechLine(highlights[i]!);
    setStyle(doc, 9, isTech ? "bold" : "normal", isTech ? INK : BODY);
    const lines = bulletLines[i]!;
    for (let j = 0; j < lines.length; j++) {
      ensure(doc, cur, LINE_BODY);
      if (j === 0) doc.text("•", CONTENT_X + 1, cur.y);
      doc.text(lines[j]!, CONTENT_X + 11, cur.y);
      cur.y += LINE_BODY;
    }
  }
  cur.y = Math.max(cur.y, topY + metaHeight) + 9;
}

/** Sub-labeled personal block: gray caps label in the meta column. */
function drawSubLabel(doc: jsPDF, topY: number, label: string, withHeart?: boolean) {
  setStyle(doc, 8.5, "bold", RAIL);
  const words = label.split(" ");
  let y = topY;
  for (let i = 0; i < words.length; i++) {
    doc.text(words[i]!, META_RIGHT, y, { align: "right", charSpace: 0.8 });
    if (i === 0 && withHeart) {
      const w = doc.getTextWidth(words[i]!) + words[i]!.length * 0.8;
      drawHeart(doc, META_RIGHT - w - 10, y - 3, 4.5, PINK);
    }
    y += 11;
  }
}

export async function buildPdfDoc(data: ExportData): Promise<jsPDF> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const cur: Cursor = { y: 0 };

  const { basics, filters } = data;
  const summary = parseSummary(basics.summary);
  const work = getVisibleWork(data);
  const projects = getVisibleProjects(data);

  // ---- Masthead: giant name + star, contact block right ----
  setStyle(doc, 33, "bold", INK);
  const nameY = MARGIN + 28;
  doc.text(basics.name, MARGIN, nameY);
  drawStar(doc, MARGIN + doc.getTextWidth(basics.name) + 16, nameY - 10, 10, INK);

  setStyle(doc, 8, "normal", INK);
  let contactY = MARGIN + 4;
  for (const row of contactRows(basics)) {
    doc.text(row.text, CONTENT_RIGHT, contactY, { align: "right" });
    contactY += 10.5;
  }

  setStyle(doc, 10, "normal", MUTED);
  cur.y = nameY + 17;
  doc.text(doc.splitTextToSize(basics.label, 380) as string[], MARGIN, cur.y);
  cur.y += 20;

  setStyle(doc, 10.5, "bold", MUTED);
  const ledeLines = doc.splitTextToSize(summary.intro, CONTENT_RIGHT - MARGIN - 40) as string[];
  doc.text(ledeLines, MARGIN, cur.y);
  cur.y += ledeLines.length * 13;

  // ---- EXPERTISE ----
  if (summary.expertise) {
    cur.y += 16;
    drawRail(doc, cur, "Expertise");
    setStyle(doc, 9, "normal", BODY);
    const lines = doc.splitTextToSize(summary.expertise, CONTENT_W) as string[];
    for (const line of lines) {
      ensure(doc, cur, LINE_BODY);
      doc.text(line, CONTENT_X, cur.y);
      cur.y += LINE_BODY;
    }
    if (summary.interested) {
      cur.y += 4;
      setStyle(doc, 9, "bold", INK);
      const iLines = doc.splitTextToSize(summary.interested, CONTENT_W) as string[];
      for (const line of iLines) {
        ensure(doc, cur, LINE_BODY);
        doc.text(line, CONTENT_X, cur.y);
        cur.y += LINE_BODY;
      }
    }
  }

  // ---- DEVELOPER EXPERIENCE ----
  if (filters.sections.work && work.length > 0) {
    cur.y += 18;
    ensure(doc, cur, 70);
    drawRail(doc, cur, "Developer Experience");
    for (const entry of work) {
      drawEntry(doc, cur, {
        meta: {
          dates: formatYearRange(entry.startDate, entry.endDate),
          org: entry.name,
          orgUrl: entry.url,
          sector: entry.sector,
        },
        title: entry.position,
        summary: entry.summary,
        highlights: entry.highlights,
        boldLastTechLine: true,
      });
    }
  }

  // ---- PERSONAL ----
  const showPersonal =
    (filters.sections.skills && data.skills.length > 0) ||
    (filters.sections.interests && data.interests.length > 0) ||
    (filters.sections.education && data.education.length > 0) ||
    (filters.sections.awards && data.awards.length > 0);
  if (showPersonal) {
    cur.y += 18;
    ensure(doc, cur, 80);
    drawRail(doc, cur, "Personal");
    if (filters.sections.skills && data.skills.length > 0) {
      drawSubLabel(doc, cur.y, "TECH STACK", true);
      for (const group of data.skills) {
        drawLabeled(
          doc,
          cur,
          `${group.name}:`,
          group.keywords.join(" / "),
          9,
          INK,
          BODY,
          group.level
        );
      }
      cur.y += 8;
    }
    if (filters.sections.interests && data.interests.length > 0) {
      ensure(doc, cur, 30);
      drawSubLabel(doc, cur.y, "INTERESTS");
      setStyle(doc, 9, "normal", BODY);
      const lines = doc.splitTextToSize(
        data.interests.map((i) => i.name).join(", "),
        CONTENT_W
      ) as string[];
      for (const line of lines) {
        ensure(doc, cur, LINE_BODY);
        doc.text(line, CONTENT_X, cur.y);
        cur.y += LINE_BODY;
      }
      cur.y += 8;
    }
    if (summary.qualities) {
      ensure(doc, cur, 30);
      drawSubLabel(doc, cur.y, "QUALITIES");
      setStyle(doc, 9, "normal", BODY);
      const lines = doc.splitTextToSize(summary.qualities, CONTENT_W) as string[];
      for (const line of lines) {
        ensure(doc, cur, LINE_BODY);
        doc.text(line, CONTENT_X, cur.y);
        cur.y += LINE_BODY;
      }
      cur.y += 8;
    }
    if (filters.sections.education && data.education.length > 0) {
      ensure(doc, cur, 34);
      drawSubLabel(doc, cur.y, "EDUCATION");
      for (const edu of data.education) {
        setStyle(doc, 9.5, "bold", INK);
        doc.text(`${edu.studyType} — ${edu.area}`, CONTENT_X, cur.y);
        cur.y += LINE_BODY;
        setStyle(doc, 9, "normal", MUTED);
        doc.text(
          `${formatYearRange(edu.startDate, edu.endDate)} | ${edu.institution}`,
          CONTENT_X,
          cur.y
        );
        cur.y += LINE_BODY;
      }
      cur.y += 8;
    }
    if (filters.sections.awards && data.awards.length > 0) {
      ensure(doc, cur, 24);
      drawSubLabel(doc, cur.y, "AWARDS");
      for (const award of data.awards) {
        setStyle(doc, 9, "normal", BODY);
        doc.setFont("helvetica", "bold");
        const title = award.title;
        const rest = ` — ${award.awarder}, ${new Date(award.date).getUTCFullYear()}`;
        doc.setTextColor(...INK);
        doc.text(title, CONTENT_X, cur.y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...BODY);
        doc.text(rest, CONTENT_X + doc.getTextWidth(title) + 2, cur.y);
        cur.y += LINE_BODY;
      }
      cur.y += 8;
    }
  }

  // ---- OPEN-SOURCE ----
  if (filters.sections.projects && projects.length > 0) {
    cur.y += 18;
    ensure(doc, cur, 70);
    drawRail(doc, cur, "Open-Source");
    for (const project of projects) {
      const { tagline, body } = splitProjectSummary(project.summary);
      drawEntry(doc, cur, {
        meta: {
          dates: formatProjectYear(project.startDate, project.endDate),
          org: project.name,
          orgUrl: project.url,
          starred: project.featured,
        },
        title: tagline ? `${project.name}: ${tagline}` : project.name,
        summary: body || undefined,
        highlights: project.highlights,
      });
    }
  }

  // ---- REFERENCES ----
  if (filters.sections.references && data.references.length > 0) {
    cur.y += 18;
    ensure(doc, cur, 60);
    drawRail(doc, cur, "References");
    for (const ref of data.references) {
      setStyle(doc, 9, "italic", MUTED);
      const lines = doc.splitTextToSize(`“${ref.reference}”`, CONTENT_W) as string[];
      for (const line of lines) {
        ensure(doc, cur, LINE_BODY);
        doc.text(line, CONTENT_X, cur.y);
        cur.y += LINE_BODY;
      }
      setStyle(doc, 9, "normal", INK);
      ensure(doc, cur, LINE_BODY);
      doc.text(`— ${ref.name}`, CONTENT_X, cur.y);
      cur.y += LINE_BODY + 6;
    }
  }

  // ---- Footer on every page ----
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    setStyle(doc, 8, "normal", FOOTER);
    doc.text(FOOTER_TEXT, PAGE_W / 2, FOOTER_Y, { align: "center" });
  }

  return doc;
}

export async function exportPdf(data: ExportData, filename: string) {
  const doc = await buildPdfDoc(data);
  doc.save(`${filename}.pdf`);
}
