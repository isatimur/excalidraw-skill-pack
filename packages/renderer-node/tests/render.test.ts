import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderToPng, hydrateSkeleton } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "..", "..", "shared", "fixtures", "05-inline-figure.excalidraw");

const SKELETON_FIXTURE = join(__dirname, "..", "..", "shared", "fixtures", "skeleton", "skeleton-pipeline.excalidraw");

describe("renderToPng", () => {
  it("returns PNG bytes for a valid diagram", async () => {
    const json = await readFile(FIXTURE, "utf-8");
    const png = await renderToPng(json, { theme: "default-sketchy", scale: 1, width: 800 });
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.length).toBeGreaterThan(5000);
  }, 60_000);

  it("hydrates and renders an excalidraw-skeleton document", async () => {
    const json = await readFile(SKELETON_FIXTURE, "utf-8");
    const png = await renderToPng(json, { theme: "default-sketchy", scale: 1, width: 1200 });
    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    expect(png.length).toBeGreaterThan(5000);
  }, 60_000);

  it("hydrateSkeleton produces an openable full document with generated fields", async () => {
    const json = await readFile(SKELETON_FIXTURE, "utf-8");
    const full = JSON.parse(await hydrateSkeleton(json)) as {
      type: string;
      elements: Array<Record<string, unknown>>;
    };
    expect(full.type).toBe("excalidraw");
    // 3 skeletons (rect + ellipse + arrow, each labeled) hydrate to 6 elements
    // including the auto-generated bound text labels.
    expect(full.elements.length).toBeGreaterThanOrEqual(6);
    for (const el of full.elements) {
      expect(typeof el["id"]).toBe("string");
      expect(typeof el["seed"]).toBe("number");
      expect(typeof el["versionNonce"]).toBe("number");
    }
  }, 60_000);
});
