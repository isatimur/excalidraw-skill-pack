import { loadTheme, type ResolvedTheme } from "@excalidraw-skill-pack/core";

export type { ResolvedTheme };

export async function resolveTheme(
  name: string,
  themesDir: string
): Promise<ResolvedTheme> {
  return loadTheme(name, { themesDir });
}
