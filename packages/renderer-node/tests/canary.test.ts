import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { readdirSync } from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { renderToPng } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = join(__dirname, "..", "..", "shared", "fixtures");
const GOLDEN_DIR = join(FIXTURES_DIR, "golden");

const fixtures = readdirSync(FIXTURES_DIR)
  .filter((f) => f.endsWith(".excalidraw"))
  .sort();

function parsePng(buf: Buffer): PNG {
  return PNG.sync.read(buf);
}

describe("canary: node goldens regression", () => {
  for (const fixture of fixtures) {
    const name = basename(fixture, ".excalidraw");
    it(`${name} matches golden within 2%`, async () => {
      const json = await readFile(join(FIXTURES_DIR, fixture), "utf-8");
      const rendered = await renderToPng(json, { theme: "default-sketchy", scale: 1, width: 800 });
      const goldenBuf = await readFile(join(GOLDEN_DIR, `${name}.node.png`));

      const img = parsePng(rendered);
      const golden = parsePng(goldenBuf);

      expect(img.width).toBe(golden.width);
      expect(img.height).toBe(golden.height);

      const diffBuf = Buffer.alloc(img.width * img.height * 4);
      const diffPixels = pixelmatch(img.data, golden.data, diffBuf, img.width, img.height, { threshold: 0.1 });
      const totalPixels = img.width * img.height;
      const diffPct = diffPixels / totalPixels;

      expect(diffPct, `${name}: ${(diffPct * 100).toFixed(2)}% diff exceeds 2%`).toBeLessThanOrEqual(0.02);
    }, 60_000);
  }
});
