import { existsSync } from "node:fs";
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public", "work");
const output = path.join(root, "public", "og");

await mkdir(output, { recursive: true });

const projects = (await readdir(source, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

for (const slug of projects) {
  const input = path.join(source, slug, "hero.webp");
  if (!existsSync(input)) continue;

  await sharp(input)
    .resize(1200, 630, { fit: "cover", position: "top" })
    .flatten({ background: "#0b0b0a" })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(path.join(output, `${slug}.jpg`));

  console.log(`Generated public/og/${slug}.jpg`);
}
