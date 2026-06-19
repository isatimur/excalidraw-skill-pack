import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, "..", "dist", "cli.js");
const FIXTURE = join(__dirname, "..", "..", "shared", "fixtures", "05-inline-figure.excalidraw");

describe("excalidraw-render CLI", () => {
  it("renders to output path", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "esp-"));
    const out = join(tmp, "out.png");
    await exec("node", [CLI, FIXTURE, "--theme", "default-sketchy", "--output", out, "--scale", "1", "--width", "800"]);
    expect(existsSync(out)).toBe(true);
    expect(statSync(out).size).toBeGreaterThan(5000);
  }, 60_000);

  it("renders multiple inputs into an output directory in one browser session", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "esp-"));
    await exec("node", [CLI, FIXTURE, FIXTURE, "--theme", "default-sketchy", "--output", tmp, "--scale", "1", "--width", "800"]);
    const out = join(tmp, "05-inline-figure.png");
    expect(existsSync(out)).toBe(true);
    expect(statSync(out).size).toBeGreaterThan(5000);
  }, 90_000);
});
