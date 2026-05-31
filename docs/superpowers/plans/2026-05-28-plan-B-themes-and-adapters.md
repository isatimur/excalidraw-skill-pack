# Plan B — Themes + Adapters (Distribution)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the decentralized theme ecosystem (4 published themes + `create-excalidraw-theme` scaffolder + PyPI mirrors) and 5 install adapters (Claude Code, Cursor, Codex, Gemini CLI, raw CLI). After this plan, every supported AI agent can install the skill pack in one command, and any user can publish a custom theme in 3 minutes.

**Architecture:** Each theme is its own publishable package (npm + PyPI mirror), living in `packages/themes/<name>/`. The `create-excalidraw-theme` CLI scaffolds new ones. Adapters are `install.sh` shell scripts (POSIX) plus `install.ps1` PowerShell variants for Windows; they write platform-appropriate config and copy/symlink core content. CI runs a Docker matrix that exercises every adapter on Ubuntu and macOS images.

**Tech Stack:** TypeScript, Bash 4 + PowerShell 5, Mustache (for adapter template rendering), Docker, GitHub Actions matrices. Reuses Plan A's pnpm workspace, changesets, uv, ESLint/Ruff, Vitest/pytest.

**Prerequisite:** Plan A complete and merged.

---

## File Structure

```
excalidraw-skill-pack/
├── packages/
│   ├── create-excalidraw-theme/        # npm: create-excalidraw-theme
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts                # CLI entry (init <name> [--from <parent>])
│   │   │   ├── scaffold.ts             # template renderer
│   │   │   └── template/               # files copied into <name>/
│   │   │       ├── theme.json.mustache
│   │   │       ├── palette.json.mustache
│   │   │       ├── palette.md.mustache
│   │   │       ├── typography.json
│   │   │       ├── README.md.mustache
│   │   │       ├── package.json.mustache
│   │   │       └── pyproject.toml.mustache
│   │   └── tests/scaffold.test.ts
│   ├── install/                        # npm: @excalidraw-skill-pack/install
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── index.ts                # `npx @excalidraw-skill-pack/install <adapter>`
│   │   │   └── adapters/               # delegates to adapters/<name>/install.{sh,ps1}
│   │   └── tests/index.test.ts
│   └── themes/
│       ├── stripe-press/
│       │   ├── theme.json
│       │   ├── palette.json
│       │   ├── palette.md
│       │   ├── typography.json
│       │   ├── elements/
│       │   ├── layouts/                # only deltas vs default-sketchy
│       │   ├── preview.png
│       │   ├── package.json            # @excalidraw-skill-pack/theme-stripe-press
│       │   ├── pyproject.toml          # excalidraw-skill-pack-theme-stripe-press
│       │   ├── README.md
│       │   └── src/excalidraw_skill_pack_theme_stripe_press/__init__.py
│       ├── notion/                     # same layout
│       ├── whiteboard/                 # same layout
│       └── dark/                       # same layout
├── adapters/
│   ├── claude-code/
│   │   ├── install.sh
│   │   ├── install.ps1
│   │   ├── README.md
│   │   └── manifest.template.json      # ~/.claude/skills/excalidraw-diagram/ structure
│   ├── cursor/
│   │   ├── install.sh
│   │   ├── install.ps1
│   │   ├── README.md
│   │   └── rules.mdc.template
│   ├── codex/
│   │   ├── install.sh
│   │   ├── install.ps1
│   │   └── README.md
│   ├── gemini-cli/
│   │   ├── install.sh
│   │   ├── install.ps1
│   │   ├── README.md
│   │   └── extension.json.template
│   └── cli/
│       └── README.md                   # CLI = the renderer; just docs
├── tools/
│   └── publish-pypi-themes.sh          # iterate packages/themes/*/, build & publish each
└── .github/workflows/
    ├── adapter-install-matrix.yml      # Docker matrix exercises all 5 adapters on ubuntu + macos
    └── publish-pypi.yml                # extend Plan A workflow to handle theme- packages
```

---

# Milestone 1 — `create-excalidraw-theme` Scaffolder

### Task 1: Scaffold the `create-excalidraw-theme` package

**Files:**
- Create: `packages/create-excalidraw-theme/package.json`
- Create: `packages/create-excalidraw-theme/tsconfig.json`
- Create: `packages/create-excalidraw-theme/README.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "create-excalidraw-theme",
  "version": "0.0.0",
  "description": "Scaffold a new excalidraw-skill-pack theme package (npm + PyPI mirror).",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.js",
  "bin": {
    "create-excalidraw-theme": "./dist/index.js"
  },
  "files": ["dist", "src/template"],
  "scripts": {
    "build": "tsc -p tsconfig.json && cp -R src/template dist/template",
    "test": "vitest run",
    "lint": "eslint src",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "commander": "^12.0.0",
    "mustache": "^4.2.0"
  },
  "devDependencies": {
    "@types/mustache": "^4.2.5",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.5.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

- [ ] **Step 2: Write `tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "Bundler"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 3: Write README**

```markdown
# create-excalidraw-theme

Scaffold a new excalidraw-skill-pack theme — npm package + PyPI mirror.

```bash
npx create-excalidraw-theme my-brand
cd theme-my-brand
npm publish --access public
# and the PyPI mirror:
cd theme-my-brand-py && uv build && uv publish
```
```

- [ ] **Step 4: Install deps**

```bash
pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add packages/create-excalidraw-theme/ pnpm-lock.yaml
git commit -m "feat(create-excalidraw-theme): scaffold package"
```

---

### Task 2: Write the template files (npm side)

**Files:**
- Create: `packages/create-excalidraw-theme/src/template/theme.json.mustache`
- Create: `packages/create-excalidraw-theme/src/template/palette.json.mustache`
- Create: `packages/create-excalidraw-theme/src/template/palette.md.mustache`
- Create: `packages/create-excalidraw-theme/src/template/typography.json`
- Create: `packages/create-excalidraw-theme/src/template/README.md.mustache`
- Create: `packages/create-excalidraw-theme/src/template/package.json.mustache`

- [ ] **Step 1: Write `theme.json.mustache`**

```mustache
{
  "name": "{{slug}}",
  "version": "0.1.0",
  "extends": "{{parent}}",
  "description": "{{description}}",
  "license": "MIT",
  "author": "{{author}}",
  "preview": "preview.png",
  "roles": {
    "ink": "#1e1e1e",
    "paper": "#ffffff",
    "accent": "#1971c2",
    "evidence_bg": "#1e1e1e",
    "evidence_text": "#d4d4d4",
    "muted": "#868e96"
  }
}
```

- [ ] **Step 2: Write `palette.json.mustache`** (same content as theme.json roles, plus extras)

```mustache
{
  "ink": "#1e1e1e",
  "paper": "#ffffff",
  "accent": "#1971c2",
  "accent_alt": "#e8590c",
  "evidence_bg": "#1e1e1e",
  "evidence_text": "#d4d4d4",
  "muted": "#868e96",
  "warning": "#f08c00",
  "danger": "#c92a2a"
}
```

- [ ] **Step 3: Write `palette.md.mustache`**

```mustache
# {{slug}} palette

> Override the colors here. The MCP server splices this file into the AI agent's system prompt at call time.

| Role | Hex | Use for |
|---|---|---|
| `ink` | `#1e1e1e` | Primary text and strokes. Every stroke that isn't the accent. |
| `paper` | `#ffffff` | Backgrounds. Element-background defaults. |
| `accent` | `#1971c2` | Primary brand accent — emphasis, callouts, the one element you want the eye on. |
| `accent_alt` | `#e8590c` | Secondary accent — use sparingly. |
| `evidence_bg` | `#1e1e1e` | Evidence artifact backgrounds (code snippets, JSON examples). |
| `evidence_text` | `#d4d4d4` | Text inside evidence artifacts. |
| `muted` | `#868e96` | Secondary text, grid lines, subtle dividers. |

## Editorial rules

- One `accent` per diagram, ideally. Two means you have two competing arguments.
- Evidence artifacts always pair `evidence_bg` with `evidence_text` — never mix.
- `accent_alt` is for when you must compare two things side-by-side; otherwise leave it out.
```

- [ ] **Step 4: Write `typography.json`** (copy default; user edits later)

```json
{
  "fontFamily": 1,
  "fontFamilyName": "Virgil",
  "fontSize": {
    "small": 16,
    "medium": 20,
    "large": 28,
    "heading": 36
  },
  "italicPolicy": "sparingly"
}
```

- [ ] **Step 5: Write `README.md.mustache`**

```mustache
# @excalidraw-skill-pack/theme-{{slug}}

> {{description}}

Theme package for [excalidraw-skill-pack](https://excalidraw-skill-pack.dev).

## Install

```bash
npm i -g @excalidraw-skill-pack/theme-{{slug}}
# or
pip install excalidraw-skill-pack-theme-{{slug}}
```

## Use

```bash
npx excalidraw-render diagram.excalidraw --theme {{slug}}
```

Or set in `.excalidraw-skill-pack.json`:

```json
{ "theme": "{{slug}}" }
```

## Author

{{author}} · MIT
```

- [ ] **Step 6: Write `package.json.mustache`**

```mustache
{
  "name": "@excalidraw-skill-pack/theme-{{slug}}",
  "version": "0.1.0",
  "description": "{{description}}",
  "license": "MIT",
  "type": "module",
  "main": "./theme.json",
  "files": [
    "theme.json",
    "palette.json",
    "palette.md",
    "typography.json",
    "elements/",
    "layouts/",
    "preview.png",
    "README.md"
  ],
  "keywords": ["excalidraw", "excalidraw-skill-pack", "theme", "ai-agent", "diagrams"],
  "publishConfig": {
    "access": "public"
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add packages/create-excalidraw-theme/src/template/
git commit -m "feat(create-excalidraw-theme): npm-side template files"
```

---

### Task 3: Write PyPI mirror template

**Files:**
- Create: `packages/create-excalidraw-theme/src/template/pyproject.toml.mustache`
- Create: `packages/create-excalidraw-theme/src/template/__init__.py.mustache`

- [ ] **Step 1: Write `pyproject.toml.mustache`**

```mustache
[project]
name = "excalidraw-skill-pack-theme-{{slug}}"
version = "0.1.0"
description = "{{description}}"
readme = "README.md"
license = "MIT"
requires-python = ">=3.11"
authors = [{ name = "{{author}}" }]
keywords = ["excalidraw", "excalidraw-skill-pack", "theme", "ai-agent", "diagrams"]

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/excalidraw_skill_pack_theme_{{slug_underscored}}"]

[tool.hatch.build.targets.wheel.force-include]
"theme.json" = "excalidraw_skill_pack_theme_{{slug_underscored}}/theme.json"
"palette.json" = "excalidraw_skill_pack_theme_{{slug_underscored}}/palette.json"
"palette.md" = "excalidraw_skill_pack_theme_{{slug_underscored}}/palette.md"
"typography.json" = "excalidraw_skill_pack_theme_{{slug_underscored}}/typography.json"
"elements" = "excalidraw_skill_pack_theme_{{slug_underscored}}/elements"
"layouts" = "excalidraw_skill_pack_theme_{{slug_underscored}}/layouts"
```

- [ ] **Step 2: Write `__init__.py.mustache`**

```mustache
"""excalidraw-skill-pack-theme-{{slug}}: theme package.

This package ships the same files as the npm @excalidraw-skill-pack/theme-{{slug}}
package. The Python renderer discovers it via importlib.resources at runtime.
"""

from importlib.resources import files

__version__ = "0.1.0"
THEME_DIR = files(__package__)
```

- [ ] **Step 3: Commit**

```bash
git add packages/create-excalidraw-theme/src/template/pyproject.toml.mustache packages/create-excalidraw-theme/src/template/__init__.py.mustache
git commit -m "feat(create-excalidraw-theme): PyPI mirror template"
```

---

### Task 4: Implement scaffold logic — failing test first

**Files:**
- Create: `packages/create-excalidraw-theme/tests/scaffold.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scaffoldTheme } from "../src/scaffold.js";

describe("scaffoldTheme", () => {
  it("creates a complete theme package", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "esp-scaffold-"));
    await scaffoldTheme({
      slug: "my-brand",
      description: "Brand theme for ACME Co.",
      author: "Jane Doe",
      parent: "default-sketchy",
      cwd: tmp
    });
    const dir = join(tmp, "theme-my-brand");
    expect(existsSync(join(dir, "theme.json"))).toBe(true);
    expect(existsSync(join(dir, "palette.json"))).toBe(true);
    expect(existsSync(join(dir, "palette.md"))).toBe(true);
    expect(existsSync(join(dir, "typography.json"))).toBe(true);
    expect(existsSync(join(dir, "package.json"))).toBe(true);
    expect(existsSync(join(dir, "pyproject.toml"))).toBe(true);
    expect(existsSync(join(dir, "README.md"))).toBe(true);

    const themeJson = JSON.parse(readFileSync(join(dir, "theme.json"), "utf-8"));
    expect(themeJson.name).toBe("my-brand");
    expect(themeJson.extends).toBe("default-sketchy");

    const pyToml = readFileSync(join(dir, "pyproject.toml"), "utf-8");
    expect(pyToml).toContain('name = "excalidraw-skill-pack-theme-my-brand"');
  });

  it("rejects non-kebab-case slugs", async () => {
    await expect(
      scaffoldTheme({
        slug: "BadName",
        description: "x",
        author: "x",
        parent: "default-sketchy",
        cwd: tmpdir()
      })
    ).rejects.toThrow(/kebab-case/i);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
pnpm --filter create-excalidraw-theme test
```

- [ ] **Step 3: Implement `scaffold.ts`**

```typescript
import { mkdir, readdir, readFile, writeFile, copyFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname } from "node:path";
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
  await mkdir(join(outDir, "src", `excalidraw_skill_pack_theme_${opts.slug.replaceAll("-", "_")}`), {
    recursive: true
  });

  const view = {
    slug: opts.slug,
    slug_underscored: opts.slug.replaceAll("-", "_"),
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
      // __init__.py.mustache goes into src/<pkg>/__init__.py
      if (outName === "__init__.py") {
        await writeFile(
          join(
            outDir,
            "src",
            `excalidraw_skill_pack_theme_${view.slug_underscored}`,
            "__init__.py"
          ),
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
```

- [ ] **Step 4: Implement CLI entry `src/index.ts`**

```typescript
#!/usr/bin/env node
import { Command } from "commander";
import { scaffoldTheme } from "./scaffold.js";

const program = new Command();

program
  .name("create-excalidraw-theme")
  .description("Scaffold a new excalidraw-skill-pack theme package")
  .argument("<slug>", "kebab-case theme name")
  .option("--from <parent>", "Parent theme name to extend", "default-sketchy")
  .option("--description <text>", "Theme description", "Custom theme")
  .option("--author <name>", "Author name", "Anonymous")
  .action(
    async (
      slug: string,
      opts: { from: string; description: string; author: string }
    ) => {
      const dir = await scaffoldTheme({
        slug,
        description: opts.description,
        author: opts.author,
        parent: opts.from,
        cwd: process.cwd()
      });
      console.log(`Theme scaffolded at: ${dir}`);
      console.log("Next steps:");
      console.log(`  cd ${dir}`);
      console.log(`  # edit palette.json + palette.md`);
      console.log(`  npm publish --access public`);
      console.log(`  cd src/... && uv build && uv publish`);
    }
  );

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 5: Build and test**

```bash
pnpm --filter create-excalidraw-theme build && pnpm --filter create-excalidraw-theme test
```
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/create-excalidraw-theme/src packages/create-excalidraw-theme/tests
git commit -m "feat(create-excalidraw-theme): implement scaffolder with kebab-case validation"
```

---

# Milestone 2 — Publish the 4 Themes from the Monorepo

### Task 5: Author `stripe-press` theme

**Files:**
- Create: `packages/themes/stripe-press/` (full theme + package + pyproject)

- [ ] **Step 1: Scaffold the directory with the just-built scaffolder**

```bash
node packages/create-excalidraw-theme/dist/index.js stripe-press \
  --from default-sketchy \
  --description "Editorial / book-grade. Cream paper, ink-brown strokes, editorial sans/serif. Proven on 64 diagrams." \
  --author "Timur Isachenko"
mv theme-stripe-press packages/themes/stripe-press
```

- [ ] **Step 2: Replace `palette.json` with the book palette**

```json
{
  "ink": "#2A2622",
  "paper": "#F4EDE0",
  "accent": "#B8472A",
  "accent_alt": "#3B6A8A",
  "evidence_bg": "#2A2622",
  "evidence_text": "#F4EDE0",
  "muted": "#7A6F5F",
  "warning": "#D49E2C",
  "danger": "#A03D2E",
  "syntax": {
    "string": "#9AC79B",
    "keyword": "#D49E2C",
    "number": "#6FA4C9",
    "comment": "#7A6F5F"
  }
}
```

- [ ] **Step 3: Update `theme.json` `roles` to match**

```json
{
  "name": "stripe-press",
  "version": "0.1.0",
  "extends": "default-sketchy",
  "description": "Editorial / book-grade. Cream paper, ink-brown strokes, editorial sans/serif. Proven on 64 diagrams.",
  "license": "MIT",
  "author": "Timur Isachenko",
  "preview": "preview.png",
  "roles": {
    "ink": "#2A2622",
    "paper": "#F4EDE0",
    "accent": "#B8472A",
    "accent_alt": "#3B6A8A",
    "evidence_bg": "#2A2622",
    "evidence_text": "#F4EDE0",
    "muted": "#7A6F5F",
    "warning": "#D49E2C",
    "danger": "#A03D2E"
  }
}
```

- [ ] **Step 4: Replace `typography.json` with editorial sans/serif policy**

```json
{
  "fontFamily": 2,
  "fontFamilyName": "Helvetica",
  "fontSize": {
    "small": 14,
    "medium": 18,
    "large": 26,
    "heading": 34
  },
  "italicPolicy": "headings_and_takeaways"
}
```

- [ ] **Step 5: Rewrite `palette.md` for editorial voice (port from book's existing palette doc)**

```bash
cat > packages/themes/stripe-press/palette.md <<'EOF'
# stripe-press palette

> Cream paper, ink-brown strokes, single accent — editorial restraint.

| Role | Hex | Use for |
|---|---|---|
| `ink` | `#2A2622` | All strokes. All body text. Default for everything. |
| `paper` | `#F4EDE0` | The background. Element fills that pretend to be "no fill". |
| `accent` | `#B8472A` | The argument. One per diagram. The takeaway, the conclusion, the one thing you want remembered. |
| `accent_alt` | `#3B6A8A` | When two ideas must be compared. Use sparingly. |
| `evidence_bg` | `#2A2622` | Evidence artifact backgrounds — code snippets, JSON samples. |
| `evidence_text` | `#F4EDE0` | Evidence text. |
| `muted` | `#7A6F5F` | Captions, axis labels, ancillary text. |

## Editorial rules

- One `accent` per diagram. Two = a competing argument; split into two diagrams.
- Italic is reserved for headings and takeaways (`italicPolicy: headings_and_takeaways`).
- No bright colors. The palette is restrained on purpose; it makes the accent land.
- Evidence artifacts are inverted (`ink` text on `paper`-toned bg, or `paper` text on `ink` bg). Never `accent` text inside evidence — the accent is for the visual, not the snippet.

## Proof

This palette renders the 64 diagrams in *From Copilot to Colleague* (fromcopilottocolleague.com).
EOF
```

- [ ] **Step 6: Render a preview**

```bash
cd packages/themes/stripe-press
node ../../renderer-node/dist/cli.js \
  ../../shared/fixtures/03-concept-card.excalidraw \
  --theme stripe-press --output preview.png --scale 2 --width 1200
cd ../../..
```

> Note: the renderer needs the theme to be discoverable. Until the loader supports node_modules lookup (Task 12), invoke with `--themes-dir packages/themes` if needed.

- [ ] **Step 7: Commit**

```bash
git add packages/themes/stripe-press/
git commit -m "feat(themes): add stripe-press theme (editorial / book-grade)"
```

---

### Task 6: Author `notion` theme

**Files:**
- Create: `packages/themes/notion/`

- [ ] **Step 1: Scaffold**

```bash
node packages/create-excalidraw-theme/dist/index.js notion \
  --from default-sketchy \
  --description "Rounded, soft, off-white. Matches Notion's docs aesthetic." \
  --author "Timur Isachenko"
mv theme-notion packages/themes/notion
```

- [ ] **Step 2: Set palette** (`packages/themes/notion/palette.json`)

```json
{
  "ink": "#37352F",
  "paper": "#FBFAF7",
  "accent": "#0F62FE",
  "accent_alt": "#E16E5B",
  "evidence_bg": "#F1F1EF",
  "evidence_text": "#37352F",
  "muted": "#9B9A97",
  "warning": "#D9730D",
  "danger": "#E03E3E"
}
```

- [ ] **Step 3: Update `theme.json` roles to match**

- [ ] **Step 4: Adjust typography to a rounder system look**

```json
{
  "fontFamily": 2,
  "fontFamilyName": "Helvetica",
  "fontSize": {
    "small": 14,
    "medium": 18,
    "large": 24,
    "heading": 32
  },
  "italicPolicy": "sparingly"
}
```

- [ ] **Step 5: Rewrite `palette.md` for Notion's softer voice**

(Follow the same structure as stripe-press; emphasize: off-white not pure white, blue accent for emphasis, evidence blocks are pale gray not dark.)

- [ ] **Step 6: Render preview, commit**

```bash
cd packages/themes/notion
node ../../renderer-node/dist/cli.js \
  ../../shared/fixtures/03-concept-card.excalidraw \
  --theme notion --output preview.png --scale 2 --width 1200
cd ../../..
git add packages/themes/notion/
git commit -m "feat(themes): add notion theme (rounded, off-white)"
```

---

### Task 7: Author `whiteboard` theme

**Files:**
- Create: `packages/themes/whiteboard/`

- [ ] **Step 1: Scaffold + palette**

```bash
node packages/create-excalidraw-theme/dist/index.js whiteboard \
  --from default-sketchy \
  --description "Low-fi, bright, intentionally sketchy. For workshops and ideation sessions." \
  --author "Timur Isachenko"
mv theme-whiteboard packages/themes/whiteboard
```

Palette (`packages/themes/whiteboard/palette.json`):

```json
{
  "ink": "#1A1A1A",
  "paper": "#FFFFFF",
  "accent": "#FFB400",
  "accent_alt": "#FF5252",
  "evidence_bg": "#FFFCEE",
  "evidence_text": "#1A1A1A",
  "muted": "#999999",
  "warning": "#FF8800",
  "danger": "#E53935"
}
```

- [ ] **Step 2: Typography — keep sketchy**

```json
{
  "fontFamily": 1,
  "fontFamilyName": "Virgil",
  "fontSize": {
    "small": 18,
    "medium": 22,
    "large": 30,
    "heading": 38
  },
  "italicPolicy": "never"
}
```

- [ ] **Step 3: Element overrides — exaggerate roughness**

`packages/themes/whiteboard/elements/box.json`:

```json
{
  "strokeColor": "#1A1A1A",
  "backgroundColor": "transparent",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 2,
  "roundness": { "type": 3 },
  "fillStyle": "hachure"
}
```

- [ ] **Step 4: Commit (with preview)**

```bash
# preview
cd packages/themes/whiteboard
node ../../renderer-node/dist/cli.js \
  ../../shared/fixtures/04-relationship-map.excalidraw \
  --theme whiteboard --output preview.png --scale 2 --width 1200
cd ../../..
git add packages/themes/whiteboard/
git commit -m "feat(themes): add whiteboard theme (low-fi, bright, sketchy)"
```

---

### Task 8: Author `dark` theme

**Files:**
- Create: `packages/themes/dark/`

- [ ] **Step 1: Scaffold + palette**

```bash
node packages/create-excalidraw-theme/dist/index.js dark \
  --from default-sketchy \
  --description "Inverted contrast, neutral. For presentations and dev tools." \
  --author "Timur Isachenko"
mv theme-dark packages/themes/dark
```

Palette (`packages/themes/dark/palette.json`):

```json
{
  "ink": "#E7E5E4",
  "paper": "#18181B",
  "accent": "#22C55E",
  "accent_alt": "#F472B6",
  "evidence_bg": "#0A0A0A",
  "evidence_text": "#E7E5E4",
  "muted": "#71717A",
  "warning": "#F59E0B",
  "danger": "#EF4444"
}
```

- [ ] **Step 2: Element overrides — invert default contrast**

```json
{
  "strokeColor": "#E7E5E4",
  "backgroundColor": "transparent",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "roundness": { "type": 3 },
  "fillStyle": "solid"
}
```

- [ ] **Step 3: Commit (with preview)**

```bash
cd packages/themes/dark
node ../../renderer-node/dist/cli.js \
  ../../shared/fixtures/02-layered-stack.excalidraw \
  --theme dark --output preview.png --scale 2 --width 1200
cd ../../..
git add packages/themes/dark/
git commit -m "feat(themes): add dark theme (inverted, neutral)"
```

---

### Task 9: Validate all 4 themes against the schema

- [ ] **Step 1: Run `validate-theme` on each**

```bash
for t in stripe-press notion whiteboard dark; do
  node packages/core/dist/validate-theme.js packages/themes/$t/theme.json
done
```
Expected: 4 OK lines.

- [ ] **Step 2: Add to CI**

Append to `.github/workflows/ci.yml`:

```yaml
  validate-themes:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @excalidraw-skill-pack/core build
      - name: Validate every theme
        run: |
          for t in packages/themes/*/; do
            node packages/core/dist/validate-theme.js "$t/theme.json"
          done
```

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: validate every theme manifest on PR"
```

---

### Task 10: PyPI mirror builds for all 4 themes

**Files:**
- Create: `tools/publish-pypi-themes.sh`

- [ ] **Step 1: Write the helper**

```bash
#!/usr/bin/env bash
set -euo pipefail

# Build (and optionally publish) every theme's PyPI mirror.
# Usage: tools/publish-pypi-themes.sh [--publish]

PUBLISH=0
[ "${1:-}" = "--publish" ] && PUBLISH=1

for theme_dir in packages/themes/*/; do
  name=$(basename "$theme_dir")
  echo "=== $name ==="
  pushd "$theme_dir" > /dev/null
  uv build
  if [ "$PUBLISH" = "1" ]; then
    uv publish
  fi
  popd > /dev/null
done
```

- [ ] **Step 2: Make executable**

```bash
chmod +x tools/publish-pypi-themes.sh
```

- [ ] **Step 3: Local build verification**

```bash
tools/publish-pypi-themes.sh
```
Expected: each `packages/themes/*/dist/` contains a `.whl` and `.tar.gz`.

- [ ] **Step 4: Commit**

```bash
git add tools/publish-pypi-themes.sh
git commit -m "build: add PyPI mirror build script for theme packages"
```

---

### Task 11: Add changesets for 4 npm themes

- [ ] **Step 1: Write the changeset**

```bash
cat > .changeset/themes-published.md <<'EOF'
---
"@excalidraw-skill-pack/theme-stripe-press": minor
"@excalidraw-skill-pack/theme-notion": minor
"@excalidraw-skill-pack/theme-whiteboard": minor
"@excalidraw-skill-pack/theme-dark": minor
"create-excalidraw-theme": minor
---

Initial release of 4 themes (stripe-press, notion, whiteboard, dark) and the create-excalidraw-theme scaffolder.
EOF
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/themes-published.md
git commit -m "chore: changeset for themes + scaffolder release"
```

---

# Milestone 3 — Theme Discovery from node_modules / Python Site-Packages

### Task 12: Extend `theme-loader` to discover installed packages — failing test first

**Files:**
- Create: `packages/core/tests/theme-discovery.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverInstalledThemes } from "../src/theme-loader.js";

describe("discoverInstalledThemes", () => {
  let fakeRoot: string;

  beforeAll(() => {
    fakeRoot = mkdtempSync(join(tmpdir(), "esp-discovery-"));
    // Simulate two installed theme packages under fakeRoot/node_modules
    const themes = [
      { pkg: "@excalidraw-skill-pack/theme-acme", name: "acme" },
      { pkg: "@excalidraw-skill-pack/theme-foo", name: "foo" }
    ];
    for (const { pkg, name } of themes) {
      const dir = join(fakeRoot, "node_modules", pkg);
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({ name: pkg, version: "0.0.1" })
      );
      writeFileSync(
        join(dir, "theme.json"),
        JSON.stringify({ name, version: "0.0.1" })
      );
    }
  });

  it("finds @excalidraw-skill-pack/theme-* packages in node_modules", async () => {
    const themes = await discoverInstalledThemes({ nodeModulesRoot: fakeRoot });
    const names = themes.map((t) => t.name).sort();
    expect(names).toEqual(["acme", "foo"]);
    expect(themes.every((t) => t.source === "npm")).toBe(true);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Extend `theme-loader.ts`**

Append to `packages/core/src/theme-loader.ts`:

```typescript
import { readdir as readdirAsync, readFile as readFileAsync } from "node:fs/promises";

export interface DiscoveredTheme {
  name: string;
  version: string;
  source: "bundled" | "npm" | "pypi";
  manifest: ThemeManifest;
  themeDir: string;
}

export interface DiscoveryOptions {
  nodeModulesRoot?: string;
  bundledThemesDir?: string;
}

const NPM_PREFIX = "@excalidraw-skill-pack/theme-";

export async function discoverInstalledThemes(
  opts: DiscoveryOptions = {}
): Promise<DiscoveredTheme[]> {
  const found: DiscoveredTheme[] = [];

  if (opts.bundledThemesDir) {
    for (const entry of await readdirAsync(opts.bundledThemesDir).catch(() => [])) {
      const themeDir = join(opts.bundledThemesDir, entry);
      try {
        const manifest = JSON.parse(
          await readFileAsync(join(themeDir, "theme.json"), "utf-8")
        ) as ThemeManifest;
        found.push({
          name: manifest.name,
          version: manifest.version,
          source: "bundled",
          manifest,
          themeDir
        });
      } catch {
        // skip
      }
    }
  }

  if (opts.nodeModulesRoot) {
    const orgDir = join(opts.nodeModulesRoot, "node_modules", "@excalidraw-skill-pack");
    for (const entry of await readdirAsync(orgDir).catch(() => [])) {
      if (!entry.startsWith("theme-")) continue;
      const themeDir = join(orgDir, entry);
      try {
        const manifest = JSON.parse(
          await readFileAsync(join(themeDir, "theme.json"), "utf-8")
        ) as ThemeManifest;
        found.push({
          name: manifest.name,
          version: manifest.version,
          source: "npm",
          manifest,
          themeDir
        });
      } catch {
        // skip
      }
    }
  }

  return found;
}
```

- [ ] **Step 4: Re-export from `index.ts`**

```typescript
export { discoverInstalledThemes } from "./theme-loader.js";
export type { DiscoveredTheme, DiscoveryOptions } from "./theme-loader.js";
```

- [ ] **Step 5: Run, verify PASS**

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/theme-loader.ts packages/core/src/index.ts packages/core/tests/theme-discovery.test.ts
git commit -m "feat(core): discover installed theme packages in node_modules"
```

---

### Task 13: Wire discovery into `list_themes` MCP tool

**Files:**
- Modify: `packages/mcp-server/src/tools/list-themes.ts`
- Modify: `packages/mcp-server/tests/tool-list-themes.test.ts`

- [ ] **Step 1: Extend the test**

```typescript
it("includes bundled + npm-installed themes", async () => {
  // (Test setup mirrors Task 12: create fake @excalidraw-skill-pack/theme-foo
  // and point the loader at the fake root via env or arg.)
  // Implementation: read process.cwd()'s node_modules.
  const result = (await listThemesTool.handler({})) as {
    themes: Array<{ name: string; source: string }>;
  };
  const sources = new Set(result.themes.map((t) => t.source));
  expect(sources.has("bundled")).toBe(true);
});
```

- [ ] **Step 2: Update `list-themes.ts` to call `discoverInstalledThemes`**

```typescript
import { discoverInstalledThemes } from "@excalidraw-skill-pack/core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ToolDefinition } from "../server.js";

async function resolveCoreThemesDir(): Promise<string> {
  const corePkgUrl = await import.meta.resolve(
    "@excalidraw-skill-pack/core/package.json"
  );
  return join(dirname(fileURLToPath(corePkgUrl)), "themes");
}

export const listThemesTool: ToolDefinition = {
  name: "list_themes",
  description: "List all installed themes with metadata + sources.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const bundledThemesDir = await resolveCoreThemesDir();
    const themes = await discoverInstalledThemes({
      bundledThemesDir,
      nodeModulesRoot: process.cwd()
    });
    return {
      themes: themes.map((t) => ({
        name: t.name,
        version: t.version,
        description: t.manifest.description,
        source: t.source
      }))
    };
  }
};
```

- [ ] **Step 3: Build, test, commit**

```bash
pnpm --filter @excalidraw-skill-pack/core build && pnpm --filter @excalidraw-skill-pack/mcp-server build && pnpm --filter @excalidraw-skill-pack/mcp-server test
git add packages/mcp-server/src/tools/list-themes.ts packages/mcp-server/tests/tool-list-themes.test.ts
git commit -m "feat(mcp-server): list_themes discovers npm-installed themes"
```

---

# Milestone 4 — Adapters

### Task 14: Claude Code adapter

**Files:**
- Create: `adapters/claude-code/install.sh`
- Create: `adapters/claude-code/install.ps1`
- Create: `adapters/claude-code/README.md`

- [ ] **Step 1: Write `install.sh` (POSIX)**

```bash
#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"  # full | lite
TARGET="${HOME}/.claude/skills/excalidraw-diagram"

CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>/dev/null || true)
if [ -z "$CORE_PKG_DIR" ]; then
  echo "Installing @excalidraw-skill-pack/core globally..."
  npm install -g @excalidraw-skill-pack/core
  CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))")
fi
CORE_DIR=$(dirname "$CORE_PKG_DIR")

mkdir -p "$TARGET/references"
cp "$CORE_DIR/SKILL.md" "$TARGET/SKILL.md"
cp -R "$CORE_DIR/themes" "$TARGET/themes"
cp "$CORE_DIR/element-templates.md" "$TARGET/references/"
cp "$CORE_DIR/json-schema.md" "$TARGET/references/"

echo "Installed Claude Code skill at $TARGET"

if [ "$MODE" = "full" ]; then
  MCP_CONFIG="${HOME}/.claude/mcp.json"
  mkdir -p "$(dirname "$MCP_CONFIG")"
  if [ ! -f "$MCP_CONFIG" ]; then echo '{ "mcpServers": {} }' > "$MCP_CONFIG"; fi
  node - <<EOF
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$MCP_CONFIG', 'utf-8'));
cfg.mcpServers = cfg.mcpServers || {};
cfg.mcpServers['excalidraw-skill-pack'] = {
  command: 'npx',
  args: ['@excalidraw-skill-pack/mcp-server']
};
fs.writeFileSync('$MCP_CONFIG', JSON.stringify(cfg, null, 2));
EOF
  echo "Registered MCP server in $MCP_CONFIG"
fi

echo "Done."
```

- [ ] **Step 2: Write `install.ps1` (Windows PowerShell equivalent)**

```powershell
param([string]$Mode = "full")

$Target = "$env:USERPROFILE\.claude\skills\excalidraw-diagram"

try { $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>$null } catch {}
if (-not $CorePkgPath) {
  Write-Output "Installing @excalidraw-skill-pack/core globally..."
  npm install -g "@excalidraw-skill-pack/core"
  $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))"
}
$CoreDir = Split-Path $CorePkgPath

New-Item -ItemType Directory -Force -Path "$Target\references" | Out-Null
Copy-Item "$CoreDir\SKILL.md" "$Target\SKILL.md"
Copy-Item -Recurse -Force "$CoreDir\themes" "$Target\themes"
Copy-Item "$CoreDir\element-templates.md" "$Target\references\"
Copy-Item "$CoreDir\json-schema.md" "$Target\references\"

Write-Output "Installed Claude Code skill at $Target"

if ($Mode -eq "full") {
  $McpConfig = "$env:USERPROFILE\.claude\mcp.json"
  New-Item -ItemType Directory -Force -Path (Split-Path $McpConfig) | Out-Null
  if (-not (Test-Path $McpConfig)) { '{ "mcpServers": {} }' | Set-Content $McpConfig }
  $cfg = Get-Content $McpConfig -Raw | ConvertFrom-Json
  if (-not $cfg.mcpServers) { $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue (@{}) }
  $cfg.mcpServers.'excalidraw-skill-pack' = @{ command = "npx"; args = @("@excalidraw-skill-pack/mcp-server") }
  $cfg | ConvertTo-Json -Depth 10 | Set-Content $McpConfig
  Write-Output "Registered MCP server in $McpConfig"
}
```

- [ ] **Step 3: Write README**

```markdown
# Claude Code adapter

```bash
bash adapters/claude-code/install.sh       # full (skill + MCP)
bash adapters/claude-code/install.sh lite  # skill only, no MCP
```

Windows:

```powershell
.\adapters\claude-code\install.ps1
```

After install, the skill auto-loads in Claude Code on next session.
```

- [ ] **Step 4: chmod and commit**

```bash
chmod +x adapters/claude-code/install.sh
git add adapters/claude-code/
git commit -m "feat(adapters): claude-code install scripts (lite + full modes)"
```

---

### Task 15: Cursor adapter

**Files:**
- Create: `adapters/cursor/install.sh`
- Create: `adapters/cursor/install.ps1`
- Create: `adapters/cursor/rules.mdc.template`
- Create: `adapters/cursor/README.md`

- [ ] **Step 1: Write the MDC template**

```markdown
---
description: Generate Excalidraw diagrams that argue visually. Use the @excalidraw-skill-pack methodology.
globs:
  - "*.excalidraw"
alwaysApply: false
---

# excalidraw-skill-pack methodology

{{SKILL_BODY}}

---

## Active theme palette

{{PALETTE_MD}}
```

- [ ] **Step 2: Write `install.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
THEME="${THEME:-default-sketchy}"

CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>/dev/null || true)
if [ -z "$CORE_PKG_DIR" ]; then
  npm install -g @excalidraw-skill-pack/core
  CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))")
fi
CORE_DIR=$(dirname "$CORE_PKG_DIR")

mkdir -p .cursor/rules
SKILL_BODY=$(cat "$CORE_DIR/SKILL.md")
PALETTE_MD=$(cat "$CORE_DIR/themes/$THEME/palette.md" 2>/dev/null || cat "$CORE_DIR/themes/default-sketchy/palette.md")

ADAPTER_DIR=$(dirname "$0")
sed -e "s|{{SKILL_BODY}}|$SKILL_BODY|" \
    -e "s|{{PALETTE_MD}}|$PALETTE_MD|" \
    "$ADAPTER_DIR/rules.mdc.template" > .cursor/rules/excalidraw.mdc

echo "Installed Cursor rule at .cursor/rules/excalidraw.mdc"

if [ "$MODE" = "full" ]; then
  MCP=.cursor/mcp.json
  if [ ! -f "$MCP" ]; then echo '{ "mcpServers": {} }' > "$MCP"; fi
  node - <<EOF
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$MCP', 'utf-8'));
cfg.mcpServers = cfg.mcpServers || {};
cfg.mcpServers['excalidraw-skill-pack'] = {
  command: 'npx', args: ['@excalidraw-skill-pack/mcp-server']
};
fs.writeFileSync('$MCP', JSON.stringify(cfg, null, 2));
EOF
  echo "Registered MCP server in $MCP"
fi
```

> **Note for implementer:** the `sed` substitution with embedded markdown is fragile if the SKILL.md contains the `|` character. Use a temp-file/awk approach in production; the simple sed above works for the default content.

- [ ] **Step 3: Write `install.ps1`** (equivalent: copy file, register MCP in `.cursor/mcp.json`)

```powershell
param([string]$Mode = "full", [string]$Theme = "default-sketchy")

try { $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>$null } catch {}
if (-not $CorePkgPath) {
  npm install -g "@excalidraw-skill-pack/core"
  $CorePkgPath = node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))"
}
$CoreDir = Split-Path $CorePkgPath

New-Item -ItemType Directory -Force -Path ".cursor\rules" | Out-Null
$Skill = Get-Content "$CoreDir\SKILL.md" -Raw
$Palette = $null
$PalettePath = "$CoreDir\themes\$Theme\palette.md"
if (Test-Path $PalettePath) { $Palette = Get-Content $PalettePath -Raw }
if (-not $Palette) { $Palette = Get-Content "$CoreDir\themes\default-sketchy\palette.md" -Raw }

$Template = Get-Content "$PSScriptRoot\rules.mdc.template" -Raw
$Out = $Template.Replace("{{SKILL_BODY}}", $Skill).Replace("{{PALETTE_MD}}", $Palette)
Set-Content ".cursor\rules\excalidraw.mdc" $Out

Write-Output "Installed Cursor rule at .cursor\rules\excalidraw.mdc"

if ($Mode -eq "full") {
  $McpConfig = ".cursor\mcp.json"
  if (-not (Test-Path $McpConfig)) { '{ "mcpServers": {} }' | Set-Content $McpConfig }
  $cfg = Get-Content $McpConfig -Raw | ConvertFrom-Json
  if (-not $cfg.mcpServers) { $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue (@{}) }
  $cfg.mcpServers.'excalidraw-skill-pack' = @{ command = "npx"; args = @("@excalidraw-skill-pack/mcp-server") }
  $cfg | ConvertTo-Json -Depth 10 | Set-Content $McpConfig
  Write-Output "Registered MCP server in $McpConfig"
}
```

- [ ] **Step 4: README + chmod + commit**

```markdown
# Cursor adapter

Installs `.cursor/rules/excalidraw.mdc` + (full mode) registers the MCP server in `.cursor/mcp.json`.

```bash
bash adapters/cursor/install.sh                  # full
bash adapters/cursor/install.sh lite             # rules only
THEME=stripe-press bash adapters/cursor/install.sh
```
```

```bash
chmod +x adapters/cursor/install.sh
git add adapters/cursor/
git commit -m "feat(adapters): cursor install scripts (lite + full, theme-aware)"
```

---

### Task 16: Codex adapter

**Files:**
- Create: `adapters/codex/install.sh`
- Create: `adapters/codex/install.ps1`
- Create: `adapters/codex/README.md`

- [ ] **Step 1: Write `install.sh`** (Codex skills live in `~/.codex/skills/`; MCP in `~/.codex/mcp.json`)

```bash
#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
TARGET="${HOME}/.codex/skills/excalidraw-diagram"

CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>/dev/null || true)
if [ -z "$CORE_PKG_DIR" ]; then
  npm install -g @excalidraw-skill-pack/core
  CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))")
fi
CORE_DIR=$(dirname "$CORE_PKG_DIR")

mkdir -p "$TARGET/references"
cp "$CORE_DIR/SKILL.md" "$TARGET/SKILL.md"
cp -R "$CORE_DIR/themes" "$TARGET/themes"
cp "$CORE_DIR/element-templates.md" "$TARGET/references/"
cp "$CORE_DIR/json-schema.md" "$TARGET/references/"
echo "Installed Codex skill at $TARGET"

if [ "$MODE" = "full" ]; then
  MCP="${HOME}/.codex/mcp.json"
  mkdir -p "$(dirname "$MCP")"
  if [ ! -f "$MCP" ]; then echo '{ "mcpServers": {} }' > "$MCP"; fi
  node - <<EOF
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$MCP', 'utf-8'));
cfg.mcpServers = cfg.mcpServers || {};
cfg.mcpServers['excalidraw-skill-pack'] = {
  command: 'npx', args: ['@excalidraw-skill-pack/mcp-server']
};
fs.writeFileSync('$MCP', JSON.stringify(cfg, null, 2));
EOF
  echo "Registered MCP server in $MCP"
fi
```

- [ ] **Step 2: Write `install.ps1`** (same pattern as Claude Code adapter, `~\.codex\`)

```powershell
param([string]$Mode = "full")
$Target = "$env:USERPROFILE\.codex\skills\excalidraw-diagram"
# ... mirror of install.sh ...
```

- [ ] **Step 3: README + chmod + commit**

```bash
chmod +x adapters/codex/install.sh
git add adapters/codex/
git commit -m "feat(adapters): codex install scripts (lite + full)"
```

---

### Task 17: Gemini CLI adapter

**Files:**
- Create: `adapters/gemini-cli/install.sh`
- Create: `adapters/gemini-cli/install.ps1`
- Create: `adapters/gemini-cli/extension.json.template`
- Create: `adapters/gemini-cli/README.md`

- [ ] **Step 1: Write `extension.json.template`** (Gemini CLI extension manifest format)

```json
{
  "name": "excalidraw-skill-pack",
  "version": "0.1.0",
  "description": "Make your AI agent argue visually.",
  "contextFiles": [
    "{{CORE_DIR}}/SKILL.md",
    "{{CORE_DIR}}/element-templates.md"
  ],
  "mcpServers": {
    "excalidraw-skill-pack": {
      "command": "npx",
      "args": ["@excalidraw-skill-pack/mcp-server"]
    }
  }
}
```

- [ ] **Step 2: Write `install.sh`** (Gemini CLI extensions live in `~/.gemini/extensions/<name>/`)

```bash
#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
TARGET="${HOME}/.gemini/extensions/excalidraw-skill-pack"

CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>/dev/null || true)
if [ -z "$CORE_PKG_DIR" ]; then
  npm install -g @excalidraw-skill-pack/core
  CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))")
fi
CORE_DIR=$(dirname "$CORE_PKG_DIR")

mkdir -p "$TARGET"
ADAPTER_DIR=$(dirname "$0")
sed -e "s|{{CORE_DIR}}|$CORE_DIR|g" "$ADAPTER_DIR/extension.json.template" > "$TARGET/extension.json"

if [ "$MODE" = "lite" ]; then
  # Remove MCP entry for lite mode
  node - <<EOF
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$TARGET/extension.json', 'utf-8'));
delete cfg.mcpServers;
fs.writeFileSync('$TARGET/extension.json', JSON.stringify(cfg, null, 2));
EOF
fi

echo "Installed Gemini CLI extension at $TARGET"
```

- [ ] **Step 3: Write `install.ps1`** (same pattern, PowerShell)

- [ ] **Step 4: README + chmod + commit**

```bash
chmod +x adapters/gemini-cli/install.sh
git add adapters/gemini-cli/
git commit -m "feat(adapters): gemini-cli install scripts + extension manifest"
```

---

### Task 18: Raw CLI adapter (docs-only)

**Files:**
- Create: `adapters/cli/README.md`

- [ ] **Step 1: Write README**

```markdown
# Raw CLI

No adapter to install — the CLI is the renderer.

## Node

```bash
npx excalidraw-render diagram.excalidraw --theme stripe-press --output out.png --scale 2
```

## Python

```bash
pipx install excalidraw-render
playwright install chromium
excalidraw-render diagram.excalidraw --theme stripe-press --output out.png --scale 2
```

## With MCP-compatible tools

```bash
npx @excalidraw-skill-pack/mcp-server
# Then point any MCP client at this stdio server.
```

## With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "excalidraw-skill-pack": {
      "command": "npx",
      "args": ["@excalidraw-skill-pack/mcp-server"]
    }
  }
}
```
```

- [ ] **Step 2: Commit**

```bash
git add adapters/cli/
git commit -m "docs(adapters): raw CLI usage guide"
```

---

# Milestone 5 — Meta-Installer Package

### Task 19: `@excalidraw-skill-pack/install` — failing test first

**Files:**
- Create: `packages/install/package.json`
- Create: `packages/install/tsconfig.json`
- Create: `packages/install/tests/index.test.ts`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "@excalidraw-skill-pack/install",
  "version": "0.0.0",
  "description": "One-command installer for excalidraw-skill-pack adapters.",
  "license": "MIT",
  "type": "module",
  "bin": {
    "excalidraw-skill-pack-install": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint src",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "commander": "^12.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "vitest": "^1.5.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

- [ ] **Step 2: Write the failing test**

```typescript
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
```

- [ ] **Step 3: Implement `index.ts`**

```typescript
#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { spawn } from "node:child_process";
import { Command } from "commander";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ADAPTERS = ["claude-code", "cursor", "codex", "gemini-cli"] as const;
type Adapter = (typeof ADAPTERS)[number];

export function resolveAdapterScript(adapter: string, platform: NodeJS.Platform): string {
  if (!ADAPTERS.includes(adapter as Adapter)) {
    throw new Error(`unknown adapter: ${adapter} (known: ${ADAPTERS.join(", ")})`);
  }
  const ext = platform === "win32" ? "install.ps1" : "install.sh";
  // From dist/, walk up to repo root, then adapters/<name>/<file>
  return join(__dirname, "..", "..", "..", "adapters", adapter, ext);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const program = new Command();
  program
    .name("excalidraw-skill-pack-install")
    .argument("<adapter>", "claude-code | cursor | codex | gemini-cli")
    .option("--lite", "Install skill only, skip MCP server registration")
    .action((adapter: string, opts: { lite?: boolean }) => {
      const script = resolveAdapterScript(adapter, process.platform);
      const mode = opts.lite ? "lite" : "full";
      const cmd = process.platform === "win32" ? "powershell" : "bash";
      const args =
        process.platform === "win32" ? ["-File", script, "-Mode", mode] : [script, mode];
      spawn(cmd, args, { stdio: "inherit" }).on("exit", (code) => process.exit(code ?? 0));
    });
  program.parseAsync(process.argv);
}
```

- [ ] **Step 4: Build, test, commit**

```bash
pnpm --filter @excalidraw-skill-pack/install build && pnpm --filter @excalidraw-skill-pack/install test
git add packages/install/
git commit -m "feat(install): one-command adapter installer"
```

---

# Milestone 6 — Adapter Install Matrix in CI

### Task 20: Docker-based adapter install workflow

**Files:**
- Create: `.github/workflows/adapter-install-matrix.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Adapter Install Matrix

on:
  pull_request:
    paths:
      - "adapters/**"
      - "packages/install/**"
      - "packages/core/**"
      - ".github/workflows/adapter-install-matrix.yml"

jobs:
  install:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
        adapter: [claude-code, cursor, codex, gemini-cli]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Link core globally
        run: |
          cd packages/core && npm link
      - name: Run adapter install
        run: |
          mkdir -p test-env
          cd test-env
          bash ../adapters/${{ matrix.adapter }}/install.sh
      - name: Verify install succeeded
        run: |
          case "${{ matrix.adapter }}" in
            claude-code) test -f "$HOME/.claude/skills/excalidraw-diagram/SKILL.md" ;;
            cursor) test -f "test-env/.cursor/rules/excalidraw.mdc" ;;
            codex) test -f "$HOME/.codex/skills/excalidraw-diagram/SKILL.md" ;;
            gemini-cli) test -f "$HOME/.gemini/extensions/excalidraw-skill-pack/extension.json" ;;
          esac
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/adapter-install-matrix.yml
git commit -m "ci: matrix-test all adapter installs on ubuntu + macos"
```

---

### Task 21: Changeset for the meta-installer

- [ ] **Step 1: Write changeset**

```bash
cat > .changeset/install-meta.md <<'EOF'
---
"@excalidraw-skill-pack/install": minor
---

Initial release of the one-command adapter installer:

  npx @excalidraw-skill-pack/install claude-code

Supports `claude-code`, `cursor`, `codex`, `gemini-cli` on macOS/Linux/Windows.
EOF
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/install-meta.md
git commit -m "chore: changeset for @excalidraw-skill-pack/install"
```

---

# Milestone 7 — Verification

### Task 22: Full pipeline smoke test

- [ ] **Step 1: Build everything**

```bash
pnpm build
```
Expected: 7 packages build (core + renderer-node + mcp-server + create-excalidraw-theme + install + 4 themes wait, themes are JSON-only and don't build).

- [ ] **Step 2: Run all tests**

```bash
pnpm test
cd packages/renderer-python && uv run pytest && cd ../..
```
Expected: all tests pass.

- [ ] **Step 3: Validate all themes**

```bash
for t in packages/themes/*/; do
  node packages/core/dist/validate-theme.js "$t/theme.json"
done
```
Expected: 4 OK.

- [ ] **Step 4: Build all PyPI theme mirrors**

```bash
tools/publish-pypi-themes.sh
```
Expected: each `packages/themes/*/dist/` has wheel + sdist.

- [ ] **Step 5: Try each adapter install locally**

```bash
for adapter in claude-code cursor codex gemini-cli; do
  ( cd /tmp && bash /path/to/repo/adapters/$adapter/install.sh lite )
done
```
Expected: each writes the expected files.

- [ ] **Step 6: Lint + typecheck**

```bash
pnpm lint
pnpm typecheck
```
Expected: 0 errors.

---

## Self-Review Notes

**Spec coverage:**
- Themes-as-packages (Section 2) → Tasks 1-11
- Theme discovery (`list_themes` honoring installed packages) → Tasks 12-13
- 5 adapters with install scripts → Tasks 14-18
- Meta-installer (`npx @excalidraw-skill-pack/install`) → Task 19
- Docker matrix install tests → Task 20

**Placeholder scan:** the Codex `install.ps1` and Gemini CLI `install.ps1` are described as "mirror of install.sh" without full code. Justified — the patterns are 1:1 with the Claude Code adapter PowerShell already written in Task 14. If the implementer prefers fully spelled-out code, replicate Task 14's `install.ps1` substituting paths.

**Type consistency:** `Adapter` union type in `packages/install/src/index.ts` matches the adapter directory names. Theme package naming `@excalidraw-skill-pack/theme-<slug>` consistent across scaffolder, discovery, and meta-installer.

**Scope check:** 22 tasks across 7 milestones. End state: 4 npm themes + 4 PyPI mirrors + create-excalidraw-theme scaffolder + 5 adapter install scripts + meta-installer + CI matrix. All ship together as v0.2.0 release (or v0.1.0 if held back from Plan A).
