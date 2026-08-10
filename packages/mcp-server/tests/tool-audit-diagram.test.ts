import { describe, it, expect } from "vitest";
import { auditDiagramTool } from "../src/tools/audit-diagram.js";

describe("audit_diagram", () => {
  it("flags missing type field as error", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({ elements: [] })
    })) as { issues: Array<{ severity: string; message: string }> };
    const messages = result.issues.map((i) => i.message);
    expect(messages.join(" ")).toMatch(/type/i);
  });

  it("flags empty elements as warning", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({ type: "excalidraw", elements: [] })
    })) as { issues: Array<{ severity: string; message: string }> };
    const warnings = result.issues.filter((i) => i.severity === "warning");
    expect(warnings.length).toBeGreaterThan(0);
  });

  it("returns no errors for a valid minimal diagram", async () => {
    const json = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "test",
      elements: [{ type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" }]
    });
    const result = (await auditDiagramTool.handler({ json })) as {
      issues: Array<{ severity: string; message: string }>;
    };
    expect(result.issues.filter((i) => i.severity === "error")).toEqual([]);
  });

  it("flags taste-gate budget when too many equal shapes", async () => {
    const shapes = Array.from({ length: 10 }, (_, i) => ({
      type: "rectangle",
      x: i * 120,
      y: 0,
      width: 100,
      height: 80,
      strokeColor: "#1e1e1e"
    }));
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({ type: "excalidraw", elements: shapes })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => /budget of 9/i.test(i.message))).toBe(true);
    expect(result.issues.some((i) => /identical size/i.test(i.message))).toBe(true);
  });

  it("flags overlapping shapes", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({
        type: "excalidraw",
        elements: [
          { type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" },
          { type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" }
        ]
      })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => i.message.includes("Geometry: shapes overlap"))).toBe(true);
  });

  it("does not flag non-overlapping shapes", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({
        type: "excalidraw",
        elements: [
          { type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" },
          { type: "ellipse", x: 150, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" }
        ]
      })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => i.message.includes("Geometry: shapes overlap"))).toBe(false);
  });

  it("flags moderate far-from-cluster off-canvas shapes", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({
        type: "excalidraw",
        elements: [
          { type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" },
          { type: "rectangle", x: 6000, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" }
        ]
      })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => /off-canvas/i.test(i.message))).toBe(true);
  });

  it("does not flag nested cards as overlapping", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({
        type: "excalidraw",
        elements: [
          { type: "rectangle", x: 0, y: 0, width: 300, height: 200, strokeColor: "#1e1e1e" },
          { type: "rectangle", x: 40, y: 40, width: 100, height: 60, strokeColor: "#1e1e1e" }
        ]
      })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => i.message.includes("Geometry: shapes overlap"))).toBe(false);
  });

  it("flags missing bound-text containerId", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({
        type: "excalidraw",
        elements: [
          {
            type: "text",
            x: 0,
            y: 0,
            width: 40,
            height: 20,
            containerId: "missing",
            text: "Hi",
            strokeColor: "#1e1e1e"
          }
        ]
      })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => /containerId is missing/i.test(i.message))).toBe(true);
  });

  it("flags far-positive off-canvas shapes", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({
        type: "excalidraw",
        elements: [
          { type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" },
          { type: "rectangle", x: 50000, y: 50000, width: 100, height: 100, strokeColor: "#1e1e1e" }
        ]
      })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => /off-canvas/i.test(i.message))).toBe(true);
  });

  it("flags bound text that is sized ok but positioned outside its container", async () => {
    const result = (await auditDiagramTool.handler({
      json: JSON.stringify({
        type: "excalidraw",
        elements: [
          { id: "box", type: "rectangle", x: 0, y: 0, width: 120, height: 80, strokeColor: "#1e1e1e" },
          {
            type: "text",
            x: 400,
            y: 400,
            width: 40,
            height: 20,
            containerId: "box",
            text: "Hi",
            strokeColor: "#1e1e1e"
          }
        ]
      })
    })) as { issues: Array<{ severity: string; message: string }> };
    expect(result.issues.some((i) => /bound text overflows/i.test(i.message))).toBe(true);
  });

  it("reports no geometry issues on the competitive showcase fixture", async () => {
    const { readFile } = await import("node:fs/promises");
    const { fileURLToPath } = await import("node:url");
    const { dirname, join } = await import("node:path");
    const here = dirname(fileURLToPath(import.meta.url));
    const fixture = join(
      here,
      "..",
      "..",
      "shared",
      "fixtures",
      "competitive",
      "why-editable-beats-static.excalidraw"
    );
    const json = await readFile(fixture, "utf-8");
    const result = (await auditDiagramTool.handler({ json })) as {
      issues: Array<{ severity: string; message: string }>;
    };
    expect(result.issues.some((i) => i.message.startsWith("Geometry:"))).toBe(false);
  });

  it("rejects null document and null elements without crashing", async () => {
    const nullDoc = (await auditDiagramTool.handler({ json: "null" })) as {
      issues: Array<{ severity: string; message: string }>;
    };
    expect(nullDoc.issues.some((i) => i.severity === "error")).toBe(true);

    const nullEl = (await auditDiagramTool.handler({
      json: JSON.stringify({ type: "excalidraw", elements: [null] })
    })) as { issues: Array<{ severity: string; message: string; path?: string }> };
    expect(nullEl.issues.some((i) => i.path === "elements[0]" && i.severity === "error")).toBe(true);
  });
});
