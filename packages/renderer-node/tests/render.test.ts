import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderToPng } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "..", "..", "shared", "fixtures", "05-inline-figure.excalidraw");

describe("renderToPng", () => {
  it("returns PNG bytes for a valid diagram", async () => {
    const json = await readFile(FIXTURE, "utf-8");
    const png = await renderToPng(json, { theme: "default-sketchy", scale: 1, width: 800 });
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.length).toBeGreaterThan(5000);
  }, 60_000);
});
