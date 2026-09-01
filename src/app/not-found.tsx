import Link from "next/link";
import { resumeConfig } from "@/resume/inputs";
import { resumeData } from "@/resume/lib/data";
import { DEFAULT_FLAVOR_ID, flavorHref } from "@/resume/lib/routes";

/**
 * 404 for the whole app.
 *
 * Every single-segment path is a flavor now, so the likeliest way to land here
 * is a mistyped or retired flavor slug — hence a link home rather than a search
 * box or a sitemap.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */
export default function NotFound() {
  const { screen } = resumeConfig.theme;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.75rem",
        padding: "2rem",
        textAlign: "center",
        background: screen.bg,
        color: screen.ink,
        fontFamily: screen.fontSans,
      }}
    >
      <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Page not found</h1>
      <p style={{ margin: 0, color: screen.dim }}>That resume flavor doesn&rsquo;t exist.</p>
      <Link href={flavorHref(DEFAULT_FLAVOR_ID)} style={{ color: "inherit" }}>
        View {resumeData.basics.name}&rsquo;s resume
      </Link>
    </main>
  );
}
