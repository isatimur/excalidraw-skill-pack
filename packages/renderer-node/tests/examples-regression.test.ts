import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { renderToPng } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOOK = join(__dirname, "..", "..", "..", "examples", "book");
const GOLDENS = join(BOOK, "golden");

async function listFixtures(): Promise<string[]> {
  return (await readdir(BOOK))
    .filter((f) => f.endsWith(".excalidraw"))
    .map((f) => f.replace(".excalidraw", ""));
}

const fixtures = await listFixtures();

describe.concurrent("book diagram regression", () => {
  it.each(fixtures)("%s within 2% of golden", async (name) => {
    const src = await readFile(join(BOOK, `${name}.excalidraw`), "utf-8");
    const golden = PNG.sync.read(await readFile(join(GOLDENS, `${name}.png`)));
    const actual = PNG.sync.read(
      await renderToPng(src, { theme: "default-sketchy", scale: 1, width: 1200 })
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
