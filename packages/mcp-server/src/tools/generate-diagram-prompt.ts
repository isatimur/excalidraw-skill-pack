import type { ToolDefinition } from "../server.js";

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
  handler: async (_input: Record<string, unknown>) => {
    return { stub: true };
  }
};
