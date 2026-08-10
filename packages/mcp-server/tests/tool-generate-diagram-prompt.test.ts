import { describe, it, expect } from "vitest";
import { generateDiagramPromptTool } from "../src/tools/generate-diagram-prompt.js";

describe("generate_diagram_prompt", () => {
  it("returns skill + palette + selected layout for default-sketchy", async () => {
    const result = (await generateDiagramPromptTool.handler({
      theme: "default-sketchy",
      style_template: "concept-card",
      intent: "Show me a brand-trust feedback loop"
    })) as {
      skill: string;
      palette_markdown: string;
      layout: string;
      theme: string;
      intent: string;
    };
    expect(result.skill).toContain("Diagrams ARGUE, not DISPLAY");
    expect(result.palette_markdown.length).toBeGreaterThan(0);
    expect(result.layout).toContain("concept-card");
    expect(result.theme).toBe("default-sketchy");
    expect(result.intent).toBe("Show me a brand-trust feedback loop");
  });

  it("defaults to default-sketchy when no theme given", async () => {
    const result = (await generateDiagramPromptTool.handler({})) as { theme: string };
    expect(result.theme).toBe("default-sketchy");
  });

  it("splices diagram type reference and taste gate", async () => {
    const result = (await generateDiagramPromptTool.handler({
      diagram_type: "evidence",
      intent: "Explain AG-UI event stream"
    })) as {
      diagram_type: string | null;
      type_reference: string;
      taste_gate: string;
    };
    expect(result.diagram_type).toBe("evidence");
    expect(result.type_reference).toMatch(/Evidence Pipeline/i);
    expect(result.taste_gate).toMatch(/Taste Gate/i);
  });

  it("resolves type aliases like flywheel → loop", async () => {
    const result = (await generateDiagramPromptTool.handler({
      diagram_type: "flywheel"
    })) as { diagram_type: string | null; type_reference: string };
    expect(result.diagram_type).toBe("loop");
    expect(result.type_reference.length).toBeGreaterThan(0);
  });
});
