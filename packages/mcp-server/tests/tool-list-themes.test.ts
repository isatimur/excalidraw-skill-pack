import { describe, it, expect } from "vitest";
import { listThemesTool } from "../src/tools/list-themes.js";

describe("list_themes", () => {
  it("returns at least default-sketchy", async () => {
    const result = (await listThemesTool.handler({})) as {
      themes: Array<{ name: string; version: string; description?: string }>;
    };
    const names = result.themes.map((t) => t.name);
    expect(names).toContain("default-sketchy");
  });

  it("includes bundled themes from core", async () => {
    const result = (await listThemesTool.handler({})) as { themes: Array<{ source: string }> };
    expect(result.themes.length).toBeGreaterThan(0);
  });
});
