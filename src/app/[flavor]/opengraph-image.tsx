import { ImageResponse } from "next/og";
import { resumeData } from "@/resume/lib/data";
import { flavorIds } from "@/resume/lib/routes";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogImageOptions } from "@/resume/og/card";

/**
 * One prerendered social card per flavor, drawn from that flavor's own accent
 * and statement. Static params mirror the page's, so the cards are written to
 * disk at build time alongside the pages they belong to.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${resumeData.basics.name} — resume`;

export function generateStaticParams(): { flavor: string }[] {
  return flavorIds().map((flavor) => ({ flavor }));
}

export default async function OpengraphImage({ params }: { params: Promise<{ flavor: string }> }) {
  const { flavor } = await params;
  return new ImageResponse(<OgCard flavorId={flavor} />, await ogImageOptions());
}
