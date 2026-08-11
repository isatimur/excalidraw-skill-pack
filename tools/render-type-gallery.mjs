#!/usr/bin/env node
/**
 * Render type fixtures to web/images/types/<type>.png
 * Requires: pnpm build (renderer-node)
 */
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const FIXTURES = join(ROOT, "packages", "shared", "fixtures", "types");
const OUT = join(ROOT, "web", "images", "types");
const GOLDEN = join(ROOT, "packages", "shared", "fixtures", "golden", "types");

const { renderMany } = await import(join(ROOT, "packages", "renderer-node", "dist", "index.js"));

const types = (await readdir(FIXTURES, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

await mkdir(OUT, { recursive: true });
await mkdir(GOLDEN, { recursive: true });

const items = [];
for (const type of types) {
  const path = join(FIXTURES, type, "example.excalidraw");
  const json = await readFile(path, "utf-8");
  items.push({ type, json });
}

const pngs = await renderMany(
  items.map(({ json }) => ({
    json,
    opts: { theme: "default-sketchy", scale: 2, width: 900 },
  }))
);

for (let i = 0; i < items.length; i++) {
  const { type } = items[i];
  const png = pngs[i];
  await writeFile(join(OUT, `${type}.png`), png);
  await writeFile(join(GOLDEN, `${type}.png`), png);
  console.log(`wrote ${type}.png (${png.length} bytes)`);
}

const manifest = types.map((type) => ({
  type,
  slug: type,
  fixture: `packages/shared/fixtures/types/${type}/example.excalidraw`,
  png: `web/images/types/${type}.png`,
}));
await writeFile(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\n${types.length} PNGs rendered.`);
