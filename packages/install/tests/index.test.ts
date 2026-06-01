import { describe, it, expect } from "vitest";
import { resolveAdapterScript } from "../src/index.js";

describe("resolveAdapterScript", () => {
  it("returns posix path on darwin/linux", () => {
    const p = resolveAdapterScript("claude-code", "darwin");
    expect(p).toMatch(/adapters\/claude-code\/install\.sh$/);
  });

  it("returns ps1 path on windows", () => {
    const p = resolveAdapterScript("claude-code", "win32");
    expect(p).toMatch(/adapters[\\/]+claude-code[\\/]+install\.ps1$/);
  });

  it("throws on unknown adapter", () => {
    expect(() => resolveAdapterScript("nope", "linux")).toThrow(/unknown adapter/i);
  });
});
