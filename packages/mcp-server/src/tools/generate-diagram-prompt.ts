import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { loadTheme } from "@excalidraw-skill-pack/core";
import type { ToolDefinition } from "../server.js";

function getCoreRoot(): string {
  const require = createRequire(import.meta.url);
  const coreMain = require.resolve("@excalidraw-skill-pack/core");
  return dirname(dirname(coreMain));
}

export const generateDiagramPromptTool: ToolDefinition = {
  name: "generate_diagram_prompt",
  description:
    "Build a system prompt with active theme palette and optional layout template for an agent to create Excalidraw diagram JSON.",
  inputSchema: {
    type: "object",
    properties: {
      theme: { type: "string", description: "Theme name (default: default-sketchy)" },
      style_template: { type: "string", description: "Layout template name (e.g. concept-card)" },
      intent: { type: "string", description: "What the diagram should argue or show" }
    }
  },
  handler: async (input: Record<string, unknown>) => {
    const themeName = (input["theme"] as string | undefined) ?? "default-sketchy";
    const styleTemplate = input["style_template"] as string | undefined;
    const intent = (input["intent"] as string | undefined) ?? "";

    const coreRoot = getCoreRoot();
    const themesDir = join(coreRoot, "themes");

    const [theme, skill] = await Promise.all([
      loadTheme(themeName, { themesDir }),
      readFile(join(coreRoot, "SKILL.md"), "utf-8")
    ]);

    let layout = "";
    if (styleTemplate) {
      const layoutPath = join(themesDir, themeName, "layouts", `${styleTemplate}.md`);
      layout = await readFile(layoutPath, "utf-8").catch(() => "");
    }

    return {
      theme: themeName,
      intent,
      skill,
      palette_markdown: theme.paletteMarkdown,
      layout,
      typography: theme.typography,
      element_defaults: theme.elements
    };
  }
};
