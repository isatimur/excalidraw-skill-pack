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

  it("returns empty issues for a valid minimal diagram", async () => {
    const json = JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "test",
      elements: [{ type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" }]
    });
    const result = (await auditDiagramTool.handler({ json })) as { issues: unknown[] };
    expect(result.issues).toEqual([]);
  });
});
