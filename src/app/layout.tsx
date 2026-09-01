import type { Metadata, Viewport } from "next";
import { ViewTransitions } from "next-view-transitions";
import { NuqsAdapter } from "nuqs/adapters/react";
import type React from "react";
import { instrumentSans, instrumentSerif } from "@/config/fonts";
import { metadata as defaultMetadata, viewport as sharedViewport } from "@/config/metadata";
import { resumeConfig } from "@/resume/inputs";
import "@/styles/globals.css";

/**
 * Root layout for the resume — the only layout in the app.
 *
 * The resume renders a full-bleed frame of its own and needs no app chrome: no
 * header, footer, providers, or payment initialisation. It deliberately has no
 * loading.tsx either. A Suspense boundary above the page is what used to hide
 * the resume from readers without JavaScript, deferring the whole page into a
 * hidden payload that only an inline script could reveal.
 *
 * The nuqs *react* adapter is deliberate for the same reason. The next/app
 * adapter reads the query string through useSearchParams, which opts every
 * route under it out of static prerendering unless a Suspense boundary catches
 * it. The react adapter reads window.location instead, so the flavor pages
 * prerender to static HTML and builder state is applied on the client after
 * mount.
 *
 * ViewTransitions is ShipKit's own provider, mounted here rather than through
 * components/layouts/app-router-layout.tsx: that layout brings the next/app
 * nuqs adapter with it, which is the one thing this layout cannot have. It
 * reads usePathname, not useSearchParams, so it costs nothing statically.
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
        {/* Builder state lives in the query string; flavors live in the path. */}
        <ViewTransitions>
          <NuqsAdapter>{children}</NuqsAdapter>
        </ViewTransitions>
      </body>
    </html>
  );
}
