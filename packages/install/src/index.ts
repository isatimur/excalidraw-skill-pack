#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";
import { Command } from "commander";

const KNOWN_ADAPTERS = ["claude-code", "cursor", "codex", "gemini-cli"] as const;
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

  const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const ext = platform === "win32" ? "install.ps1" : "install.sh";
  return join(root, "adapters", adapter, ext);
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

      const env = { ...process.env, ...(opts.lite ? { LITE: "1" } : {}) };

      let result: ReturnType<typeof spawnSync>;

      if (platform === "win32") {
        result = spawnSync("powershell", ["-ExecutionPolicy", "Bypass", "-File", script], {
          stdio: "inherit",
          env,
        });
      } else {
        result = spawnSync("bash", [script], { stdio: "inherit", env });
      }

      if (result.status !== 0) {
        process.exit(result.status ?? 1);
      }
    });

  program.parse();
}

const isMain =
  typeof process !== "undefined" &&
  process.argv[1] != null &&
  fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  run();
}
