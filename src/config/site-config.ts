import type { Metadata } from "next";
import type { Manifest } from "next/dist/lib/metadata/types/manifest-types";
// These imports must be relative: next.config loads this file (through
// base-url.ts) before the TS path aliases are available.
import { resumeConfig } from "../resume/inputs";
import { resumeData } from "../resume/lib/data";

/**
 * Site Configuration
 *
 * Central configuration for site-wide settings, branding, and metadata.
 * Used throughout the application for consistent branding and functionality.
 *
 * Identity — the name, the host, the contact details, the social profiles — is
 * read from resume.json and resume.config.ts rather than repeated here. Those
 * two files are the fork contract, and a name that has to be kept in step in a
 * third place is a name that eventually disagrees with itself.
 */

const { basics } = resumeData;

/** A profile URL from `basics.profiles`, matched case-insensitively. */
const profile = (network: string): string =>
  basics.profiles?.find((p) => p.network.toLowerCase() === network.toLowerCase())?.url ?? "";

/** A profile handle, for the places that want "@name" rather than a URL. */
const handle = (network: string): string =>
  basics.profiles?.find((p) => p.network.toLowerCase() === network.toLowerCase())?.username ?? "";

const SITE_URL = `https://${resumeConfig.site.host}`;

/** "San Francisco, CA · Charlotte, NC" — every base the resume lists. */
const BASES = [basics.location, ...(basics.location.also ?? [])]
  .map((l) => [l.city, l.state].filter(Boolean).join(", "))
  .filter(Boolean)
  .join(" · ");
const EMAIL_DOMAIN = basics.email?.split("@")[1] ?? resumeConfig.site.host;

interface ManifestConfig {
  startUrl: string;
  display: Manifest["display"];
  displayOverride?: Manifest["display_override"];
  orientation: Manifest["orientation"];
  categories: Manifest["categories"];
  dir: Manifest["dir"];
  lang: Manifest["lang"];
  preferRelatedApplications: Manifest["prefer_related_applications"];
  scope: Manifest["scope"];
  launchHandler?: Manifest["launch_handler"];
  icons: {
    favicon: string;
    appIcon192: string;
    appIcon512: string;
  };
  relatedApplications?: Manifest["related_applications"];
}

interface PayloadConfig {
  adminTitleSuffix: string;
  adminIconPath: string;
  adminLogoPath: string;
  dbSchemaName: string;
  emailFromName: string;
}

interface SiteConfig {
  // Core site information
  name: string;
  title: string;
  url: string;
  ogImage: string;
  description: string;
  tagline: string;
  // UI behavior settings
  behavior: {
    pageTransitions: boolean;
  };

  // Branding information
  branding: {
    projectName: string;
    projectSlug: string;
    productNames: {
      // TODO: Remove these once we have a proper product name
      bones: string;
      brains: string;
      main: string;
    };
    domain: string;
    protocol: string;
    githubOrg: string;
    githubRepo: string;
    vercelProjectName: string;
    databaseName: string;
  };

  // External links
  links: {
    twitter: string;
    twitter_follow: string;
    x: string;
    x_follow: string;
    github: string;
  };

  // Social profiles (single source of truth for top networks)
  /**
   * Centralized social links for the project/org. Empty strings mean "disabled".
   * Use helper utilities to get an enabled list for rendering.
   */
  social: {
    github?: string;
    twitter?: string;
    x?: string;
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    youtube?: string;
    tiktok?: string;
    discord?: string;
    dribbble?: string;
    threads?: string;
  };

  // Repository information
  repo: {
    owner: string;
    name: string;
    url: string;
    format: {
      clone: () => string;
      ssh: () => string;
    };
  };

  // Email addresses and formatting
  email: {
    support: string;
    team: string;
    noreply: string;
    domain: string;
    legal: string;
    privacy: string;
    format: (type: Exclude<keyof SiteConfig["email"], "format">) => string;
  };

  // Creator information
  creator: {
    name: string;
    email: string;
    url: string;
    twitter: string;
    twitter_handle: string;
    domain: string;
    fullName: string;
    role: string;
    avatar: string;
    location: string;
    bio: string;
  };

  // E-commerce store configuration
  store: {
    id: string;
    products: Record<string, string>;
  };

  // SEO and metadata
  metadata: {
    keywords: string[];
    themeColor: {
      light: string;
      dark: string;
    };
    locale: string;
    generator: string;
    referrer: Metadata["referrer"];
    category: string;
    classification: string;
    openGraph: {
      imageWidth: number;
      imageHeight: number;
    };
    twitter: {
      card: "summary" | "summary_large_image" | "app" | "player";
    };
    robots: Metadata["robots"];
    formatDetection: Metadata["formatDetection"];
    alternates: Metadata["alternates"];
    appleWebApp: Metadata["appleWebApp"];
    appLinks: Metadata["appLinks"];
    assetsPath: string;
    bookmarksPath: string;
    blogPath?: string;
  };

  // Application settings
  app: {
    apiKeyPrefix: string;
  };

  // PWA Manifest settings
  manifest: ManifestConfig;

  // Payload CMS settings
  payload: PayloadConfig;
}

// Use 'let' to allow modification after definition
export const siteConfig: SiteConfig = {
  behavior: {
    pageTransitions: true,
  },

  name: basics.name,
  title: basics.name,
  tagline: basics.label,
  url: SITE_URL,
  /**
   * Not the social card. The cards are generated per flavor by the file-based
   * opengraph-image routes; this is the one path that has to be a literal, for
   * the Payload admin, and it points at the generated default.
   */
  ogImage: "/opengraph-image",
  description: `${basics.name} — ${basics.label}. An interactive resume, cut for the role you are hiring for.`,

  branding: {
    projectName: resumeConfig.site.host,
    projectSlug: "resume",
    productNames: {
      bones: "Bones",
      brains: "Brains",
      main: resumeConfig.site.host,
    },
    domain: resumeConfig.site.host,
    protocol: "web+resume",
    githubOrg: handle("github"),
    githubRepo: "resume-app",
    vercelProjectName: "resume-app",
    databaseName: "resume",
  },

  links: {
    twitter: profile("twitter"),
    twitter_follow: `https://twitter.com/intent/follow?screen_name=${handle("twitter")}`,
    x: profile("twitter"),
    x_follow: `https://x.com/intent/follow?screen_name=${handle("twitter")}`,
    github: profile("github"),
  },

  // Read from `basics.profiles`. Add a profile to resume.json and it shows up
  // here; an empty string means the resume does not list that network.
  social: {
    github: profile("github"),
    x: profile("twitter"),
    linkedin: profile("linkedin"),
    instagram: "",
    facebook: "",
    youtube: "",
    tiktok: "",
    discord: "",
    dribbble: "",
    threads: "",
  },

  repo: {
    owner: handle("github"),
    name: "resume-app",
    url: `https://github.com/${handle("github")}/resume-app`,
    format: {
      // Placeholder format functions - assigned below
      clone: () => "",
      ssh: () => "",
    },
  },

  // One inbox. A resume has no support desk, and a reader who writes to any of
  // these should reach the person whose resume it is.
  email: {
    support: basics.email,
    team: basics.email,
    noreply: `noreply@${EMAIL_DOMAIN}`,
    domain: EMAIL_DOMAIN,
    legal: basics.email,
    privacy: basics.email,
    // Placeholder format function - assigned below
    format: (_type) => "",
  },

  creator: {
    name: basics.name,
    email: basics.email,
    url: basics.url,
    twitter: handle("twitter") ? `@${handle("twitter")}` : "",
    twitter_handle: handle("twitter"),
    domain: basics.url.replace(/^https?:\/\//, "").replace(/\/$/, ""),
    fullName: basics.name,
    role: basics.label,
    avatar: basics.image ?? "",
    location: BASES,
    bio: basics.label,
  },

  store: {
    id: "resume",
    products: {},
  },

  metadata: {
    keywords: [
      basics.name,
      "resume",
      "cv",
      "software engineer",
      "interactive resume",
      "portfolio",
      "hire",
    ],
    // The resume renders one way in both schemes, so the browser chrome should
    // not promise a light page and then hand over a near-black one.
    themeColor: {
      light: resumeConfig.theme.screen.bg,
      dark: resumeConfig.theme.screen.bg,
    },
    locale: "en-US",
    generator: "Next.js", // Use Next.js as generator
    referrer: "origin-when-cross-origin",
    category: "resume",
    classification: "Personal Portfolio",
    openGraph: {
      imageWidth: 1200,
      imageHeight: 630,
    },
    twitter: {
      card: "summary_large_image",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {},
    /*
     * No startupImage. The one here pointed at the 180px app icon, which is an
     * icon and not a launch screen — iOS stretched it across the whole display.
     * A real set means one image per device resolution; until those exist, iOS
     * drawing its own blank launch screen looks better than a blown-up glyph.
     */
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
    },
    appLinks: {},
    assetsPath: "/assets",
    bookmarksPath: "/",
    // blogPath is now conditionally added below
  },

  manifest: {
    startUrl: "/", // Use literal for now, update below if needed
    display: "standalone",
    displayOverride: ["window-controls-overlay"],
    orientation: "portrait-primary",
    categories: ["development", "productivity", "utilities"],
    dir: "ltr",
    lang: "en-US",
    preferRelatedApplications: false,
    scope: "/",
    launchHandler: { client_mode: ["navigate-existing", "auto"] },
    icons: {
      favicon: "/favicon.ico",
      appIcon192: "/app/web-app-manifest-192x192.png",
      appIcon512: "/app/web-app-manifest-512x512.png",
    },
    relatedApplications: [],
  },

  payload: {
    adminTitleSuffix: " CMS", // Updated below
    adminIconPath: "./lib/payload/components/payload-icon",
    adminLogoPath: "./lib/payload/components/payload-logo",
    dbSchemaName: "payload",
    emailFromName: "Payload CMS",
  },

  app: {
    apiKeyPrefix: "sk",
  },
};

// Assign dynamic values AFTER the main object is defined
siteConfig.repo.format = {
  clone: () => `https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
  ssh: () => `git@github.com:${siteConfig.repo.owner}/${siteConfig.repo.name}.git`,
};

siteConfig.email.format = (type: Exclude<keyof SiteConfig["email"], "format">) =>
  siteConfig.email[type];

siteConfig.payload.adminTitleSuffix = ` - ${siteConfig.title} CMS`;

// siteConfig.manifest.startUrl = routes.home; // Uncomment and import routes if needed

// Make sure alternates exists before assigning canonical
siteConfig.metadata.alternates ??= {};
siteConfig.metadata.alternates.canonical = siteConfig.url;
// Advertise RSS feed for SEO and feed discovery (only when blog is enabled)
if (process.env.NEXT_PUBLIC_HAS_BLOG === "true") {
  siteConfig.metadata.alternates.types = {
    ...(siteConfig.metadata.alternates?.types ?? {}),
    "application/rss+xml": `${siteConfig.url}/rss.xml`,
  };
}

// Check appleWebApp is an object before assigning title
if (siteConfig.metadata.appleWebApp && typeof siteConfig.metadata.appleWebApp === "object") {
  siteConfig.metadata.appleWebApp.title = siteConfig.title;
}

// Ensure appLinks and appLinks.web are objects before assigning url
siteConfig.metadata.appLinks ??= {};
siteConfig.metadata.appLinks.web ??= { url: "", should_fallback: false }; // Initialize web if needed
// Check type again after potential initialization
if (
  siteConfig.metadata.appLinks?.web &&
  typeof siteConfig.metadata.appLinks.web === "object" &&
  !Array.isArray(siteConfig.metadata.appLinks.web) // Ensure it's not an array
) {
  siteConfig.metadata.appLinks.web.url = siteConfig.url;
}

// Update paths to be absolute URLs based on siteConfig.url
siteConfig.metadata.assetsPath = `${siteConfig.url}/assets`;
siteConfig.metadata.bookmarksPath = `${siteConfig.url}/`;

if (process.env.NEXT_PUBLIC_HAS_BLOG === "true") {
  siteConfig.metadata.blogPath = `${siteConfig.url}/blog`;
}

// Freeze the object to prevent accidental modifications later (optional)
// Object.freeze(siteConfig);
