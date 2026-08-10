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

const TYPE_ALIASES: Record<string, string> = {
  architecture: "architecture",
  flowchart: "flowchart",
  flow: "flowchart",
  sequence: "sequence",
  state: "state",
  "state-machine": "state",
  er: "er",
  "data-model": "er",
  timeline: "timeline",
  swimlane: "swimlane",
  quadrant: "quadrant",
  loop: "loop",
  flywheel: "loop",
  nested: "nested",
  tree: "tree",
  "org-chart": "org-chart",
  org: "org-chart",
  layers: "layers",
  "layer-stack": "layers",
  venn: "venn",
  pyramid: "pyramid",
  funnel: "pyramid",
  process: "process",
  evidence: "evidence",
  protocol: "evidence",
  comparison: "comparison",
  "before-after": "comparison",
  medallion: "medallion",
  "data-flow": "data-flow",
  "it-state": "it-state",
  "it-current-state": "it-state",
  "high-level": "high-level",
  "dp-integration": "dp-integration",
  "dp-security-matrix": "dp-security-matrix",
  radar: "radar",
  gantt: "gantt",
  bar: "bar",
  line: "line",
  scatter: "scatter"
};

function resolveTypeSlug(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase();
  return TYPE_ALIASES[key] ?? (key.startsWith("type-") ? key.slice(5) : key);
}

export const generateDiagramPromptTool: ToolDefinition = {
  name: "generate_diagram_prompt",
  description:
    "Build a system prompt with active theme palette, optional layout template, optional diagram type reference, and taste-gate checklist for an agent to create Excalidraw diagram JSON.",
  inputSchema: {
    type: "object",
    properties: {
      theme: { type: "string", description: "Theme name (default: default-sketchy)" },
      style_template: { type: "string", description: "Layout template name (e.g. concept-card)" },
      diagram_type: {
        type: "string",
        description:
          "Progressive type ref to splice in (architecture, flowchart, sequence, evidence, comparison, …). See packages/core/references/types/."
      },
      intent: { type: "string", description: "What the diagram should argue or show" },
      include_taste_gate: {
        type: "boolean",
        description: "Include taste-gate.md checklist (default: true)"
      }
    }
  },
  handler: async (input: Record<string, unknown>) => {
    const themeName = (input["theme"] as string | undefined) ?? "default-sketchy";
    const styleTemplate = input["style_template"] as string | undefined;
    const intent = (input["intent"] as string | undefined) ?? "";
    const includeTasteGate = input["include_taste_gate"] !== false;
    const typeSlug = resolveTypeSlug(input["diagram_type"] as string | undefined);

    const coreRoot = getCoreRoot();
    const themesDir = join(coreRoot, "themes");
    const refsDir = join(coreRoot, "references");

    const [theme, skill] = await Promise.all([
      loadTheme(themeName, { themesDir }),
      readFile(join(coreRoot, "SKILL.md"), "utf-8")
    ]);

    let layout = "";
    if (styleTemplate) {
      const layoutPath = join(themesDir, themeName, "layouts", `${styleTemplate}.md`);
      layout = await readFile(layoutPath, "utf-8").catch(() => "");
    }

    let type_reference = "";
    let diagram_type: string | null = null;
    if (typeSlug) {
      const typePath = join(refsDir, "types", `type-${typeSlug}.md`);
      type_reference = await readFile(typePath, "utf-8").catch(() => "");
      if (type_reference) {
        diagram_type = typeSlug;
      }
    }

    let taste_gate = "";
    if (includeTasteGate) {
      taste_gate = await readFile(join(refsDir, "taste-gate.md"), "utf-8").catch(() => "");
    }

    return {
      theme: themeName,
      intent,
      diagram_type,
      skill,
      palette_markdown: theme.paletteMarkdown,
      layout,
      type_reference,
      taste_gate,
      typography: theme.typography,
      element_defaults: theme.elements
    };
  }
};
