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

const SHAPE_TYPES = new Set(["rectangle", "ellipse", "diamond"]);

function approxEqual(a: number, b: number, tol = 4): boolean {
  return Math.abs(a - b) <= tol;
}

function auditDiagram(json: string): Issue[] {
  const issues: Issue[] = [];

  let data: unknown;
  try {
    data = JSON.parse(json) as unknown;
  } catch {
    return [{ severity: "error", message: "Invalid JSON: cannot parse diagram" }];
  }

  if (data === null || typeof data !== "object" || Array.isArray(data)) {
    return [{ severity: "error", message: "Diagram JSON must be a non-null object" }];
  }

  const doc = data as Record<string, unknown>;
  const docType = doc["type"];
  const isSkeleton = docType === "excalidraw-skeleton";
  const isMermaid = docType === "mermaid";

  if (docType !== "excalidraw" && !isSkeleton && !isMermaid) {
    issues.push({
      severity: "error",
      message: `Missing or invalid "type" field — expected "excalidraw", "excalidraw-skeleton", or "mermaid", got ${JSON.stringify(docType)}`
    });
  }

  if (isMermaid) {
    if (typeof doc["definition"] !== "string" || !(doc["definition"] as string).trim()) {
      issues.push({ severity: "error", message: 'Mermaid diagram missing non-empty "definition"', path: "definition" });
    } else {
      issues.push({
        severity: "info",
        message: "Mermaid fast-path detected — switch to skeleton if the result reads as a labeled grid instead of a visual argument"
      });
    }
    return issues;
  }

  const elements = doc["elements"];
  if (!Array.isArray(elements)) {
    issues.push({ severity: "error", message: '"elements" must be an array', path: "elements" });
    return issues;
  }

  if (elements.length === 0) {
    issues.push({ severity: "warning", message: "Diagram has no elements — canvas is empty" });
    return issues;
  }

  let shapeCount = 0;
  let textCount = 0;
  let containerizedText = 0;
  let freeText = 0;
  let lowOpacity = 0;
  let nonstandardLabel = 0;
  const shapeSizes: Array<{ w: number; h: number }> = [];

  for (let i = 0; i < elements.length; i++) {
    const raw = elements[i];
    const path = `elements[${i}]`;

    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      issues.push({
        severity: "error",
        message: "Element must be a non-null object",
        path
      });
      continue;
    }

    const el = raw as Record<string, unknown>;

    if (!el["type"]) {
      issues.push({ severity: "error", message: `Element is missing required "type" field`, path });
      continue;
    }

    const elType = el["type"] as string;

    if (!KNOWN_ELEMENT_TYPES.has(elType)) {
      issues.push({
        severity: "warning",
        message: `Unknown element type "${elType}"`,
        path
      });
    }

    for (const field of ["x", "y"] as const) {
      if (el[field] === undefined || el[field] === null) {
        issues.push({
          severity: "error",
          message: `Element missing required geometry field "${field}"`,
          path
        });
      }
    }

    if (SHAPE_TYPES.has(elType) || elType === "frame" || elType === "image") {
      for (const field of ["width", "height"] as const) {
        if (el[field] === undefined || el[field] === null) {
          issues.push({
            severity: "error",
            message: `Element missing required geometry field "${field}"`,
            path
          });
        }
      }
    }

    if (!el["strokeColor"] && elType !== "frame") {
      issues.push({
        severity: "warning",
        message: `Element has no strokeColor — will use Excalidraw default`,
        path
      });
    }

    if (typeof el["opacity"] === "number" && el["opacity"] < 100) {
      lowOpacity += 1;
      issues.push({
        severity: "warning",
        message: `Opacity ${el["opacity"]} < 100 — hierarchy should come from color/scale/spacing, not transparency`,
        path
      });
    } else if (el["opacity"] === undefined && elType !== "frame") {
      issues.push({
        severity: "info",
        message: `Element omits opacity — hydrate/renderer defaults apply; prefer explicit opacity: 100`,
        path
      });
    }

    if (!isSkeleton && "label" in el && el["label"] !== undefined && el["label"] !== null) {
      nonstandardLabel += 1;
      issues.push({
        severity: "error",
        message: 'Nonstandard "label" property on full element — use a bound text element with containerId instead',
        path
      });
    }

    if (SHAPE_TYPES.has(elType)) {
      shapeCount += 1;
      const w = Number(el["width"]);
      const h = Number(el["height"]);
      if (Number.isFinite(w) && Number.isFinite(h)) {
        shapeSizes.push({ w, h });
      }
    }

    if (elType === "text") {
      textCount += 1;
      if (el["containerId"]) {
        containerizedText += 1;
      } else {
        freeText += 1;
      }
    }
  }

  if (shapeCount > 9) {
    issues.push({
      severity: "warning",
      message: `Taste gate: ${shapeCount} primary shapes exceeds the simple-diagram budget of 9 — split into overview + detail or delete until density ~4/10`
    });
  }

  if (textCount > 0) {
    const ratio = containerizedText / textCount;
    if (ratio > 0.3) {
      issues.push({
        severity: "warning",
        message: `Taste gate: ${(ratio * 100).toFixed(0)}% of text is containerized (target <30%) — prefer free-floating text for labels`
      });
    }
  }

  if (shapeSizes.length >= 4) {
    let equalPairs = 0;
    for (let i = 0; i < shapeSizes.length; i++) {
      for (let j = i + 1; j < shapeSizes.length; j++) {
        const a = shapeSizes[i]!;
        const b = shapeSizes[j]!;
        if (approxEqual(a.w, b.w) && approxEqual(a.h, b.h)) {
          equalPairs += 1;
        }
      }
    }
    const maxPairs = (shapeSizes.length * (shapeSizes.length - 1)) / 2;
    if (equalPairs / maxPairs >= 0.6) {
      issues.push({
        severity: "warning",
        message: "Taste gate: most shapes share nearly identical size — uniform card grids erase hierarchy; vary scale by importance"
      });
    }
  }

  if (freeText === 0 && textCount > 0 && shapeCount >= 3) {
    issues.push({
      severity: "info",
      message: "No free-floating text detected — titles, annotations, and evidence often work better outside containers"
    });
  }

  if (lowOpacity === 0 && nonstandardLabel === 0 && shapeCount > 0 && shapeCount <= 9) {
    issues.push({
      severity: "info",
      message: "Structural audit clean on opacity/labels/budget — still run the render-inspect loop and taste-gate remove-test before shipping"
    });
  }

  return issues;
}

export const auditDiagramTool: ToolDefinition = {
  name: "audit_diagram",
  description:
    "Validate Excalidraw JSON (full, skeleton, or mermaid) and report structural + taste-gate issues (budget, container ratio, uniform boxes, opacity, nonstandard labels).",
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
