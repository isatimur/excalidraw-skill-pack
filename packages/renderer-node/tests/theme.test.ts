import { describe, it, expect } from "vitest";
import { resolveTheme } from "../src/theme.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = join(__dirname, "..", "..", "core", "themes");

describe("resolveTheme (node renderer)", () => {
  it("loads default-sketchy", async () => {
    const t = await resolveTheme("default-sketchy", themesDir);
    expect(t.manifest.name).toBe("default-sketchy");
    expect(t.palette.ink).toBe("#1e1e1e");
  });

  it("throws on unknown", async () => {
    await expect(resolveTheme("nope", themesDir)).rejects.toThrow(/not found/i);
  });
});
