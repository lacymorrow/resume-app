import { resumeConfig } from "../inputs";
import { resumeData } from "./data";
import { contactRows, formatProjectYear, formatYearRange } from "./export-shared";
import { DEFAULT_FILTER_STATE, resolveProjects, resolveWork } from "./filters";
import { FLAVORS, findFlavor } from "./flavors";
import { flavorHref } from "./routes";
import { buildSections } from "./sections";

/**
 * The resume as plain Markdown.
 *
 * The page is the artefact for a person and the PDF is the artefact for an
 * applicant tracking system; this is the artefact for anything that reads
 * rather than renders — an LLM summarising a candidate, a crawler building a
 * snippet, a reader with `curl`. It goes through the same flavor resolution and
 * the same section registry as the screen, so it cannot describe a resume the
 * site does not serve.
 */

const HOST = resumeConfig.site.host;
const SITE_URL = `https://${HOST}`;

/** Strips the `<em>` runs a flavor headline uses for accented words. */
function plain(html: string): string {
  return html.replace(/<\/?em>/g, "");
}

function dateRange(start?: string, end?: string): string {
  return start ? formatYearRange(start, end) : "";
}

function heading(title: string, level = 2): string {
  return `${"#".repeat(level)} ${title}`;
}

/** One flavor rendered as a complete Markdown document. */
export function resumeMarkdown(flavorId: string): string {
  const flavor = findFlavor(flavorId);
  const data = resumeData;
  const filters = { ...DEFAULT_FILTER_STATE, flavorId: flavor.id };

  const { entries: work } = resolveWork(data, flavor, filters);
  const { entries: projects } = resolveProjects(data, flavor, filters);
  const sections = buildSections(data, { work, projects }, flavor.sections);

  const out: string[] = [];

  out.push(`# ${data.basics.name}`);
  out.push("");
  out.push(`> ${flavor.tagline}`);
  out.push("");

  if (flavor.statement.headline) {
    out.push(plain(flavor.statement.headline));
    if (flavor.statement.sub) {
      out.push("");
      out.push(flavor.statement.sub);
    }
    out.push("");
  }

  out.push(heading("Contact"));
  for (const row of contactRows(data.basics)) {
    out.push(`- ${row.href ? `[${row.text}](${row.href})` : row.text}`);
  }
  const bases = [data.basics.location, ...(data.basics.location.also ?? [])]
    .map((l) => [l.city, l.state].filter(Boolean).join(", "))
    .filter(Boolean);
  if (bases.length > 0) out.push(`- Based in ${bases.join(" and ")}`);
  out.push("");

  out.push(heading("Expertise"));
  out.push(flavor.expertise);
  out.push("");

  for (const section of sections) {
    out.push(heading(section.label));
    out.push("");

    switch (section.renderer) {
      case "timeline":
        for (const item of section.items) {
          const when = dateRange(item.startDate, item.endDate);
          out.push(
            heading(
              [item.title, item.org].filter(Boolean).join(" — ") + (when ? ` (${when})` : ""),
              3
            )
          );
          if (item.url) out.push(item.url);
          if (item.summary) out.push(item.summary);
          for (const highlight of item.highlights ?? []) out.push(`- ${highlight}`);
          out.push("");
        }
        break;

      case "projects":
        for (const item of section.items) {
          const when = formatProjectYear(item.startDate ?? "", item.endDate);
          out.push(heading(item.name + (when ? ` (${when})` : ""), 3));
          if (item.url) out.push(item.url);
          if (item.summary) out.push(item.summary);
          out.push("");
        }
        break;

      case "keywords":
        for (const item of section.items) {
          const label = [item.name, item.detail].filter(Boolean).join(" — ");
          out.push(`- **${label}**${item.keywords.length ? `: ${item.keywords.join(", ")}` : ""}`);
        }
        out.push("");
        break;

      case "credentials":
        for (const item of section.items) {
          const when = dateRange(item.startDate, item.endDate);
          out.push(
            heading(
              [item.title, item.subtitle].filter(Boolean).join(" — ") + (when ? ` (${when})` : ""),
              3
            )
          );
          if (item.summary) out.push(item.summary);
          for (const detail of item.details ?? []) out.push(`- ${detail}`);
          out.push("");
        }
        break;

      case "quotes":
        for (const item of section.items) {
          out.push(`> ${item.quote}`);
          out.push(`> — ${item.attribution}`);
          out.push("");
        }
        break;
    }
  }

  return `${out
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()}\n`;
}

/** The short index: what this site is and where every version of it lives. */
export function llmsIndex(): string {
  const { basics } = resumeData;
  const rows = FLAVORS.map(
    (f) => `- [${f.label}](${SITE_URL}${flavorHref(f.id)}): ${f.description}. ${f.tagline}`
  );

  return `# ${basics.name}

> ${basics.label}

${HOST} is the interactive resume of ${basics.name}. One resume, cut several ways: each link below is the same career described for a different role, as its own page.

## Versions
${rows.join("\n")}

## Full text
- [Complete resume as Markdown](${SITE_URL}/llms-full.txt)

Every page also exports itself as PDF, DOCX, or standalone HTML from the controls in the sidebar, and can be tuned in the browser — hide a role, filter by the tools a job actually asks for — with the result carried in the URL.

## Contact
${contactRows(basics)
  .map((row) => `- ${row.text}${row.href ? ` (${row.href})` : ""}`)
  .join("\n")}
`;
}
