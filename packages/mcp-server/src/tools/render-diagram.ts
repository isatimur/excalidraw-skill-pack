import { PNG } from "pngjs";
import { renderToPng } from "@excalidraw-skill-pack/render";
import type { ToolDefinition } from "../server.js";

function parsePngDimensions(buf: Buffer): { width: number; height: number } {
  const png = PNG.sync.read(buf);
  return { width: png.width, height: png.height };
}

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
  handler: async (input: Record<string, unknown>) => {
    const json = input["json"] as string;
    const scale = (input["scale"] as number | undefined) ?? 2;
    const width = (input["width"] as number | undefined) ?? 1200;

    const buf = await renderToPng(json, { scale, width });
    const { width: w, height: h } = parsePngDimensions(buf);

    return {
      png_base64: buf.toString("base64"),
      width: w,
      height: h
    };
  }
};
