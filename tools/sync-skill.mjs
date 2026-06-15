// Mirrors packages/core/SKILL.md (the canonical methodology) into the Claude Code
// plugin skill directory so the repo is installable as a plugin without a build step.
// Run `node tools/sync-skill.mjs` to sync, `--check` to fail on drift (used in CI).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = resolve(root, "packages/core/SKILL.md");
const target = resolve(root, "skills/excalidraw-diagram/SKILL.md");

const src = readFileSync(source, "utf-8");
const check = process.argv.includes("--check");

if (check) {
  let current = "";
  try {
    current = readFileSync(target, "utf-8");
  } catch {
    /* missing target → drift */
  }
  if (current !== src) {
    console.error(
      "skills/excalidraw-diagram/SKILL.md is out of sync with packages/core/SKILL.md.\n" +
        "Run `pnpm sync-skill` and commit the result.",
    );
    process.exit(1);
  }
  console.log("skill in sync");
} else {
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, src);
  console.log("synced skills/excalidraw-diagram/SKILL.md from packages/core/SKILL.md");
}
