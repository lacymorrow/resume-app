/**
 * Contact-row icons for the Signature resume — real brand marks (GitHub,
 * LinkedIn, X) plus simple filled glyphs for phone/email/site, shared by the
 * HTML export (inline SVG) and the PDF export (vector paths via jsPDF).
 *
 * Brand marks are the official simple-icons/bootstrap-icons path data; the
 * phone/email/home glyphs are Material filled icons. All are single `d`
 * strings that render correctly with the even-odd fill rule.
 */

export type ContactKind = "phone" | "email" | "website" | "github" | "linkedin" | "x";

interface ContactIcon {
  d: string;
  viewBox: number;
}

export const CONTACT_ICONS: Record<ContactKind, ContactIcon> = {
  phone: {
    viewBox: 24,
    d: "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z",
  },
  email: {
    viewBox: 24,
    d: "M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z",
  },
  website: {
    viewBox: 24,
    d: "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z",
  },
  github: {
    viewBox: 24,
    d: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  linkedin: {
    viewBox: 16,
    d: "M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854zm4.943 12.248V6.169H2.542v7.225zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248S2.4 3.226 2.4 3.934c0 .694.521 1.248 1.327 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016l.016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225z",
  },
  x: {
    viewBox: 24,
    d: "M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z",
  },
};

/** Inline SVG for the HTML export / browser rendering. */
export function contactIconSvg(kind: ContactKind, size: number, color: string): string {
  const { d, viewBox } = CONTACT_ICONS[kind];
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${viewBox} ${viewBox}" aria-hidden="true"><path fill="${color}" fill-rule="evenodd" d="${d}"/></svg>`;
}

export interface IconPathOp {
  op: "m" | "l" | "c" | "h";
  c: number[];
}

const CMD_RE = /^[MmLlHhVvCcSsZz]$/;

/**
 * Convert an icon's SVG path into absolute jsPDF `path()` ops, translated to
 * (x, y) and scaled to `size`. Supports the command subset used by the icons
 * above (M/L/H/V/C/S/Z, absolute + relative, implicit repeats) — no arcs.
 */
export function iconPathOps(kind: ContactKind, x: number, y: number, size: number): IconPathOp[] {
  const { d, viewBox } = CONTACT_ICONS[kind];
  const k = size / viewBox;
  const tokens = d.match(/[MmLlHhVvCcSsZz]|-?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const ops: IconPathOp[] = [];
  let i = 0;
  let cmd = "M";
  let cx = 0; // current point, viewBox coordinates
  let cy = 0;
  let sx = 0; // subpath start, for Z
  let sy = 0;
  let pcx: number | null = null; // previous cubic control point, for S
  let pcy: number | null = null;

  const num = () => Number.parseFloat(tokens[i++] ?? "0");
  const px = (v: number) => x + v * k;
  const py = (v: number) => y + v * k;

  while (i < tokens.length) {
    if (CMD_RE.test(tokens[i]!)) cmd = tokens[i++]!;
    const rel = cmd === cmd.toLowerCase();
    switch (cmd.toUpperCase()) {
      case "M": {
        cx = num() + (rel ? cx : 0);
        cy = num() + (rel ? cy : 0);
        sx = cx;
        sy = cy;
        ops.push({ op: "m", c: [px(cx), py(cy)] });
        pcx = pcy = null;
        cmd = rel ? "l" : "L"; // subsequent coordinate pairs are implicit linetos
        break;
      }
      case "L": {
        cx = num() + (rel ? cx : 0);
        cy = num() + (rel ? cy : 0);
        ops.push({ op: "l", c: [px(cx), py(cy)] });
        pcx = pcy = null;
        break;
      }
      case "H": {
        cx = num() + (rel ? cx : 0);
        ops.push({ op: "l", c: [px(cx), py(cy)] });
        pcx = pcy = null;
        break;
      }
      case "V": {
        cy = num() + (rel ? cy : 0);
        ops.push({ op: "l", c: [px(cx), py(cy)] });
        pcx = pcy = null;
        break;
      }
      case "C": {
        const x1 = num() + (rel ? cx : 0);
        const y1 = num() + (rel ? cy : 0);
        const x2 = num() + (rel ? cx : 0);
        const y2 = num() + (rel ? cy : 0);
        cx = num() + (rel ? cx : 0);
        cy = num() + (rel ? cy : 0);
        ops.push({ op: "c", c: [px(x1), py(y1), px(x2), py(y2), px(cx), py(cy)] });
        pcx = x2;
        pcy = y2;
        break;
      }
      case "S": {
        // Reflected first control point when the previous segment was a cubic
        const x1 = pcx === null ? cx : 2 * cx - pcx;
        const y1 = pcy === null ? cy : 2 * cy - (pcy ?? cy);
        const x2 = num() + (rel ? cx : 0);
        const y2 = num() + (rel ? cy : 0);
        cx = num() + (rel ? cx : 0);
        cy = num() + (rel ? cy : 0);
        ops.push({ op: "c", c: [px(x1), py(y1), px(x2), py(y2), px(cx), py(cy)] });
        pcx = x2;
        pcy = y2;
        break;
      }
      case "Z": {
        ops.push({ op: "h", c: [] });
        cx = sx;
        cy = sy;
        pcx = pcy = null;
        break;
      }
    }
  }
  return ops;
}
