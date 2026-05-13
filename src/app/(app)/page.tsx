import type React from "react";
import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { resumeData } from "@/app/(app)/resume/_lib/resume-data";
import { ResumeViewer } from "@/app/(app)/resume/_components/resume-viewer";

export const metadata: Metadata = constructMetadata({
  title: "Resume - Lacy Morrow",
  description: "Interactive resume with filtering by role, technology, and date range. Export custom versions as PDF.",
});

export default function HomePage() {
  return (
    <div style={{ "--header-height": "0px" } as React.CSSProperties}>
      <ResumeViewer data={resumeData} />
      <footer className="pb-6 pt-2 text-center print:hidden">
        <a
          href="https://lacymorrow.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground/40 transition-colors hover:text-muted-foreground/70"
        >
          lacymorrow.com
        </a>
      </footer>
    </div>
  );
}
