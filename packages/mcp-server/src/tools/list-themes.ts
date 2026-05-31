import type { ToolDefinition } from "../server.js";

export const listThemesTool: ToolDefinition = {
  name: "list_themes",
  description: "List all available excalidraw-skill-pack themes with name, version, and description.",
  inputSchema: {
    type: "object",
    properties: {}
  },
  handler: async (_input: Record<string, unknown>) => {
    return { stub: true };
  }
};
