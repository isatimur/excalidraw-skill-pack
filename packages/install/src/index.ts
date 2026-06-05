#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { Command } from "commander";

const require = createRequire(import.meta.url);

function resolveCoreDir(): string {
  // core ships './skill' in its exports map; resolving package.json directly
  // would hit ERR_PACKAGE_PATH_NOT_EXPORTED.
  const skillPath = require.resolve("@excalidraw-skill-pack/core/skill");
  return dirname(skillPath);
}

const KNOWN_ADAPTERS = ["claude-code", "cursor", "copilot", "codex", "gemini-cli"] as const;
type Adapter = (typeof KNOWN_ADAPTERS)[number];

function isKnownAdapter(name: string): name is Adapter {
  return (KNOWN_ADAPTERS as readonly string[]).includes(name);
}

export function resolveAdapterScript(
  adapter: string,
  platform: NodeJS.Platform | string,
): string {
  if (!isKnownAdapter(adapter)) {
    throw new Error(`Unknown adapter: "${adapter}". Valid adapters: ${KNOWN_ADAPTERS.join(", ")}`);
  }

  const here = dirname(fileURLToPath(import.meta.url));
  const ext = platform === "win32" ? "install.ps1" : "install.sh";
  // Published layout: dist/adapters/<name>/install.{sh,ps1} (copied at build time).
  // Monorepo layout (dev/tests): <repo>/adapters/<name>/install.{sh,ps1}.
  return existsSync(join(here, "adapters", adapter, ext))
    ? join(here, "adapters", adapter, ext)
    : join(here, "..", "..", "..", "adapters", adapter, ext);
}

function run(): void {
  const program = new Command();

  program
    .name("excalidraw-skill-pack-install")
    .description("Install an excalidraw-skill-pack adapter")
    .argument("<adapter>", `Adapter to install (${KNOWN_ADAPTERS.join(", ")})`)
    .option("--lite", "Install the lightweight skill only")
    .action((adapter: string, opts: { lite?: boolean }) => {
      const platform = process.platform;
      let script: string;

      try {
        script = resolveAdapterScript(adapter, platform);
      } catch (err) {
        process.stderr.write((err as Error).message + "\n");
        process.exit(1);
      }

      const mode = opts.lite ? "lite" : "full";
      const env = { ...process.env, ESP_CORE_DIR: resolveCoreDir() };

      let result: ReturnType<typeof spawnSync>;

      if (platform === "win32") {
        result = spawnSync(
          "powershell",
          ["-ExecutionPolicy", "Bypass", "-File", script, "-Mode", mode],
          { stdio: "inherit", env },
        );
      } else {
        result = spawnSync("bash", [script, mode], { stdio: "inherit", env });
      }

      if (result.status !== 0) {
        process.exit(result.status ?? 1);
      }
    });

  program.parse();
}

function isInvokedAsCli(): boolean {
  if (typeof process === "undefined" || process.argv[1] == null) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);
  } catch {
    return false;
  }
}

if (isInvokedAsCli()) {
  run();
}
