import { describe, it, expect } from "vitest";
import { validateThemeJson } from "../src/validate-theme.js";

describe("validateThemeJson", () => {
  it("accepts a minimal valid manifest", () => {
    const result = validateThemeJson({ name: "my-theme", version: "1.0.0" });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects manifest missing name", () => {
    const result = validateThemeJson({ version: "1.0.0" });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/name/i);
  });

  it("rejects manifest with bad name pattern", () => {
    const result = validateThemeJson({ name: "BadName", version: "1.0.0" });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/pattern/i);
  });

  it("rejects manifest with non-semver version", () => {
    const result = validateThemeJson({ name: "ok", version: "1.0" });
    expect(result.valid).toBe(false);
    expect(result.errors.join(" ")).toMatch(/version/i);
  });
});
