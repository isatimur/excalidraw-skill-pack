import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldTheme } from "../src/scaffold.js";

describe("scaffoldTheme", () => {
  it("creates a complete theme package", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "esp-scaffold-"));
    await scaffoldTheme({
      slug: "my-brand",
      description: "Brand theme for ACME Co.",
      author: "Jane Doe",
      parent: "default-sketchy",
      cwd: tmp
    });
    const dir = join(tmp, "theme-my-brand");
    expect(existsSync(join(dir, "theme.json"))).toBe(true);
    expect(existsSync(join(dir, "palette.json"))).toBe(true);
    expect(existsSync(join(dir, "palette.md"))).toBe(true);
    expect(existsSync(join(dir, "typography.json"))).toBe(true);
    expect(existsSync(join(dir, "package.json"))).toBe(true);
    expect(existsSync(join(dir, "pyproject.toml"))).toBe(true);
    expect(existsSync(join(dir, "README.md"))).toBe(true);

    const themeJson = JSON.parse(readFileSync(join(dir, "theme.json"), "utf-8"));
    expect(themeJson.name).toBe("my-brand");
    expect(themeJson.extends).toBe("default-sketchy");

    const pyToml = readFileSync(join(dir, "pyproject.toml"), "utf-8");
    expect(pyToml).toContain('name = "excalidraw-skill-pack-theme-my-brand"');
  });

  it("rejects non-kebab-case slugs", async () => {
    await expect(
      scaffoldTheme({
        slug: "BadName",
        description: "x",
        author: "x",
        parent: "default-sketchy",
        cwd: tmpdir()
      })
    ).rejects.toThrow(/kebab-case/i);
  });
});
