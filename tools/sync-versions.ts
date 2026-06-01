import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = new URL("..", import.meta.url).pathname;

function readVersion(pkgPath: string): string {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { version: string };
  return pkg.version;
}

function writeVersion(pkgPath: string, version: string): void {
  const raw = readFileSync(pkgPath, "utf-8");
  const pkg = JSON.parse(raw) as { version: string };
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");
}

function compareVersions(a: string, b: string): number {
  const parse = (v: string) => v.split(/[.-]/).map((s) => parseInt(s, 10) || 0);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

const rendererPkg = resolve(root, "packages/renderer-node/package.json");
const mcpPkg = resolve(root, "packages/mcp-server/package.json");

const rendererVersion = readVersion(rendererPkg);
const mcpVersion = readVersion(mcpPkg);

if (rendererVersion === mcpVersion) {
  console.log(`Already in sync at ${rendererVersion}.`);
  process.exit(0);
}

const cmp = compareVersions(rendererVersion, mcpVersion);
const [higher, lowerPath, lowerVersion] =
  cmp > 0
    ? [rendererVersion, mcpPkg, mcpVersion]
    : [mcpVersion, rendererPkg, rendererVersion];

console.log(`Syncing: ${lowerVersion} → ${higher}`);
writeVersion(lowerPath, higher);
console.log(`Done. Both packages now at ${higher}.`);
