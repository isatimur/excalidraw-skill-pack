import type { ToolDefinition } from "../server.js";

interface Issue {
  severity: "error" | "warning" | "info";
  message: string;
  path?: string;
}

const KNOWN_ELEMENT_TYPES = new Set([
  "rectangle", "ellipse", "diamond", "arrow", "line", "text",
  "image", "freedraw", "frame", "embeddable"
]);

function auditDiagram(json: string): Issue[] {
  const issues: Issue[] = [];

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(json) as Record<string, unknown>;
  } catch {
    return [{ severity: "error", message: "Invalid JSON: cannot parse diagram" }];
  }

  if (data["type"] !== "excalidraw") {
    issues.push({
      severity: "error",
      message: `Missing or invalid "type" field — expected "excalidraw", got ${JSON.stringify(data["type"])}`
    });
  }

  const elements = data["elements"];
  if (!Array.isArray(elements)) {
    issues.push({ severity: "error", message: '"elements" must be an array', path: "elements" });
    return issues;
  }

  if (elements.length === 0) {
    issues.push({ severity: "warning", message: "Diagram has no elements — canvas is empty" });
    return issues;
  }

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i] as Record<string, unknown>;
    const path = `elements[${i}]`;

    if (!el["type"]) {
      issues.push({ severity: "error", message: `Element is missing required "type" field`, path });
      continue;
    }

    if (!KNOWN_ELEMENT_TYPES.has(el["type"] as string)) {
      issues.push({
        severity: "warning",
        message: `Unknown element type "${el["type"]}"`,
        path
      });
    }

    for (const field of ["x", "y", "width", "height"] as const) {
      if (el[field] === undefined || el[field] === null) {
        issues.push({
          severity: "error",
          message: `Element missing required geometry field "${field}"`,
          path
        });
      }
    }

    if (!el["strokeColor"]) {
      issues.push({
        severity: "warning",
        message: `Element has no strokeColor — will use Excalidraw default`,
        path
      });
    }
  }

  return issues;
}

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
  handler: async (input: Record<string, unknown>) => {
    const json = input["json"] as string;
    const issues = auditDiagram(json);
    return { issues };
  }
};
