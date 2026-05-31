import type { ToolDefinition } from "../server.js";

export const renderDiagramTool: ToolDefinition = {
  name: "render_diagram",
  description: "Render Excalidraw JSON to a base64-encoded PNG image.",
  inputSchema: {
    type: "object",
    properties: {
      json: { type: "string", description: "Excalidraw JSON string" },
      theme: { type: "string", description: "Theme name (default: default-sketchy)" },
      scale: { type: "number", description: "Device pixel ratio (default: 2)" },
      width: { type: "number", description: "Viewport width in pixels (default: 1200)" }
    },
    required: ["json"]
  },
  handler: async (_input: Record<string, unknown>) => {
    return { stub: true };
  }
};
