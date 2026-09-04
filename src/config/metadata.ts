import type { Metadata, Viewport } from "next";
import type { OpenGraph } from "next/dist/lib/metadata/types/opengraph-types";
import type { Twitter } from "next/dist/lib/metadata/types/twitter-types";
import { siteConfig } from "./site-config";

// Helper function to safely extract the default title string
const getDefaultTitleString = (title: Metadata["title"]): string | undefined => {
  if (typeof title === "string") {
    return title;
  }
  if (title && typeof title === "object" && "default" in title) {
    return title.default ?? undefined; // Return undefined if title.default is null
  }
  return undefined;
};

/*
 * Neither of these names an image.
 *
 * The cards are generated per flavor by the file-based opengraph-image routes,
 * and Next only falls back to those when metadata leaves `images` unset — an
 * explicit value here would win over the file and pin every page to one
 * picture. See src/resume/og/card.tsx.
 */
const defaultOpenGraph: OpenGraph = {
  type: "website",
  locale: siteConfig.metadata.locale,
  url: siteConfig.url,
  title: siteConfig.title,
  description: siteConfig.description,
  siteName: siteConfig.title,
};

const defaultTwitter: Twitter = {
  card: siteConfig.metadata.twitter.card,
  title: siteConfig.title,
  description: siteConfig.description,
  creator: siteConfig.creator.twitter,
};

export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  /*
   * No template. Every page here is a flavor of one resume and already titles
   * itself "<Role> Resume - <Name>", so a suffix only pushed the pages that
   * inherit it past the length a search result shows — and "/" never inherited
   * it, because the template lives in the same segment as that page, so the
   * two halves of the site disagreed about their own titles.
   */
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.title,
  authors: [
    {
      name: siteConfig.creator.name,
      url: siteConfig.creator.url,
    },
  ],
  creator: siteConfig.creator.name,
  publisher: siteConfig.title,
  formatDetection: siteConfig.metadata.formatDetection,
  generator: siteConfig.metadata.generator,
  keywords: siteConfig.metadata.keywords,
  referrer: siteConfig.metadata.referrer,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  alternates: siteConfig.metadata.alternates,
  openGraph: defaultOpenGraph,
  twitter: defaultTwitter,
  appleWebApp: siteConfig.metadata.appleWebApp,
  appLinks: siteConfig.metadata.appLinks,
  archives: siteConfig.metadata.blogPath ? [siteConfig.metadata.blogPath] : [],
  assets: [siteConfig.metadata.assetsPath],
  bookmarks: [siteConfig.metadata.bookmarksPath],
  category: siteConfig.metadata.category,
  classification: siteConfig.metadata.classification,
  // Repository discovery meta tags
  other: {
    repository: siteConfig.repo.url,
    source: siteConfig.repo.url,
    "ai:description": siteConfig.description,
  },
};

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    {
      media: "(prefers-color-scheme: light)",
      color: siteConfig.metadata.themeColor.light,
    },
    {
      media: "(prefers-color-scheme: dark)",
      color: siteConfig.metadata.themeColor.dark,
    },
  ],
};

export interface HeadLinkHint {
  rel: string;
  href: string;
  crossOrigin?: "anonymous" | "use-credentials";
}

// Shared head link hints used by both App and Pages routers
export const headLinkHints: readonly HeadLinkHint[] = [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "dns-prefetch", href: "https://vercel.com" },
  { rel: "dns-prefetch", href: "https://api.github.com" },
  { rel: "dns-prefetch", href: "https://cdn.jsdelivr.net" },
  // Repository discovery (vcs-git convention)
  { rel: "vcs-git", href: siteConfig.repo.url },
] as const;

type ConstructMetadataProps = Metadata & {
  images?: { url: string; width: number; height: number; alt: string }[];
  noIndex?: boolean;
};

export const constructMetadata = ({
  images = [],
  noIndex = false,
  ...metadata
}: ConstructMetadataProps = {}): Metadata => {
  // Use helper function to get title strings
  const metaTitleString = getDefaultTitleString(metadata.title);
  const defaultMetaTitleString = getDefaultTitleString(defaultMetadata.title);

  // `images` is spread in only when a caller passes one, so the usual case
  // leaves the key absent and the generated opengraph-image applies.
  const overrideImages = images.length > 0 ? { images } : {};

  return {
    ...defaultMetadata,
    ...metadata,
    openGraph: {
      ...defaultOpenGraph,
      // Assign the extracted title string or fallback
      title: metaTitleString ?? defaultMetaTitleString,
      // Ensure description is not null
      description: metadata.description ?? defaultMetadata.description ?? undefined,
      ...(metadata.openGraph ?? {}),
      ...overrideImages,
    },
    twitter: {
      ...defaultTwitter,
      // Assign the extracted title string or fallback
      title: metaTitleString ?? defaultMetaTitleString,
      // Ensure description is not null
      description: metadata.description ?? defaultMetadata.description ?? undefined,
      ...(metadata.twitter ?? {}),
      ...overrideImages,
    },
    robots: noIndex ? { index: false, follow: true } : defaultMetadata.robots,
  };
};
