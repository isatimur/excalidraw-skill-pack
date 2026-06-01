import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { discoverInstalledThemes } from "@excalidraw-skill-pack/core";
import type { ToolDefinition } from "../server.js";

function getCoreThemesDir(): string {
  const require = createRequire(import.meta.url);
  const coreMain = require.resolve("@excalidraw-skill-pack/core");
  return join(dirname(dirname(coreMain)), "themes");
}

export const listThemesTool: ToolDefinition = {
  name: "list_themes",
  description: "List all available excalidraw-skill-pack themes with name, version, and description.",
  inputSchema: {
    type: "object",
    properties: {}
  },
  handler: async (_input: Record<string, unknown>) => {
    const bundledThemesDir = getCoreThemesDir();
    const discovered = await discoverInstalledThemes({
      bundledThemesDir,
      nodeModulesRoot: process.cwd()
    });

    const themes = discovered.map((d) => ({
      name: d.name,
      version: d.version,
      description: d.manifest.description,
      source: d.source
    }));

    return { themes };
  }
};
