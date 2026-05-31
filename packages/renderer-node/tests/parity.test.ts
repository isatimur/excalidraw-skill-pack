import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, basename } from "node:path";
import { readdirSync } from "node:fs";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = join(__dirname, "..", "..", "shared", "fixtures", "golden");

const nodeGoldens = readdirSync(GOLDEN_DIR)
  .filter((f) => f.endsWith(".node.png"))
  .sort();

function parsePng(buf: Buffer): PNG {
  return PNG.sync.read(buf);
}

describe("parity: node vs python renderers", () => {
  for (const nodeFile of nodeGoldens) {
    const name = basename(nodeFile, ".node.png");
    it(`${name} within 5% of python golden`, async () => {
      const nodeBuf = await readFile(join(GOLDEN_DIR, `${name}.node.png`));
      const pythonBuf = await readFile(join(GOLDEN_DIR, `${name}.python.png`));

      const nodeImg = parsePng(nodeBuf);
      const pythonImg = parsePng(pythonBuf);

      const w = Math.min(nodeImg.width, pythonImg.width);
      const h = Math.min(nodeImg.height, pythonImg.height);

      const diffBuf = Buffer.alloc(w * h * 4);
      const diffPixels = pixelmatch(
        nodeImg.data.subarray(0, w * h * 4),
        pythonImg.data.subarray(0, w * h * 4),
        diffBuf,
        w,
        h,
        { threshold: 0.1 }
      );
      const totalPixels = w * h;
      const diffPct = diffPixels / totalPixels;

      expect(diffPct, `${name}: ${(diffPct * 100).toFixed(2)}% diff exceeds 5%`).toBeLessThanOrEqual(0.05);
    });
  }
});
