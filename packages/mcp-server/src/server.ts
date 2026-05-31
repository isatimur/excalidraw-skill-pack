#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { generateDiagramPromptTool } from "./tools/generate-diagram-prompt.js";
import { renderDiagramTool } from "./tools/render-diagram.js";
import { auditDiagramTool } from "./tools/audit-diagram.js";
import { listThemesTool } from "./tools/list-themes.js";
import { applyThemeTool } from "./tools/apply-theme.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (input: Record<string, unknown>) => Promise<unknown>;
}

const TOOLS: ToolDefinition[] = [
  generateDiagramPromptTool,
  renderDiagramTool,
  auditDiagramTool,
  listThemesTool,
  applyThemeTool
];

export function listToolDefinitions(): ToolDefinition[] {
  return TOOLS;
}

export async function main() {
  const server = new Server(
    { name: "excalidraw-skill-pack", version: "0.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = TOOLS.find((t) => t.name === request.params.name);
    if (!tool) {
      return {
        content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }],
        isError: true
      };
    }
    try {
      const result = await tool.handler(
        (request.params.arguments ?? {}) as Record<string, unknown>
      );
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: "text", text: message }],
        isError: true
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
