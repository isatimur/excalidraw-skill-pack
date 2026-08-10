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
