import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { discoverInstalledThemes } from "../src/theme-loader.js";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const fakeRoot = join(tmpdir(), "esp-discovery-test-" + Date.now());

const themeAlpha = {
  manifest: { name: "theme-alpha", version: "1.0.0", description: "Alpha" },
  palette: { ink: "#000000", paper: "#ffffff", accent: "#ff0000" }
};
const themeBeta = {
  manifest: { name: "theme-beta", version: "2.0.0", description: "Beta" },
  palette: { ink: "#111111", paper: "#eeeeee", accent: "#00ff00" }
};

async function createFakeTheme(
  root: string,
  pkgName: string,
  theme: { manifest: Record<string, unknown>; palette: Record<string, unknown> }
) {
  const pkgDir = join(root, "node_modules", "@excalidraw-skill-pack", pkgName);
  await mkdir(pkgDir, { recursive: true });
  await writeFile(join(pkgDir, "package.json"), JSON.stringify({ name: `@excalidraw-skill-pack/${pkgName}`, version: theme.manifest.version }));
  const themeDir = join(pkgDir, "theme");
  await mkdir(themeDir, { recursive: true });
  await writeFile(join(themeDir, "theme.json"), JSON.stringify(theme.manifest));
  await writeFile(join(themeDir, "palette.json"), JSON.stringify(theme.palette));
  return pkgDir;
}

beforeAll(async () => {
  await mkdir(fakeRoot, { recursive: true });
  await createFakeTheme(fakeRoot, "theme-alpha", themeAlpha);
  await createFakeTheme(fakeRoot, "theme-beta", themeBeta);
});

afterAll(async () => {
  await rm(fakeRoot, { recursive: true, force: true });
});

describe("discoverInstalledThemes", () => {
  it("finds npm-installed theme-* packages with source=npm", async () => {
    const discovered = await discoverInstalledThemes({ nodeModulesRoot: fakeRoot });
    const names = discovered.map((d) => d.name);
    expect(names).toContain("theme-alpha");
    expect(names).toContain("theme-beta");
    expect(discovered.length).toBeGreaterThanOrEqual(2);
    for (const d of discovered) {
      expect(d.source).toBe("npm");
      expect(d.manifest).toBeDefined();
      expect(d.themeDir).toBeDefined();
    }
  });
});
