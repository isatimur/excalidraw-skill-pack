import { mkdir, readdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Mustache from "mustache";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEMPLATE_DIR = join(__dirname, "template");

const KEBAB = /^[a-z][a-z0-9-]*$/;

export interface ScaffoldOptions {
  slug: string;
  description: string;
  author: string;
  parent: string;
  cwd: string;
}

export async function scaffoldTheme(opts: ScaffoldOptions): Promise<string> {
  if (!KEBAB.test(opts.slug)) {
    throw new Error(`slug must be kebab-case (lower, hyphens): got "${opts.slug}"`);
  }
  const outDir = join(opts.cwd, `theme-${opts.slug}`);
  await mkdir(outDir, { recursive: true });
  await mkdir(join(outDir, "elements"), { recursive: true });
  await mkdir(join(outDir, "layouts"), { recursive: true });

  const slugUnderscored = opts.slug.replaceAll("-", "_");
  await mkdir(join(outDir, "src", `excalidraw_skill_pack_theme_${slugUnderscored}`), {
    recursive: true
  });

  const view = {
    slug: opts.slug,
    slug_underscored: slugUnderscored,
    description: opts.description,
    author: opts.author,
    parent: opts.parent
  };

  for (const entry of await readdir(TEMPLATE_DIR)) {
    const src = join(TEMPLATE_DIR, entry);
    const s = await stat(src);
    if (!s.isFile()) continue;
    if (entry.endsWith(".mustache")) {
      const template = await readFile(src, "utf-8");
      const rendered = Mustache.render(template, view);
      const outName = entry.replace(/\.mustache$/, "");
      if (outName === "__init__.py") {
        await writeFile(
          join(outDir, "src", `excalidraw_skill_pack_theme_${slugUnderscored}`, "__init__.py"),
          rendered
        );
      } else {
        await writeFile(join(outDir, outName), rendered);
      }
    } else {
      await copyFile(src, join(outDir, entry));
    }
  }
  return outDir;
}
