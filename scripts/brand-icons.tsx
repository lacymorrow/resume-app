/**
 * Writes every committed brand icon from src/resume/og/mark.tsx.
 *
 *   bun run icons
 *
 * These are committed rather than generated per request because two of them
 * are named by files that cannot be dynamic: /favicon.ico, which browsers ask
 * for by that exact path, and the manifest's icon list, which needs stable
 * URLs. Re-run it after changing the name in resume.json or the default
 * flavor's accent, and commit what changes.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ogFonts } from "../src/resume/og/card";
import { BrandMark } from "../src/resume/og/mark";

const APP_DIR = join(process.cwd(), "src/app");
const PUBLIC_DIR = join(process.cwd(), "public/app");

const fonts = await ogFonts();

async function render(size: number): Promise<Buffer> {
  const image = new ImageResponse(<BrandMark size={size} />, { width: size, height: size, fonts });
  return Buffer.from(await image.arrayBuffer());
}

/**
 * An .ico wrapping a single PNG. The format allows a raw PNG payload as of
 * Windows Vista and every browser in use reads it, so this is a 22-byte header
 * rather than a bitmap encoder or a dependency.
 */
function ico(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width, 0 means 256
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette size
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12);

  return Buffer.concat([header, entry, png]);
}

await mkdir(PUBLIC_DIR, { recursive: true });

const targets: { path: string; size: number }[] = [
  // Next links this one from every page as the tab icon.
  { path: join(APP_DIR, "icon.png"), size: 256 },
  // Next only recognises this name; "apple-touch-icon.png" in app/ is an
  // ordinary file and never reaches the head as a rel="apple-touch-icon".
  { path: join(APP_DIR, "apple-icon.png"), size: 180 },
  { path: join(PUBLIC_DIR, "web-app-manifest-192x192.png"), size: 192 },
  { path: join(PUBLIC_DIR, "web-app-manifest-512x512.png"), size: 512 },
];

for (const { path, size } of targets) {
  await writeFile(path, await render(size));
  console.log(`${path} (${size}px)`);
}

// Requested by path, so it cannot be one of the generated routes.
const faviconPath = join(APP_DIR, "favicon.ico");
await writeFile(faviconPath, ico(await render(48), 48));
console.log(`${faviconPath} (48px)`);
