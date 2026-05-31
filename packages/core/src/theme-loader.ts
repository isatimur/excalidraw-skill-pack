import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

export interface ThemeManifest {
  name: string;
  version: string;
  extends?: string;
  description?: string;
  preview?: string;
  homepage?: string;
  license?: string;
  author?: string | Record<string, unknown>;
  roles?: Record<string, string>;
}

export interface Palette {
  ink: string;
  paper: string;
  accent: string;
  accent_alt?: string;
  evidence_bg?: string;
  evidence_text?: string;
  muted?: string;
  warning?: string;
  danger?: string;
  syntax?: Record<string, string>;
  [key: string]: unknown;
}

export interface Typography {
  fontFamily: number;
  fontFamilyName: string;
  fontSize: { small: number; medium: number; large: number; heading: number };
  italicPolicy: string;
}

export interface ElementOverride {
  strokeColor?: string;
  backgroundColor?: string;
  strokeWidth?: number;
  strokeStyle?: string;
  roughness?: number;
  roundness?: { type: number };
  fillStyle?: string;
  startArrowhead?: string | null;
  endArrowhead?: string | null;
}

export interface ResolvedTheme {
  manifest: ThemeManifest;
  palette: Palette;
  typography: Typography;
  elements: Record<string, ElementOverride>;
  layouts: Record<string, string>;
  paletteMarkdown: string;
}

export interface LoadOptions {
  themesDir: string;
}

async function readJson<T>(path: string): Promise<T> {
  return JSON.parse(await readFile(path, "utf-8")) as T;
}

async function readDirSafe(path: string): Promise<string[]> {
  try {
    return await readdir(path);
  } catch {
    return [];
  }
}

async function loadOne(themeDir: string): Promise<Partial<ResolvedTheme>> {
  const manifest = await readJson<ThemeManifest>(join(themeDir, "theme.json"));
  const palette = await readJson<Palette>(join(themeDir, "palette.json")).catch(
    () => ({}) as Palette
  );
  const typography = await readJson<Typography>(
    join(themeDir, "typography.json")
  ).catch(() => undefined as unknown as Typography);
  const elements: Record<string, ElementOverride> = {};
  for (const f of await readDirSafe(join(themeDir, "elements"))) {
    if (f.endsWith(".json")) {
      const name = f.replace(/\.json$/, "");
      elements[name] = await readJson<ElementOverride>(
        join(themeDir, "elements", f)
      );
    }
  }
  const layouts: Record<string, string> = {};
  for (const f of await readDirSafe(join(themeDir, "layouts"))) {
    if (f.endsWith(".md")) {
      const name = f.replace(/\.md$/, "");
      layouts[name] = await readFile(join(themeDir, "layouts", f), "utf-8");
    }
  }
  const paletteMarkdown = await readFile(join(themeDir, "palette.md"), "utf-8").catch(
    () => ""
  );
  return { manifest, palette, typography, elements, layouts, paletteMarkdown };
}

function mergeThemes(
  parent: Partial<ResolvedTheme>,
  child: Partial<ResolvedTheme>
): Partial<ResolvedTheme> {
  return {
    manifest: child.manifest ?? parent.manifest,
    palette: { ...(parent.palette ?? {}), ...(child.palette ?? {}) } as Palette,
    typography: (child.typography ?? parent.typography) as Typography,
    elements: { ...(parent.elements ?? {}), ...(child.elements ?? {}) },
    layouts: { ...(parent.layouts ?? {}), ...(child.layouts ?? {}) },
    paletteMarkdown: child.paletteMarkdown || parent.paletteMarkdown || ""
  };
}

export async function loadTheme(
  name: string,
  opts: LoadOptions
): Promise<ResolvedTheme> {
  const themeDir = join(opts.themesDir, name);
  try {
    await readFile(join(themeDir, "theme.json"), "utf-8");
  } catch {
    throw new Error(`Theme "${name}" not found at ${themeDir}`);
  }
  let resolved = await loadOne(themeDir);
  const seen = new Set<string>([name]);
  while (resolved.manifest?.extends) {
    const parentName = resolved.manifest.extends;
    if (seen.has(parentName)) {
      throw new Error(`Theme inheritance cycle at ${parentName}`);
    }
    seen.add(parentName);
    const parentDir = join(opts.themesDir, parentName);
    const parent = await loadOne(parentDir);
    resolved = mergeThemes(parent, { ...resolved, manifest: { ...resolved.manifest, extends: undefined } });
  }
  return resolved as ResolvedTheme;
}
