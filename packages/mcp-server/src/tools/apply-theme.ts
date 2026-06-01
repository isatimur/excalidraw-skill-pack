import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { loadTheme } from "@excalidraw-skill-pack/core";
import type { Palette } from "@excalidraw-skill-pack/core";
import type { ToolDefinition } from "../server.js";

function getCoreThemesDir(): string {
  const require = createRequire(import.meta.url);
  const coreMain = require.resolve("@excalidraw-skill-pack/core");
  return join(dirname(dirname(coreMain)), "themes");
}

function buildColorMapping(source: Palette, target: Palette): Record<string, string> {
  const mapping: Record<string, string> = {};
  const roles = [
    "ink", "paper", "accent", "accent_alt",
    "evidence_bg", "evidence_text", "muted", "warning", "danger"
  ] as const;

  for (const role of roles) {
    const srcColor = source[role];
    const tgtColor = target[role];
    if (srcColor && tgtColor && srcColor !== tgtColor) {
      mapping[srcColor.toLowerCase()] = tgtColor as string;
    }
  }

  return mapping;
}

function swapColors(
  elements: Array<Record<string, unknown>>,
  mapping: Record<string, string>
): Array<Record<string, unknown>> {
  return elements.map((el) => {
    const out = { ...el };
    for (const field of ["strokeColor", "backgroundColor"] as const) {
      const val = el[field];
      if (typeof val === "string") {
        const swapped = mapping[val.toLowerCase()];
        if (swapped) out[field] = swapped;
      }
    }
    return out;
  });
}

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
  handler: async (input: Record<string, unknown>) => {
    const json = input["json"] as string;
    const targetThemeName = input["target_theme"] as string;
    const shouldRender = Boolean(input["render"]);

    const themesDir = getCoreThemesDir();

    const data = JSON.parse(json) as {
      type: string;
      elements?: Array<Record<string, unknown>>;
      [key: string]: unknown;
    };

    const targetTheme = await loadTheme(targetThemeName, { themesDir });

    // Derive source palette from the diagram's existing colors if no explicit source theme;
    // use default-sketchy as the canonical source for role lookups
    const sourceTheme = await loadTheme("default-sketchy", { themesDir });
    const mapping = buildColorMapping(sourceTheme.palette, targetTheme.palette);

    const transformedElements = swapColors(data.elements ?? [], mapping);
    const transformed = { ...data, elements: transformedElements };
    const transformedJson = JSON.stringify(transformed);

    const out: Record<string, unknown> = {
      json: transformedJson,
      mapping
    };

    if (shouldRender) {
      const { renderToPng } = await import("excalidraw-render");
      const { PNG } = await import("pngjs");
      const buf = await renderToPng(transformedJson, {});
      const png = PNG.sync.read(buf);
      out["png_base64"] = buf.toString("base64");
      out["width"] = png.width;
      out["height"] = png.height;
    }

    return out;
  }
};
