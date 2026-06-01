import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "docs", "site", "themes", "_registry.json");

interface NpmRegistryEntry {
  package: { name: string; version: string; description?: string; links?: { homepage?: string } };
}

interface NpmSearchResponse {
  objects?: NpmRegistryEntry[];
}

interface ThemeEntry {
  name: string;
  npm?: { name: string; version: string };
  pypi?: { name: string; version: string };
  description?: string;
  homepage?: string;
  source: "monorepo" | "community";
}

async function fetchNpm(): Promise<ThemeEntry[]> {
  const r = await fetch(
    "https://registry.npmjs.org/-/v1/search?text=scope:excalidraw-skill-pack&size=250"
  );
  const data = (await r.json()) as NpmSearchResponse;
  return (data.objects ?? [])
    .filter((e) => e.package.name.startsWith("@excalidraw-skill-pack/theme-"))
    .map((e) => ({
      name: e.package.name.replace("@excalidraw-skill-pack/theme-", ""),
      npm: { name: e.package.name, version: e.package.version },
      description: e.package.description,
      homepage: e.package.links?.homepage,
      source: "community" as const,
    }));
}

async function fetchPyPI(): Promise<ThemeEntry[]> {
  // PyPI does not have a JSON search API; use the simple HTML index.
  const r = await fetch("https://pypi.org/simple/");
  const html = await r.text();
  const pattern = /href="\/simple\/(excalidraw-skill-pack-theme-[a-z0-9-]+)\//g;
  const seen = new Set<string>();
  const results: ThemeEntry[] = [];
  for (const m of html.matchAll(pattern)) {
    const pkgName = m[1];
    if (!pkgName || seen.has(pkgName)) continue;
    seen.add(pkgName);
    const detail = (await (
      await fetch(`https://pypi.org/pypi/${pkgName}/json`)
    ).json()) as { info?: { name: string; version: string; summary?: string } };
    if (detail.info) {
      results.push({
        name: pkgName.replace("excalidraw-skill-pack-theme-", ""),
        pypi: { name: detail.info.name, version: detail.info.version },
        description: detail.info.summary,
        source: "community" as const,
      });
    }
  }
  return results;
}

function merge(npm: ThemeEntry[], pypi: ThemeEntry[]): ThemeEntry[] {
  const map = new Map<string, ThemeEntry>();
  for (const e of npm) map.set(e.name, e);
  for (const e of pypi) {
    const existing = map.get(e.name);
    if (existing) {
      existing.pypi = e.pypi;
    } else {
      map.set(e.name, e);
    }
  }
  const monorepo = new Set(["stripe-press", "notion", "whiteboard", "dark"]);
  for (const e of map.values()) {
    if (monorepo.has(e.name)) e.source = "monorepo";
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main(): Promise<void> {
  console.log("Scanning npm...");
  const npm = await fetchNpm();
  console.log(`Found ${npm.length} npm themes`);
  console.log("Scanning PyPI...");
  const pypi = await fetchPyPI();
  console.log(`Found ${pypi.length} PyPI themes`);
  const merged = merge(npm, pypi);
  console.log(`Merged: ${merged.length} unique themes`);
  await writeFile(
    OUTPUT,
    JSON.stringify({ updated: new Date().toISOString(), themes: merged }, null, 2)
  );
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
