import type { ToolDefinition } from "../server.js";

export interface Issue {
  severity: "error" | "warning" | "info";
  message: string;
  path?: string;
}

const KNOWN_ELEMENT_TYPES = new Set([
  "rectangle", "ellipse", "diamond", "arrow", "line", "text",
  "image", "freedraw", "frame", "embeddable"
]);

const SHAPE_TYPES = new Set(["rectangle", "ellipse", "diamond"]);

const GEOMETRY_SCAN_CAP = 500;
const OFF_CANVAS_GAP = 5000;
const ABSOLUTE_FAR = 20000;

type GeometryBox = {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

function approxEqual(a: number, b: number, tol = 4): boolean {
  return Math.abs(a - b) <= tol;
}

function aabbGap(a: GeometryBox, b: GeometryBox): number {
  const gapX = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width));
  const gapY = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height));
  return Math.max(gapX, gapY);
}

function dominantClusterIndexes(boxes: GeometryBox[]): Set<number> | null {
  if (boxes.length <= 1) {
    return null;
  }

  const parent = boxes.map((_, i) => i);
  const find = (i: number): number => {
    let root = i;
    while (parent[root] !== root) {
      root = parent[root]!;
    }
    let cursor = i;
    while (parent[cursor] !== cursor) {
      const next = parent[cursor]!;
      parent[cursor] = root;
      cursor = next;
    }
    return root;
  };
  const union = (i: number, j: number): void => {
    const ri = find(i);
    const rj = find(j);
    if (ri !== rj) {
      parent[rj] = ri;
    }
  };

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (aabbGap(boxes[i]!, boxes[j]!) <= OFF_CANVAS_GAP) {
        union(i, j);
      }
    }
  }

  const members = new Map<number, number[]>();
  for (let i = 0; i < boxes.length; i++) {
    const root = find(i);
    const list = members.get(root);
    if (list) {
      list.push(i);
    } else {
      members.set(root, [i]);
    }
  }

  let best: number[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const group of members.values()) {
    let cx = 0;
    let cy = 0;
    for (const i of group) {
      const b = boxes[i]!;
      cx += b.x + b.width / 2;
      cy += b.y + b.height / 2;
    }
    cx /= group.length;
    cy /= group.length;
    const originDist = Math.hypot(cx, cy);
    // Prefer larger clusters; tie-break toward the cluster nearer the origin.
    const better =
      best === null ||
      group.length > best.length ||
      (group.length === best.length && originDist < bestScore);
    if (better) {
      best = group;
      bestScore = originDist;
    }
  }

  if (!best) {
    return null;
  }
  return new Set(best.map((i) => boxes[i]!.index));
}

export function auditDiagram(json: string): Issue[] {
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

  const geometryElements = elements.flatMap((raw, index) => {
    if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
      return [];
    }

    const el = raw as Record<string, unknown>;
    const type = el["type"];
    const x = Number(el["x"]);
    const y = Number(el["y"]);
    const width = Number(el["width"]);
    const height = Number(el["height"]);

    if (
      el["isDeleted"] === true ||
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      return [];
    }

    return [{ index, el, type, x, y, width, height }];
  });

  const shapeBoxes = geometryElements.filter(({ type }) => typeof type === "string" && SHAPE_TYPES.has(type));
  // Off-canvas must match the renderer bbox: every box-bearing element can inflate export bounds.
  const canvasBoxes: GeometryBox[] = geometryElements.map(({ index, x, y, width, height }) => ({
    index,
    x,
    y,
    width,
    height
  }));

  if (shapeBoxes.length > GEOMETRY_SCAN_CAP) {
    issues.push({
      severity: "info",
      message: `Geometry: skipped pairwise overlap scan (${shapeBoxes.length} shapes > ${GEOMETRY_SCAN_CAP}) — split the diagram or raise the budget`
    });
  } else {
    let overlapWarnings = 0;
    for (let i = 0; i < shapeBoxes.length && overlapWarnings < 8; i++) {
      const a = shapeBoxes[i]!;
      const aArea = a.width * a.height;
      if (aArea <= 0) {
        continue;
      }

      for (let j = i + 1; j < shapeBoxes.length && overlapWarnings < 8; j++) {
        const b = shapeBoxes[j]!;
        const bArea = b.width * b.height;
        if (bArea <= 0) {
          continue;
        }

        // Strict containment of a smaller shape = intentional nesting (zone/card)
        const aContainsB =
          a.x <= b.x && a.y <= b.y && a.x + a.width >= b.x + b.width && a.y + a.height >= b.y + b.height;
        const bContainsA =
          b.x <= a.x && b.y <= a.y && b.x + b.width >= a.x + a.width && b.y + b.height >= a.y + a.height;
        if ((aContainsB && aArea > bArea * 1.05) || (bContainsA && bArea > aArea * 1.05)) {
          continue;
        }

        const overlapWidth = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
        const overlapHeight = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
        if (overlapWidth * overlapHeight > Math.min(aArea, bArea) * 0.01) {
          issues.push({
            severity: "warning",
            message: `Geometry: shapes overlap — elements[${a.index}] and elements[${b.index}]`
          });
          overlapWarnings += 1;
        }
      }
    }
  }

  for (const candidate of shapeBoxes) {
    if (candidate.width <= 0 || candidate.height <= 0) {
      issues.push({
        severity: "warning",
        message: `Geometry: shape has non-positive dimensions — elements[${candidate.index}]`
      });
    }
  }

  let offCanvasCluster: Set<number> | null = null;
  if (canvasBoxes.length > GEOMETRY_SCAN_CAP) {
    issues.push({
      severity: "info",
      message: `Geometry: skipped cluster off-canvas scan (${canvasBoxes.length} elements > ${GEOMETRY_SCAN_CAP}) — split the diagram or raise the budget`
    });
  } else {
    offCanvasCluster = dominantClusterIndexes(canvasBoxes);
  }

  for (const candidate of canvasBoxes) {
    if (candidate.width <= 0 || candidate.height <= 0) {
      continue;
    }

    const absoluteFar =
      Math.abs(candidate.x) > ABSOLUTE_FAR || Math.abs(candidate.y) > ABSOLUTE_FAR;
    const farNegativeAlone =
      candidate.x + candidate.width < -1000 || candidate.y + candidate.height < -1000;
    const outsideDominant =
      offCanvasCluster !== null &&
      offCanvasCluster.size > 0 &&
      !offCanvasCluster.has(candidate.index);

    if (absoluteFar || farNegativeAlone || outsideDominant) {
      issues.push({
        severity: "warning",
        message: `Geometry: element is off-canvas — elements[${candidate.index}]`
      });
    }
  }

  if (!isSkeleton) {
    const containers = new Map<string, { x: number; y: number; width: number; height: number }>();
    for (const { el, x, y, width, height } of geometryElements) {
      if (typeof el["id"] === "string") {
        containers.set(el["id"], { x, y, width, height });
      }
    }

    for (const { index, el, type, x, y, width, height } of geometryElements) {
      if (type !== "text" || typeof el["containerId"] !== "string") {
        continue;
      }

      const containerId = el["containerId"];
      if (typeof el["id"] === "string" && el["id"] === containerId) {
        issues.push({
          severity: "warning",
          message: `Geometry: bound text containerId is self-referential — elements[${index}]`
        });
        continue;
      }

      const container = containers.get(containerId);
      if (!container) {
        issues.push({
          severity: "warning",
          message: `Geometry: bound text containerId is missing — elements[${index}]`
        });
        continue;
      }

      const sizeOverflow = width > container.width + 4 || height > container.height + 4;
      const positionOverflow =
        x < container.x - 4 ||
        y < container.y - 4 ||
        x + width > container.x + container.width + 4 ||
        y + height > container.y + container.height + 4;

      if (sizeOverflow || positionOverflow) {
        issues.push({
          severity: "warning",
          message: `Geometry: bound text overflows container — elements[${index}]`
        });
      }
    }
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
