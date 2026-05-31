import { describe, it, expect } from "vitest";
import { loadTheme } from "../src/theme-loader.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = join(__dirname, "..", "themes");

describe("loadTheme", () => {
  it("loads default-sketchy from the bundled themes dir", async () => {
    const t = await loadTheme("default-sketchy", { themesDir });
    expect(t.manifest.name).toBe("default-sketchy");
    expect(t.palette.ink).toBe("#1e1e1e");
    expect(t.typography.fontFamily).toBe(1);
    expect(t.layouts["chapter-card"]).toContain("chapter-card");
    expect(t.elements.box.strokeColor).toBe("#1e1e1e");
  });

  it("throws on unknown theme name", async () => {
    await expect(loadTheme("nope", { themesDir })).rejects.toThrow(/not found/i);
  });
});
