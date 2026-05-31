import type { ToolDefinition } from "../server.js";

export const applyThemeTool: ToolDefinition = {
  name: "apply_theme",
  description:
    "Re-colour an existing Excalidraw diagram's elements using a target theme's role-based palette.",
  inputSchema: {
    type: "object",
    properties: {
      json: { type: "string", description: "Excalidraw JSON string" },
      target_theme: { type: "string", description: "Theme to apply" },
      render: { type: "boolean", description: "Also render to PNG and include png_base64" }
    },
    required: ["json", "target_theme"]
  },
  handler: async (_input: Record<string, unknown>) => {
    return { stub: true };
  }
};
