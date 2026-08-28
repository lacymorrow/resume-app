import type { Metadata, Viewport } from "next";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type React from "react";
import { instrumentSans, instrumentSerif } from "@/config/fonts";
import { metadata as defaultMetadata, viewport as sharedViewport } from "@/config/metadata";
import { resumeConfig } from "@/resume/inputs";
import "@/styles/globals.css";

/**
 * Root layout for the resume, deliberately separate from the (app) group.
 *
 * The resume renders a full-bleed frame of its own and needs none of the app
 * chrome — no header, footer, providers, or payment initialisation. Keeping it
 * in its own route group also keeps it out from under (app)/loading.tsx, whose
 * Suspense boundary is what stopped the resume rendering without JavaScript:
 * useSearchParams in a client component defers everything up to the nearest
 * boundary to the client, so the whole page ended up in a hidden payload that
 * only an inline script could reveal.
 *
 * Two root layouts in one app is supported as long as neither group nests
 * inside the other; (app) keeps its own.
 */
export const metadata: Metadata = defaultMetadata;
export const viewport: Viewport = sharedViewport;

export default function ResumeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${instrumentSerif.variable}`}
        style={{ margin: 0, background: resumeConfig.theme.screen.bg }}
      >
        {/* The viewer keeps its builder state in the query string. */}
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
