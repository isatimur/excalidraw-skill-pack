import { describe, it, expect } from "vitest";
import { applyThemeTool } from "../src/tools/apply-theme.js";

const ORIGINAL = JSON.stringify({
  type: "excalidraw", version: 2, source: "test",
  elements: [{
    type: "rectangle", x: 0, y: 0, width: 100, height: 100,
    strokeColor: "#1e1e1e", backgroundColor: "#ffffff"
  }]
});

describe("apply_theme", () => {
  it("returns transformed JSON with target theme's palette", async () => {
    const result = (await applyThemeTool.handler({
      json: ORIGINAL, target_theme: "default-sketchy"
    })) as { json: string; mapping: Record<string, string> };
    const transformed = JSON.parse(result.json);
    expect(transformed.type).toBe("excalidraw");
    expect(transformed.elements.length).toBe(1);
    expect(typeof result.mapping).toBe("object");
  });

  it("throws on unknown target_theme", async () => {
    await expect(
      applyThemeTool.handler({ json: ORIGINAL, target_theme: "nope" })
    ).rejects.toThrow(/not found/i);
  });
});
