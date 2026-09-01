/**
 * Everything about *this* resume that is not resume data itself.
 *
 * Anything a different person would have to change to run their own copy lives
 * here — not inline in a component, a renderer, or an exporter. If you are
 * forking this, this file plus resume.json should be the only two you need to
 * touch to make it yours.
 */

/** One labeled paragraph parsed out of `basics.summary`. */
export interface SummaryBlock {
  /** Stable key renderers reference. */
  key: string;
  /** Heading shown above the block in exports that label it. */
  label: string;
  /** Literal prefix that marks the paragraph inside `basics.summary`. */
  marker: string;
}

export interface ScreenTheme {
  bg: string;
  ink: string;
  dim: string;
  hairline: string;
  lift: string;
  fontSans: string;
  fontSerif: string;
}

/**
 * Palette for anything that lands on paper. Deliberately light: a dark PDF is
 * unprintable and burns a cartridge.
 */
export interface PrintTheme {
  ink: string;
  body: string;
  muted: string;
  rail: string;
  underline: string;
  accent: string;
  heading: string;
  footer: string;
  fontStack: string;
}

export interface PageGeometry {
  /** Width and height in PostScript points. */
  width: number;
  height: number;
  margin: number;
}

/** US Letter and A4 in points, so exports are correct outside the US. */
export const PAGE_SIZES = {
  letter: { width: 612, height: 792, margin: 46 },
  a4: { width: 595.28, height: 841.89, margin: 46 },
} as const satisfies Record<string, PageGeometry>;

export interface ResumeConfig {
  site: {
    /** Shown in the on-screen footer beside the name. */
    host: string;
    /**
     * Optional URL segment flavors are served under: "" gives /frontend,
     * "r" gives /r/frontend. The default flavor is always served at "/".
     *
     * Empty means flavors occupy the root namespace, so any single-segment
     * path that is not a flavor 404s. Set a prefix if the site also needs
     * root-level pages of its own (a CMS catch-all, for instance).
     *
     * Changing this means renaming the route folder to match: App Router
     * directory names are static, so this constant and the folder have to
     * agree. `bun run validate:resume` checks that they do.
     */
    flavorPrefix: string;
  };
  footer: {
    /** `{link}` is replaced with a link to the portfolio URL. */
    text: string;
    /** Falls back to `basics.url` when empty. */
    linkHref: string;
  };
  data: {
    /**
     * Work entries hidden from every flavor. Use for self-referential entries
     * (your own site) that belong in the data but not on the resume.
     */
    excludeWork: string[];
  };
  dates: {
    /**
     * How an open-ended role renders. "current-year" gives "2025 - 2026";
     * any other string is used literally, e.g. "Present".
     */
    ongoing: "current-year" | string;
  };
  summary: {
    blocks: SummaryBlock[];
    /** A paragraph matching this renders emphasized under the intro. */
    emphasisPattern: string;
  };
  page: PageGeometry;
  theme: {
    screen: ScreenTheme;
    print: PrintTheme;
  };
}

export const resumeConfig: ResumeConfig = {
  site: {
    host: "resume.lacy.sh",
    flavorPrefix: "",
  },

  footer: {
    text: "References available upon request. For a complete portfolio please visit {link}",
    linkHref: "",
  },

  data: {
    excludeWork: ["LacyMorrow.com"],
  },

  dates: {
    ongoing: "current-year",
  },

  summary: {
    blocks: [
      { key: "expertise", label: "Expertise", marker: "EXPERTISE:" },
      { key: "qualities", label: "Qualities", marker: "QUALITIES:" },
    ],
    emphasisPattern: "^I (especially|particularly)",
  },

  page: PAGE_SIZES.letter,

  theme: {
    screen: {
      bg: "#0E0D0B",
      ink: "#EDEAE3",
      dim: "#8A867C",
      hairline: "rgba(237, 234, 227, 0.12)",
      lift: "rgba(237, 234, 227, 0.045)",
      fontSans: "var(--font-instrument-sans), 'Instrument Sans', system-ui, sans-serif",
      fontSerif: "var(--font-instrument-serif), 'Instrument Serif', Georgia, serif",
    },

    // Sampled from a handmade Swiss-style resume: warm grays for structure,
    // a hot accent for dates, a cool one for role titles.
    print: {
      ink: "#3f4041",
      body: "#404042",
      muted: "#77787b",
      rail: "#b9bbbd",
      underline: "#9a9ca0",
      accent: "#e8308a",
      heading: "#29a5df",
      footer: "#8a8c90",
      fontStack: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    },
  },
};
