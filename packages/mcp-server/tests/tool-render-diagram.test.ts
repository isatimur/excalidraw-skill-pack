import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderDiagramTool } from "../src/tools/render-diagram.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "..", "..", "shared", "fixtures", "05-inline-figure.excalidraw");

describe("render_diagram", () => {
  it("renders JSON to base64 PNG", async () => {
    const json = await readFile(FIXTURE, "utf-8");
    const result = (await renderDiagramTool.handler({
      json, theme: "default-sketchy", scale: 1, width: 800
    })) as { png_base64: string; width: number; height: number };
    expect(result.png_base64.length).toBeGreaterThan(1000);
    expect(result.width).toBeGreaterThan(100);
    expect(result.height).toBeGreaterThan(100);
  }, 60_000);
});
