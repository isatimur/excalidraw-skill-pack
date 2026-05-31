import { describe, it, expect } from "vitest";
import { listToolDefinitions } from "../src/server.js";

describe("server tool registration", () => {
  it("registers all 5 tools", () => {
    const tools = listToolDefinitions();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([
      "apply_theme",
      "audit_diagram",
      "generate_diagram_prompt",
      "list_themes",
      "render_diagram"
    ]);
  });

  it("every tool has a description and inputSchema", () => {
    for (const t of listToolDefinitions()) {
      expect(t.description).toBeTruthy();
      expect(t.inputSchema).toBeTypeOf("object");
    }
  });
});
