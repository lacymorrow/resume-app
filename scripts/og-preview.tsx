/**
 * Renders every flavor's social card to PNG without running a build.
 *
 * The cards are generated at build time by the opengraph-image routes, which
 * makes them slow to iterate on and invisible until deploy. This writes the
 * same component to disk in about a second:
 *
 *   bun run og:preview            # into .og-preview/
 *   bun run og:preview /tmp/cards # anywhere else
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { flavorIds } from "../src/resume/lib/routes";
import { OgCard, ogImageOptions } from "../src/resume/og/card";

const out = process.argv[2] ?? ".og-preview";
await mkdir(out, { recursive: true });

const options = await ogImageOptions();

for (const id of flavorIds()) {
  const image = new ImageResponse(<OgCard flavorId={id} />, options);
  const path = join(out, `${id}.png`);
  await writeFile(path, Buffer.from(await image.arrayBuffer()));
  console.log(path);
}
