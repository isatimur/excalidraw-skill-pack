import { readdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { loadTheme } from "@excalidraw-skill-pack/core";
import type { ToolDefinition } from "../server.js";

function getCoreThemesDir(): string {
  const require = createRequire(import.meta.url);
  // Resolves to <core>/dist/index.js; themes/ lives two levels up from dist/
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
    const themesDir = getCoreThemesDir();
    const entries = await readdir(themesDir, { withFileTypes: true });
    const themeDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);

    const themes = await Promise.all(
      themeDirs.map(async (name) => {
        const resolved = await loadTheme(name, { themesDir });
        return {
          name: resolved.manifest.name,
          version: resolved.manifest.version,
          description: resolved.manifest.description,
          source: "bundled" as const
        };
      })
    );

    return { themes };
  }
};
