import { ImageResponse } from "next/og";
import { resumeData } from "@/resume/lib/data";
import { DEFAULT_FLAVOR_ID } from "@/resume/lib/routes";
import { OG_CONTENT_TYPE, OG_SIZE, OgCard, ogImageOptions } from "@/resume/og/card";

/**
 * The social card for "/". Every other flavor generates its own next to its
 * page; see [flavor]/opengraph-image.tsx.
 *
 * File-based, so Next emits both og:image and twitter:image from it and no
 * route has to name an asset. That only holds while the metadata helpers leave
 * `images` unset — an explicit value in metadata wins over this file.
 */
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = `${resumeData.basics.name} — resume`;

export default async function OpengraphImage() {
  return new ImageResponse(<OgCard flavorId={DEFAULT_FLAVOR_ID} />, await ogImageOptions());
}
