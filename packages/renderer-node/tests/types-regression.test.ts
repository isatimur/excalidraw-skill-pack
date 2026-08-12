import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { renderToPng } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TYPES = join(__dirname, "..", "..", "shared", "fixtures", "types");
const GOLDENS = join(__dirname, "..", "..", "shared", "fixtures", "golden", "types");

async function listTypes(): Promise<string[]> {
  return (await readdir(TYPES, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

const types = await listTypes();

describe.concurrent("type fixture regression", () => {
  it.each(types)("%s within 5% of golden", async (name) => {
    const src = await readFile(join(TYPES, name, "example.excalidraw"), "utf-8");
    const golden = PNG.sync.read(await readFile(join(GOLDENS, `${name}.png`)));
    const actual = PNG.sync.read(
      await renderToPng(src, { theme: "default-sketchy", scale: 2, width: 900 })
    );
    expect(actual.width).toBe(golden.width);
    expect(actual.height).toBe(golden.height);
    const diff = new PNG({ width: golden.width, height: golden.height });
    const mismatched = pixelmatch(
      actual.data,
      golden.data,
      diff.data,
      golden.width,
      golden.height,
      { threshold: 0.1 }
    );
    expect(mismatched / (golden.width * golden.height)).toBeLessThan(0.05);
  }, 120_000);
});
