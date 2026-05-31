import type { ToolDefinition } from "../server.js";

export const auditDiagramTool: ToolDefinition = {
  name: "audit_diagram",
  description: "Validate Excalidraw JSON and report structural issues with severity tags.",
  inputSchema: {
    type: "object",
    properties: {
      json: { type: "string", description: "Excalidraw JSON string" }
    },
    required: ["json"]
  },
  handler: async (_input: Record<string, unknown>) => {
    return { stub: true };
  }
};
