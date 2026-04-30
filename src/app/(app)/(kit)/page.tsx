import type { Metadata } from "next";
import { constructMetadata } from "@/config/metadata";
import { resumeData } from "../resume/_lib/resume-data";
import { ResumeViewer } from "../resume/_components/resume-viewer";

export const metadata: Metadata = constructMetadata({
  title: "Resume - Lacy Morrow",
  description: "Interactive resume with filtering by role, technology, and date range. Export custom versions as PDF.",
});

export default function HomePage() {
  return <ResumeViewer data={resumeData} />;
}
