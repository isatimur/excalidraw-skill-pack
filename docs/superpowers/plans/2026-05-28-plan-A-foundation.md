# Plan A — Foundation (Bootstrap + Core + Renderers + MCP Server)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the `excalidraw-skill-pack` monorepo with publishable foundation: pnpm+uv+changesets, CI scaffolding, `@excalidraw-skill-pack/core` package, `excalidraw-render` dual-language renderer (npm + PyPI), and `@excalidraw-skill-pack/mcp-server`. After this plan, the repo can publish a v0.1.0-alpha tag and any MCP-compatible agent can use it with the bundled `default-sketchy` theme.

**Architecture:** pnpm workspaces for JS packages, uv per Python package, changesets for npm versioning, parallel publish workflow for PyPI. One HTML render template symlinked into both renderer bindings. MCP server wraps Node renderer + core methodology.

**Tech Stack:** TypeScript 5, Node 20+, Python 3.11+, pnpm 9, uv, Playwright (Chromium), `@modelcontextprotocol/sdk`, Vitest, pytest, changesets, GitHub Actions, ESLint, Ruff, MyPy.

**Prerequisite reading for the implementer:**
- `docs/superpowers/specs/2026-05-28-excalidraw-universal-skill-pack-design.md` — full design
- `~/.claude/skills/excalidraw-diagram/SKILL.md` — methodology (port source)
- `~/.claude/skills/excalidraw-diagram/references/render_excalidraw.py` — Python renderer (port source)
- `~/.claude/skills/excalidraw-diagram/references/render_template.html` — HTML template (port source)

---

## File Structure

```
excalidraw-skill-pack/
├── package.json                                 # root: pnpm workspace, scripts, dev deps
├── pnpm-workspace.yaml                          # workspace members
├── tsconfig.base.json                           # shared TS config
├── .changeset/config.json                       # changesets config
├── .editorconfig
├── .gitignore
├── LICENSE                                      # MIT
├── README.md                                    # placeholder, real hero in Plan C
├── .github/workflows/
│   ├── ci.yml                                   # lint + typecheck + test on PR/push
│   ├── publish-npm.yml                          # publish npm packages on changesets release
│   └── publish-pypi.yml                         # publish Python packages on tag
├── packages/
│   ├── core/                                    # @excalidraw-skill-pack/core (npm)
│   │   ├── package.json
│   │   ├── SKILL.md                             # methodology
│   │   ├── element-templates.md
│   │   ├── json-schema.md
│   │   ├── theme.schema.json                    # JSON Schema for theme.json
│   │   ├── src/validate-theme.ts                # validate-theme CLI
│   │   ├── src/theme-loader.ts                  # resolves theme, merges extends
│   │   ├── src/types.ts                         # Theme, Palette, Typography types
│   │   ├── tests/theme-loader.test.ts
│   │   ├── tests/validate-theme.test.ts
│   │   └── themes/default-sketchy/              # bundled theme
│   │       ├── theme.json
│   │       ├── palette.json
│   │       ├── palette.md
│   │       ├── typography.json
│   │       ├── elements/
│   │       │   ├── box.json
│   │       │   ├── callout.json
│   │       │   └── arrow.json
│   │       └── layouts/
│   │           ├── chapter-card.md
│   │           ├── flow-pipeline.md
│   │           ├── concept-card.md
│   │           ├── layered-stack.md
│   │           ├── relationship-map.md
│   │           └── inline-figure.md
│   ├── shared/
│   │   ├── render_template.html                 # the one HTML template
│   │   └── fixtures/                            # 5-diagram canary set for both renderers
│   │       ├── 01-flow-pipeline.excalidraw
│   │       ├── 02-layered-stack.excalidraw
│   │       ├── 03-concept-card.excalidraw
│   │       ├── 04-relationship-map.excalidraw
│   │       ├── 05-inline-figure.excalidraw
│   │       └── golden/                          # PNG goldens (regenerated in CI on theme change)
│   ├── renderer-python/                         # excalidraw-render (PyPI)
│   │   ├── pyproject.toml
│   │   ├── README.md
│   │   ├── src/excalidraw_render/
│   │   │   ├── __init__.py
│   │   │   ├── __main__.py                      # CLI entry
│   │   │   ├── cli.py
│   │   │   ├── render.py                        # the rendering logic
│   │   │   ├── theme.py                         # theme resolution (mirrors TS theme-loader)
│   │   │   └── render_template.html             # symlink → ../../shared/render_template.html
│   │   └── tests/
│   │       ├── test_cli.py
│   │       ├── test_render.py
│   │       └── test_canary.py                   # 5-diagram golden-PNG regression
│   ├── renderer-node/                           # excalidraw-render (npm)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── README.md
│   │   ├── src/
│   │   │   ├── cli.ts                           # CLI entry (bin)
│   │   │   ├── render.ts                        # rendering logic
│   │   │   ├── theme.ts                         # theme resolution
│   │   │   └── render_template.html             # symlink → ../../shared/render_template.html
│   │   └── tests/
│   │       ├── cli.test.ts
│   │       ├── render.test.ts
│   │       ├── canary.test.ts                   # 5-diagram golden-PNG regression
│   │       └── parity.test.ts                   # Node vs Python pixel-diff parity
│   └── mcp-server/                              # @excalidraw-skill-pack/mcp-server (npm)
│       ├── package.json
│       ├── tsconfig.json
│       ├── README.md
│       ├── src/
│       │   ├── server.ts                        # MCP stdio bootstrap
│       │   ├── tools/
│       │   │   ├── generate-diagram-prompt.ts
│       │   │   ├── render-diagram.ts
│       │   │   ├── audit-diagram.ts
│       │   │   ├── list-themes.ts
│       │   │   └── apply-theme.ts
│       │   └── theme.ts                         # re-exports core theme-loader
│       └── tests/
│           ├── server.test.ts
│           ├── tool-generate-diagram-prompt.test.ts
│           ├── tool-render-diagram.test.ts
│           ├── tool-audit-diagram.test.ts
│           ├── tool-list-themes.test.ts
│           └── tool-apply-theme.test.ts
└── tools/
    ├── sync-versions.ts                         # lockstep bump renderer + mcp-server
    └── package-template.json                    # used by create-excalidraw-theme (Plan B)
```

---

# Milestone 1 — Repo Skeleton

### Task 1: Initialize the workspace root

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `LICENSE`
- Create: `README.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "excalidraw-skill-pack",
  "version": "0.0.0",
  "private": true,
  "description": "Universal skill pack: make your AI agent argue visually.",
  "license": "MIT",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "changeset": "changeset",
    "version": "changeset version",
    "release": "pnpm build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0"
  }
}
```

- [ ] **Step 2: Write `pnpm-workspace.yaml`**

```yaml
packages:
  - "packages/*"
```

- [ ] **Step 3: Write `.gitignore`**

```
node_modules/
dist/
.turbo/
.next/
*.log
.DS_Store
.env
.env.local
__pycache__/
*.pyc
.venv/
.pytest_cache/
.ruff_cache/
.mypy_cache/
htmlcov/
.coverage
*.egg-info/
build/
.changeset/*-*.md
!.changeset/README.md
!.changeset/config.json
```

- [ ] **Step 4: Write `.editorconfig`**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.py]
indent_size = 4

[*.md]
trim_trailing_whitespace = false
```

- [ ] **Step 5: Write `LICENSE` (MIT)**

```
MIT License

Copyright (c) 2026 Timur Isachenko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 6: Write `README.md` placeholder**

```markdown
# excalidraw-skill-pack

> Make your AI agent argue visually.

Universal skill pack for Excalidraw diagrams across Claude Code, Cursor, Codex, Gemini CLI, and any MCP-compatible agent.

**Status:** under construction. See [`docs/superpowers/specs/`](docs/superpowers/specs/) for the design.
```

- [ ] **Step 7: Install root deps and verify**

```bash
pnpm install
```
Expected: pnpm creates `node_modules/` and `pnpm-lock.yaml`; no errors.

- [ ] **Step 8: Commit**

```bash
git add package.json pnpm-workspace.yaml .gitignore .editorconfig LICENSE README.md pnpm-lock.yaml
git commit -m "chore: initialize pnpm workspace"
```

---

### Task 2: TypeScript base config

**Files:**
- Create: `tsconfig.base.json`

- [ ] **Step 1: Write the base TS config**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add tsconfig.base.json
git commit -m "chore: add tsconfig base"
```

---

### Task 3: Initialize changesets

**Files:**
- Create: `.changeset/config.json`
- Create: `.changeset/README.md`

- [ ] **Step 1: Init changesets via CLI**

Run: `pnpm changeset init`
Expected: `.changeset/config.json` and `.changeset/README.md` created.

- [ ] **Step 2: Edit `.changeset/config.json` to enable public publish**

```json
{
  "$schema": "https://unpkg.com/@changesets/config@2.3.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

- [ ] **Step 3: Commit**

```bash
git add .changeset/
git commit -m "chore: init changesets with public access"
```

---

# Milestone 2 — CI Scaffolding

### Task 4: Add ESLint config

**Files:**
- Create: `eslint.config.js` (root, flat config)
- Modify: `package.json` (add eslint devDeps)

- [ ] **Step 1: Add ESLint deps**

```bash
pnpm add -wD eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser typescript-eslint
```

- [ ] **Step 2: Write `eslint.config.js`**

```js
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/coverage/**"]
  },
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module"
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  }
);
```

- [ ] **Step 3: Add lint script to root `package.json`**

Already present (`"lint": "pnpm -r lint"`). Verify.

- [ ] **Step 4: Run lint to verify config loads (will report no files yet)**

Run: `pnpm exec eslint --max-warnings=0 . || true`
Expected: no crash; possibly "no files matching" warning.

- [ ] **Step 5: Commit**

```bash
git add eslint.config.js package.json pnpm-lock.yaml
git commit -m "chore: add eslint flat config"
```

---

### Task 5: Add Ruff config for Python packages

**Files:**
- Create: `ruff.toml` (root, shared by all Python packages)

- [ ] **Step 1: Write `ruff.toml`**

```toml
target-version = "py311"
line-length = 100

[lint]
select = ["E", "F", "I", "B", "UP", "N", "RUF"]
ignore = ["E501"]  # line length warnings off; formatter handles it

[format]
quote-style = "double"
indent-style = "space"
```

- [ ] **Step 2: Commit**

```bash
git add ruff.toml
git commit -m "chore: add ruff config"
```

---

### Task 6: CI workflow — lint + typecheck

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Write `ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  lint-typecheck:
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
      - run: pnpm lint
      - run: pnpm typecheck

  python-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - run: uvx ruff check packages/renderer-python
      - run: uvx ruff format --check packages/renderer-python
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add lint + typecheck workflow"
```

---

### Task 7: CI workflow — test runner

**Files:**
- Modify: `.github/workflows/ci.yml` (append `test` job)

- [ ] **Step 1: Append `test` job to `ci.yml`**

```yaml
  test-node:
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
      - run: pnpm exec playwright install chromium --with-deps
      - run: pnpm test

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v3
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - working-directory: packages/renderer-python
        run: |
          uv sync
          uv run playwright install chromium --with-deps
          uv run pytest
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add test runners for node and python"
```

---

### Task 8: CI workflow — npm publish

**Files:**
- Create: `.github/workflows/publish-npm.yml`

- [ ] **Step 1: Write the publish workflow**

```yaml
name: Publish npm

on:
  push:
    branches: [main]

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v3
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: pnpm
          registry-url: "https://registry.npmjs.org"
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/publish-npm.yml
git commit -m "ci: add changesets-driven npm publish"
```

---

### Task 9: CI workflow — PyPI publish

**Files:**
- Create: `.github/workflows/publish-pypi.yml`

- [ ] **Step 1: Write the PyPI publish workflow**

```yaml
name: Publish PyPI

on:
  push:
    tags:
      - "excalidraw-render@*"
      - "excalidraw-skill-pack-*@*"

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - uses: astral-sh/setup-uv@v3
      - name: Resolve package from tag
        id: pkg
        run: |
          TAG="${GITHUB_REF#refs/tags/}"
          PKG_NAME="${TAG%@*}"
          case "$PKG_NAME" in
            excalidraw-render) DIR="packages/renderer-python" ;;
            excalidraw-skill-pack-*) DIR="packages/themes/${PKG_NAME#excalidraw-skill-pack-theme-}" ;;
            *) echo "unknown package: $PKG_NAME"; exit 1 ;;
          esac
          echo "dir=$DIR" >> "$GITHUB_OUTPUT"
      - name: Build
        working-directory: ${{ steps.pkg.outputs.dir }}
        run: uv build
      - name: Publish
        working-directory: ${{ steps.pkg.outputs.dir }}
        env:
          UV_PUBLISH_TOKEN: ${{ secrets.PYPI_TOKEN }}
        run: uv publish
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/publish-pypi.yml
git commit -m "ci: add PyPI publish on package tag"
```

---

# Milestone 3 — Core Package: SKILL.md + Schemas

### Task 10: Create `packages/core` skeleton

**Files:**
- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`

- [ ] **Step 1: Write `packages/core/package.json`**

```json
{
  "name": "@excalidraw-skill-pack/core",
  "version": "0.0.0",
  "description": "Core methodology, schemas, and bundled default-sketchy theme for excalidraw-skill-pack.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./skill": "./SKILL.md",
    "./theme-schema": "./theme.schema.json",
    "./themes/default-sketchy": "./themes/default-sketchy/theme.json"
  },
  "files": [
    "dist",
    "SKILL.md",
    "element-templates.md",
    "json-schema.md",
    "theme.schema.json",
    "themes/default-sketchy"
  ],
  "bin": {
    "validate-theme": "./dist/validate-theme.js"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint src",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "ajv": "^8.12.0"
  },
  "devDependencies": {
    "vitest": "^1.5.0"
  }
}
```

- [ ] **Step 2: Write `packages/core/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Install package deps**

```bash
pnpm install
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/ pnpm-lock.yaml
git commit -m "feat(core): scaffold package"
```

---

### Task 11: Port SKILL.md from existing skill

**Files:**
- Create: `packages/core/SKILL.md`

- [ ] **Step 1: Copy SKILL.md verbatim from existing skill, replacing only the customization paragraph**

```bash
cp ~/.claude/skills/excalidraw-diagram/SKILL.md packages/core/SKILL.md
```

- [ ] **Step 2: Edit the "## Customization" section to reference theme packages**

Open `packages/core/SKILL.md`, find the section starting `## Customization`, and replace it with:

```markdown
## Customization

**All colors, typography, and layout rules live in the active theme.** Themes are standalone packages: `default-sketchy` is bundled in core; additional themes ship as `@excalidraw-skill-pack/theme-*` (npm) or `excalidraw-skill-pack-theme-*` (PyPI).

The active theme is resolved per call (`--theme` flag), per project (`.excalidraw-skill-pack.json`), or globally (`~/.excalidraw-skill-pack/config.json`). The MCP server's `generate_diagram_prompt` tool splices the active theme's `palette.md` and any requested `layouts/<template>.md` into the agent's system prompt at call time.

To author a new theme: `npx create-excalidraw-theme my-brand`. See `docs.excalidraw-skill-pack.dev/themes/create`.
```

- [ ] **Step 3: Commit**

```bash
git add packages/core/SKILL.md
git commit -m "feat(core): port SKILL.md methodology from origin skill"
```

---

### Task 12: Port element-templates and json-schema docs

**Files:**
- Create: `packages/core/element-templates.md`
- Create: `packages/core/json-schema.md`

- [ ] **Step 1: Copy both**

```bash
cp ~/.claude/skills/excalidraw-diagram/references/element-templates.md packages/core/element-templates.md
cp ~/.claude/skills/excalidraw-diagram/references/json-schema.md packages/core/json-schema.md
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/element-templates.md packages/core/json-schema.md
git commit -m "feat(core): port element-templates and json-schema docs"
```

---

### Task 13: Define `theme.schema.json`

**Files:**
- Create: `packages/core/theme.schema.json`

- [ ] **Step 1: Write the schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://excalidraw-skill-pack.dev/theme.schema.json",
  "title": "Excalidraw Skill Pack Theme Manifest",
  "type": "object",
  "required": ["name", "version"],
  "additionalProperties": false,
  "properties": {
    "name": {
      "type": "string",
      "pattern": "^[a-z][a-z0-9-]*$",
      "description": "kebab-case theme identifier; the package suffix"
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+(-[A-Za-z0-9.-]+)?$",
      "description": "semver"
    },
    "extends": {
      "type": "string",
      "description": "Parent theme name. Inherits palette, typography, elements, layouts."
    },
    "description": { "type": "string" },
    "preview": {
      "type": "string",
      "description": "Path or URL to preview PNG, relative to theme.json or absolute."
    },
    "homepage": { "type": "string", "format": "uri" },
    "license": { "type": "string" },
    "author": { "type": ["string", "object"] },
    "roles": {
      "type": "object",
      "description": "Semantic color roles. Used by apply_theme to remap across themes.",
      "additionalProperties": false,
      "properties": {
        "ink": { "type": "string", "description": "primary text/stroke" },
        "paper": { "type": "string", "description": "main background" },
        "accent": { "type": "string", "description": "primary brand accent" },
        "accent_alt": { "type": "string" },
        "evidence_bg": { "type": "string", "description": "evidence artifact background" },
        "evidence_text": { "type": "string" },
        "muted": { "type": "string", "description": "secondary text/grid" },
        "warning": { "type": "string" },
        "danger": { "type": "string" }
      }
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add packages/core/theme.schema.json
git commit -m "feat(core): add theme manifest JSON Schema"
```

---

### Task 14: Implement `validate-theme` CLI — failing test first

**Files:**
- Create: `packages/core/tests/validate-theme.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { validateThemeJson } from "../src/validate-theme.js";

describe("validateThemeJson", () => {
  it("accepts a minimal valid manifest", () => {
    const result = validateThemeJson({
      name: "my-theme",
      version: "1.0.0"
    });
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
```

- [ ] **Step 2: Run the test, verify it fails**

Run: `pnpm --filter @excalidraw-skill-pack/core test`
Expected: FAIL with "Cannot find module .../validate-theme" or similar.

- [ ] **Step 3: Implement `validate-theme.ts`**

Create `packages/core/src/validate-theme.ts`:

```typescript
import Ajv from "ajv";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const schema = JSON.parse(
  readFileSync(join(__dirname, "..", "theme.schema.json"), "utf-8")
);

const ajv = new Ajv({ allErrors: true });
const validator = ajv.compile(schema);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateThemeJson(data: unknown): ValidationResult {
  const valid = validator(data) as boolean;
  const errors = valid
    ? []
    : (validator.errors ?? []).map(
        (e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`
      );
  return { valid, errors };
}

// CLI entry: `validate-theme <path>`
if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: validate-theme <path-to-theme.json-or-dir>");
    process.exit(2);
  }
  const file = target.endsWith(".json") ? target : join(target, "theme.json");
  let data: unknown;
  try {
    data = JSON.parse(readFileSync(file, "utf-8"));
  } catch (e) {
    console.error(`Cannot read ${file}: ${(e as Error).message}`);
    process.exit(2);
  }
  const result = validateThemeJson(data);
  if (result.valid) {
    console.log(`OK: ${file}`);
    process.exit(0);
  } else {
    console.error(`INVALID: ${file}`);
    for (const err of result.errors) console.error(`  ${err}`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Run the test, verify it passes**

Run: `pnpm --filter @excalidraw-skill-pack/core test`
Expected: 4 tests PASS.

- [ ] **Step 5: Add `src/index.ts` to re-export**

```typescript
export { validateThemeJson } from "./validate-theme.js";
export type { ValidationResult } from "./validate-theme.js";
```

- [ ] **Step 6: Build the package to verify TS emits**

Run: `pnpm --filter @excalidraw-skill-pack/core build`
Expected: `packages/core/dist/` populated with `.js`, `.d.ts`, `.js.map`.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src packages/core/tests
git commit -m "feat(core): add validate-theme CLI with ajv"
```

---

# Milestone 4 — Core Package: default-sketchy Theme

### Task 15: Port palette from existing skill

**Files:**
- Create: `packages/core/themes/default-sketchy/theme.json`
- Create: `packages/core/themes/default-sketchy/palette.json`
- Create: `packages/core/themes/default-sketchy/palette.md`

- [ ] **Step 1: Write `theme.json`**

```json
{
  "name": "default-sketchy",
  "version": "0.1.0",
  "description": "The original hand-drawn Excalidraw look. Bundled with core; always available.",
  "license": "MIT",
  "author": "Timur Isachenko",
  "roles": {
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
}
```

- [ ] **Step 2: Write `palette.json` — machine-readable color tokens**

```json
{
  "ink": "#1e1e1e",
  "paper": "#ffffff",
  "accent": "#1971c2",
  "accent_alt": "#e8590c",
  "evidence_bg": "#1e1e1e",
  "evidence_text": "#d4d4d4",
  "muted": "#868e96",
  "warning": "#f08c00",
  "danger": "#c92a2a",
  "syntax": {
    "string": "#a5d6a7",
    "keyword": "#ce93d8",
    "number": "#90caf9",
    "comment": "#666666"
  }
}
```

- [ ] **Step 3: Port `palette.md` from existing skill's `color-palette.md`**

```bash
cp ~/.claude/skills/excalidraw-diagram/references/color-palette.md packages/core/themes/default-sketchy/palette.md
```

- [ ] **Step 4: Commit**

```bash
git add packages/core/themes/default-sketchy/
git commit -m "feat(core): add default-sketchy palette and manifest"
```

---

### Task 16: Add `typography.json` and element overrides for default-sketchy

**Files:**
- Create: `packages/core/themes/default-sketchy/typography.json`
- Create: `packages/core/themes/default-sketchy/elements/box.json`
- Create: `packages/core/themes/default-sketchy/elements/callout.json`
- Create: `packages/core/themes/default-sketchy/elements/arrow.json`

- [ ] **Step 1: Write `typography.json`**

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

> Excalidraw `fontFamily` integers: 1 = Virgil (hand-drawn), 2 = Helvetica, 3 = Cascadia, 4 = LocalFont.

- [ ] **Step 2: Write `elements/box.json` — default style for rectangles**

```json
{
  "strokeColor": "#1e1e1e",
  "backgroundColor": "transparent",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "roundness": { "type": 3 },
  "fillStyle": "solid"
}
```

- [ ] **Step 3: Write `elements/callout.json`**

```json
{
  "strokeColor": "#1971c2",
  "backgroundColor": "#a5d8ff",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "roundness": { "type": 3 },
  "fillStyle": "solid"
}
```

- [ ] **Step 4: Write `elements/arrow.json`**

```json
{
  "strokeColor": "#1e1e1e",
  "strokeWidth": 2,
  "strokeStyle": "solid",
  "roughness": 1,
  "startArrowhead": null,
  "endArrowhead": "arrow"
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/core/themes/default-sketchy/typography.json packages/core/themes/default-sketchy/elements/
git commit -m "feat(core): add default-sketchy typography and element overrides"
```

---

### Task 17: Port 6 layout templates from existing book templates

**Files:**
- Create: `packages/core/themes/default-sketchy/layouts/chapter-card.md`
- Create: `packages/core/themes/default-sketchy/layouts/flow-pipeline.md`
- Create: `packages/core/themes/default-sketchy/layouts/concept-card.md`
- Create: `packages/core/themes/default-sketchy/layouts/layered-stack.md`
- Create: `packages/core/themes/default-sketchy/layouts/relationship-map.md`
- Create: `packages/core/themes/default-sketchy/layouts/inline-figure.md`

- [ ] **Step 1: Write `chapter-card.md`**

```markdown
# chapter-card

A single-page argument card. One bold title, one anchor visual (left), and 3-5 supporting beats (right). Use for chapter openers, section headers, or summary slides.

## Structure

- **Left half:** the anchor visual (a single strong shape, a small flow, or an evidence artifact).
- **Right half:** the title (top), 3-5 supporting beats (middle), and a single takeaway sentence (bottom).
- **Outer frame:** a 1.5px stroke rectangle with `roundness.type: 3` and `roughness: 1`.

## Constraints

- One headline (≤8 words). One takeaway (≤16 words). Beats are 3-5 nouns/short phrases, not sentences.
- The anchor visual must pass the Isomorphism Test: removing the text on the right, the left visual still hints at the meaning.
- Use the `ink` role for strokes and `accent` for the takeaway emphasis.

## Anti-patterns

- Two headlines.
- Body copy on the right (use beats, not paragraphs).
- A purely decorative anchor visual.
```

- [ ] **Step 2: Write `flow-pipeline.md`**

```markdown
# flow-pipeline

A left-to-right sequence of N stages connected by arrows, with optional evidence artifacts hanging off each stage. Use for protocols, data pipelines, methodologies.

## Structure

- N stage boxes in a horizontal row, evenly spaced, same height.
- Arrows between stages: `endArrowhead: "arrow"`, `strokeWidth: 2`.
- Below each stage (optional): an evidence artifact (code snippet, JSON sample, data shape).
- Above each stage (optional): a brief label or quantitative tag.

## Constraints

- 3-7 stages. More than 7 means the diagram is doing too much — split.
- Stage names are short (1-3 words). Verbs preferred ("Redact" beats "Redaction Step").
- Every stage either teaches something concrete (via evidence artifact) or is a single-purpose verb.

## Anti-patterns

- Branching arrows (use `relationship-map` instead).
- Stages of wildly different heights or widths.
- Evidence artifacts that just repeat the stage label.
```

- [ ] **Step 3: Write `concept-card.md`**

```markdown
# concept-card

A single concept rendered as a centered visual + a 1-sentence definition + 2-3 evidence anchors. Use for glossary entries, mental models, or atomic ideas.

## Structure

- Title centered top (≤5 words).
- Visual in the middle (one shape, one diagram, or one evidence artifact).
- 1-sentence definition below the visual (≤25 words).
- 2-3 evidence anchors at the bottom: source name, video timestamp, or citation.

## Constraints

- One concept per card. If you need two, make two cards.
- Visual must be the heart of the argument, not decoration.
- Evidence anchors are non-negotiable for technical concepts.

## Anti-patterns

- Multi-paragraph definitions.
- Multiple concepts crammed into one card.
- Decorative visuals with no semantic load.
```

- [ ] **Step 4: Write `layered-stack.md`**

```markdown
# layered-stack

A vertical stack of N labeled layers, optionally with arrows showing data flow between them. Use for system architectures, abstraction layers, dependency hierarchies.

## Structure

- N rectangles stacked vertically, same width, varying heights ok.
- Each layer label is left-aligned inside.
- Optional right column: 1-2 evidence artifacts per layer (e.g., the actual library name).
- Optional arrows down/up the right edge showing call/response flow.

## Constraints

- 3-7 layers. The bottom layer is usually infrastructure; the top is user-facing.
- Layer order encodes dependency: top depends on bottom.
- Each layer label is 1-3 words, possibly with a parenthetical tech name.

## Anti-patterns

- Hidden ordering (alphabetical instead of dependency).
- Layers that overlap or merge.
- Evidence artifacts that are unrelated to the layer they sit beside.
```

- [ ] **Step 5: Write `relationship-map.md`**

```markdown
# relationship-map

A graph of N entities (nodes) connected by labeled edges. Use for entity-relationship sketches, concept graphs, social/communication networks.

## Structure

- N nodes positioned with care (force-directed or hand-laid; not grid).
- Edges between nodes carry labels (verbs preferred): "publishes to", "consumes from", "owns".
- Optionally cluster nodes by role with a soft background shape.

## Constraints

- ≤12 nodes. Above 12 the map stops teaching; split into sub-maps.
- Every edge label is a verb or prepositional phrase, never a noun.
- Node labels are nouns (entities, not actions).

## Anti-patterns

- Unlabeled edges.
- Crossing edges that could be untangled by re-positioning.
- Trees pretending to be graphs (use `layered-stack` if it's a tree).
```

- [ ] **Step 6: Write `inline-figure.md`**

```markdown
# inline-figure

A single small composite figure intended to live inside body text (a paragraph break in an article, a step in a tutorial, a chart in a slide). Use when the figure must read in ≤5 seconds.

## Structure

- Aspect ratio ~16:9 or ~3:2.
- One central object (the argument), with at most one annotation.
- No title bar — the figure is meant to be referenced by the surrounding text's "Figure N.M" callout.

## Constraints

- ≤5 elements total (not counting the optional annotation arrow).
- One color of accent (the `accent` role); everything else `ink` / `muted`.
- Must read at 50% scale (it'll be embedded small).

## Anti-patterns

- Too many shapes (use `concept-card` instead).
- A title (let the surrounding text title it).
- Multiple accent colors competing for attention.
```

- [ ] **Step 7: Commit**

```bash
git add packages/core/themes/default-sketchy/layouts/
git commit -m "feat(core): add default-sketchy 6 layout templates"
```

---

### Task 18: Implement theme-loader — failing test first

**Files:**
- Create: `packages/core/tests/theme-loader.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { loadTheme } from "../src/theme-loader.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = join(__dirname, "..", "themes");

describe("loadTheme", () => {
  it("loads default-sketchy from the bundled themes dir", async () => {
    const t = await loadTheme("default-sketchy", { themesDir });
    expect(t.manifest.name).toBe("default-sketchy");
    expect(t.palette.ink).toBe("#1e1e1e");
    expect(t.typography.fontFamily).toBe(1);
    expect(t.layouts["chapter-card"]).toContain("chapter-card");
    expect(t.elements.box.strokeColor).toBe("#1e1e1e");
  });

  it("throws on unknown theme name", async () => {
    await expect(loadTheme("nope", { themesDir })).rejects.toThrow(/not found/i);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `pnpm --filter @excalidraw-skill-pack/core test`
Expected: FAIL (theme-loader does not exist yet).

- [ ] **Step 3: Implement `theme-loader.ts`**

Create `packages/core/src/theme-loader.ts`:

```typescript
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
```

- [ ] **Step 4: Re-export from `index.ts`**

Edit `packages/core/src/index.ts`:

```typescript
export { validateThemeJson } from "./validate-theme.js";
export type { ValidationResult } from "./validate-theme.js";
export { loadTheme } from "./theme-loader.js";
export type {
  ThemeManifest,
  Palette,
  Typography,
  ElementOverride,
  ResolvedTheme,
  LoadOptions
} from "./theme-loader.js";
```

- [ ] **Step 5: Run tests, verify PASS**

Run: `pnpm --filter @excalidraw-skill-pack/core test`
Expected: 6 tests PASS (4 from Task 14 + 2 from Task 18).

- [ ] **Step 6: Build, verify clean output**

Run: `pnpm --filter @excalidraw-skill-pack/core build`
Expected: `packages/core/dist/` contains theme-loader.js, validate-theme.js, index.js, .d.ts files.

- [ ] **Step 7: Commit**

```bash
git add packages/core/src/theme-loader.ts packages/core/src/index.ts packages/core/tests/theme-loader.test.ts
git commit -m "feat(core): add theme-loader with extends-based inheritance"
```

---

# Milestone 5 — Shared HTML Render Template

### Task 19: Port the render template

**Files:**
- Create: `packages/shared/render_template.html`

- [ ] **Step 1: Copy the existing template**

```bash
mkdir -p packages/shared
cp ~/.claude/skills/excalidraw-diagram/references/render_template.html packages/shared/render_template.html
```

- [ ] **Step 2: Verify the template references `@excalidraw/excalidraw` from CDN or bundled — read the file**

If it loads Excalidraw from a CDN, leave as-is. If it expects a local copy, add a TODO note in the task description (not the file). Both renderers will mount the same file.

- [ ] **Step 3: Commit**

```bash
git add packages/shared/render_template.html
git commit -m "feat(shared): port render_template.html"
```

---

### Task 20: Create 5-diagram canary fixture set

**Files:**
- Create: `packages/shared/fixtures/01-flow-pipeline.excalidraw`
- Create: `packages/shared/fixtures/02-layered-stack.excalidraw`
- Create: `packages/shared/fixtures/03-concept-card.excalidraw`
- Create: `packages/shared/fixtures/04-relationship-map.excalidraw`
- Create: `packages/shared/fixtures/05-inline-figure.excalidraw`

- [ ] **Step 1: Pick 5 representative diagrams from the book**

```bash
cp ~/Dev/LifeOS/knowledge-bases/ai-engineer-book/diagrams/02-autoresearch-machine.excalidraw \
   packages/shared/fixtures/01-flow-pipeline.excalidraw
cp ~/Dev/LifeOS/knowledge-bases/ai-engineer-book/diagrams/03-scaffolding-stack.excalidraw \
   packages/shared/fixtures/02-layered-stack.excalidraw
cp ~/Dev/LifeOS/knowledge-bases/ai-engineer-book/diagrams/templates/concept-card.excalidraw \
   packages/shared/fixtures/03-concept-card.excalidraw
cp ~/Dev/LifeOS/knowledge-bases/ai-engineer-book/diagrams/templates/relationship-map.excalidraw \
   packages/shared/fixtures/04-relationship-map.excalidraw
cp ~/Dev/LifeOS/knowledge-bases/ai-engineer-book/diagrams/templates/inline-figure.excalidraw \
   packages/shared/fixtures/05-inline-figure.excalidraw
```

- [ ] **Step 2: Commit**

```bash
git add packages/shared/fixtures/
git commit -m "test(shared): seed 5-diagram canary fixtures from book"
```

---

# Milestone 6 — Python Renderer

### Task 21: Scaffold `renderer-python`

**Files:**
- Create: `packages/renderer-python/pyproject.toml`
- Create: `packages/renderer-python/README.md`
- Create: `packages/renderer-python/src/excalidraw_render/__init__.py`

- [ ] **Step 1: Write `pyproject.toml`**

```toml
[project]
name = "excalidraw-render"
version = "0.0.0"
description = "Render Excalidraw JSON to PNG. Python binding for excalidraw-skill-pack."
readme = "README.md"
license = "MIT"
requires-python = ">=3.11"
authors = [{ name = "Timur Isachenko" }]
dependencies = [
    "playwright>=1.40.0"
]

[project.scripts]
excalidraw-render = "excalidraw_render.cli:main"

[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[tool.hatch.build.targets.wheel]
packages = ["src/excalidraw_render"]

[tool.hatch.build.targets.wheel.force-include]
"src/excalidraw_render/render_template.html" = "excalidraw_render/render_template.html"

[dependency-groups]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.23.0",
    "pillow>=10.0.0",
    "pixelmatch>=0.3.0"
]
```

- [ ] **Step 2: Write `README.md`**

```markdown
# excalidraw-render (Python)

Render Excalidraw JSON to PNG via Playwright + Chromium.

## Install

```bash
pipx install excalidraw-render
playwright install chromium
```

## Use

```bash
excalidraw-render diagram.excalidraw --theme default-sketchy --output out.png --scale 2 --width 1920
```

## Programmatic

```python
from excalidraw_render import render_to_png
png_bytes = render_to_png(json_str, theme="default-sketchy", scale=2)
```

Identical CLI to `npx excalidraw-render` on the Node side. Both bindings produce the same output bytes (within 1px tolerance).
```

- [ ] **Step 3: Write empty `__init__.py`**

```python
"""excalidraw-render: render Excalidraw JSON to PNG."""

from excalidraw_render.render import render_to_png

__all__ = ["render_to_png"]
__version__ = "0.0.0"
```

- [ ] **Step 4: Symlink the shared render template**

```bash
mkdir -p packages/renderer-python/src/excalidraw_render
ln -s ../../../shared/render_template.html packages/renderer-python/src/excalidraw_render/render_template.html
```

- [ ] **Step 5: Sync deps**

```bash
cd packages/renderer-python && uv sync && cd ../..
```

- [ ] **Step 6: Commit**

```bash
git add packages/renderer-python/
git commit -m "feat(renderer-python): scaffold package"
```

---

### Task 22: Implement theme resolution in Python — failing test first

**Files:**
- Create: `packages/renderer-python/tests/test_theme.py`

- [ ] **Step 1: Write the failing test**

```python
import os
from pathlib import Path
import pytest
from excalidraw_render.theme import resolve_theme, ResolvedTheme

REPO_ROOT = Path(__file__).resolve().parents[3]
CORE_THEMES = REPO_ROOT / "packages" / "core" / "themes"


def test_resolve_default_sketchy():
    t = resolve_theme("default-sketchy", themes_dir=CORE_THEMES)
    assert isinstance(t, ResolvedTheme)
    assert t.manifest["name"] == "default-sketchy"
    assert t.palette["ink"] == "#1e1e1e"


def test_unknown_theme_raises():
    with pytest.raises(LookupError, match="not found"):
        resolve_theme("nope", themes_dir=CORE_THEMES)
```

- [ ] **Step 2: Run the test, verify FAIL**

```bash
cd packages/renderer-python && uv run pytest tests/test_theme.py -v
```
Expected: FAIL (module `excalidraw_render.theme` not yet present).

- [ ] **Step 3: Implement `theme.py`**

Create `packages/renderer-python/src/excalidraw_render/theme.py`:

```python
"""Theme resolution mirroring packages/core/src/theme-loader.ts."""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any


@dataclass
class ResolvedTheme:
    manifest: dict[str, Any]
    palette: dict[str, Any]
    typography: dict[str, Any] | None
    elements: dict[str, dict[str, Any]] = field(default_factory=dict)
    layouts: dict[str, str] = field(default_factory=dict)
    palette_markdown: str = ""


def _read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_one(theme_dir: Path) -> dict[str, Any]:
    manifest = _read_json(theme_dir / "theme.json")
    palette = (
        _read_json(theme_dir / "palette.json")
        if (theme_dir / "palette.json").exists()
        else {}
    )
    typography = (
        _read_json(theme_dir / "typography.json")
        if (theme_dir / "typography.json").exists()
        else None
    )
    elements: dict[str, dict[str, Any]] = {}
    elements_dir = theme_dir / "elements"
    if elements_dir.is_dir():
        for f in elements_dir.glob("*.json"):
            elements[f.stem] = _read_json(f)
    layouts: dict[str, str] = {}
    layouts_dir = theme_dir / "layouts"
    if layouts_dir.is_dir():
        for f in layouts_dir.glob("*.md"):
            layouts[f.stem] = f.read_text(encoding="utf-8")
    palette_md_path = theme_dir / "palette.md"
    palette_markdown = (
        palette_md_path.read_text(encoding="utf-8") if palette_md_path.exists() else ""
    )
    return {
        "manifest": manifest,
        "palette": palette,
        "typography": typography,
        "elements": elements,
        "layouts": layouts,
        "palette_markdown": palette_markdown,
    }


def _merge(parent: dict[str, Any], child: dict[str, Any]) -> dict[str, Any]:
    return {
        "manifest": child["manifest"] or parent["manifest"],
        "palette": {**parent["palette"], **child["palette"]},
        "typography": child["typography"] or parent["typography"],
        "elements": {**parent["elements"], **child["elements"]},
        "layouts": {**parent["layouts"], **child["layouts"]},
        "palette_markdown": child["palette_markdown"] or parent["palette_markdown"],
    }


def resolve_theme(name: str, *, themes_dir: Path) -> ResolvedTheme:
    theme_dir = themes_dir / name
    if not (theme_dir / "theme.json").exists():
        raise LookupError(f'Theme "{name}" not found at {theme_dir}')
    resolved = _load_one(theme_dir)
    seen = {name}
    while resolved["manifest"].get("extends"):
        parent_name = resolved["manifest"]["extends"]
        if parent_name in seen:
            raise ValueError(f"Theme inheritance cycle at {parent_name}")
        seen.add(parent_name)
        parent_dir = themes_dir / parent_name
        if not (parent_dir / "theme.json").exists():
            raise LookupError(f'Parent theme "{parent_name}" not found')
        parent = _load_one(parent_dir)
        child_no_extends = {
            **resolved,
            "manifest": {**resolved["manifest"], "extends": None},
        }
        resolved = _merge(parent, child_no_extends)
    return ResolvedTheme(
        manifest=resolved["manifest"],
        palette=resolved["palette"],
        typography=resolved["typography"],
        elements=resolved["elements"],
        layouts=resolved["layouts"],
        palette_markdown=resolved["palette_markdown"],
    )
```

- [ ] **Step 4: Run the tests, verify PASS**

```bash
cd packages/renderer-python && uv run pytest tests/test_theme.py -v
```
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-python/src/excalidraw_render/theme.py packages/renderer-python/tests/test_theme.py
git commit -m "feat(renderer-python): add theme resolver"
```

---

### Task 23: Implement Python render() — failing test first

**Files:**
- Create: `packages/renderer-python/tests/test_render.py`

- [ ] **Step 1: Write the failing test**

```python
import json
from pathlib import Path

import pytest
from PIL import Image

from excalidraw_render.render import render_to_png

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = REPO_ROOT / "packages" / "shared" / "fixtures" / "05-inline-figure.excalidraw"


def test_render_to_png_produces_image_bytes():
    json_str = FIXTURE.read_text(encoding="utf-8")
    png = render_to_png(json_str, theme="default-sketchy", scale=1, width=800)
    assert png[:8] == b"\x89PNG\r\n\x1a\n", "expected PNG signature"
    # Sanity: PIL can parse it as an image with positive dimensions
    from io import BytesIO

    img = Image.open(BytesIO(png))
    assert img.width > 100
    assert img.height > 100
```

- [ ] **Step 2: Run the test, verify FAIL**

```bash
cd packages/renderer-python && uv run pytest tests/test_render.py -v
```
Expected: FAIL (`render_to_png` not implemented).

- [ ] **Step 3: Implement `render.py`**

Create `packages/renderer-python/src/excalidraw_render/render.py`:

```python
"""Render Excalidraw JSON to PNG via Playwright + headless Chromium."""

from __future__ import annotations

import base64
import json
from importlib.resources import files
from pathlib import Path
from typing import Any

from playwright.sync_api import sync_playwright


def _load_template() -> str:
    return (files("excalidraw_render") / "render_template.html").read_text(
        encoding="utf-8"
    )


def render_to_png(
    excalidraw_json: str,
    *,
    theme: str = "default-sketchy",
    scale: int = 2,
    width: int = 1920,
) -> bytes:
    """Render Excalidraw JSON string to PNG bytes."""
    template = _load_template()
    payload = json.loads(excalidraw_json)
    if not isinstance(payload, dict) or payload.get("type") != "excalidraw":
        raise ValueError(
            f'Expected Excalidraw JSON with type="excalidraw", got {payload.get("type")!r}'
        )

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": width, "height": width})
        page = context.new_page()
        page.set_content(template)
        # The render_template exposes window.renderExcalidraw(json, options)
        # See packages/shared/render_template.html for the contract.
        png_b64 = page.evaluate(
            "([json, opts]) => window.renderExcalidraw(json, opts)",
            [payload, {"scale": scale, "width": width, "theme": theme}],
        )
        browser.close()

    if not isinstance(png_b64, str) or not png_b64.startswith("data:image/png;base64,"):
        raise RuntimeError(f"Renderer returned unexpected value: {png_b64!r:.80}")
    return base64.b64decode(png_b64.split(",", 1)[1])
```

> **Note for the implementer:** the HTML template must expose `window.renderExcalidraw(json, opts)` returning a data-URL string. If the ported template uses a different API, adjust the `page.evaluate` call accordingly. Both renderers must agree on this single API surface.

- [ ] **Step 4: Run the tests, verify PASS**

```bash
cd packages/renderer-python && uv run playwright install chromium && uv run pytest tests/test_render.py -v
```
Expected: 1 test PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-python/src/excalidraw_render/render.py packages/renderer-python/tests/test_render.py
git commit -m "feat(renderer-python): add render_to_png via Playwright"
```

---

### Task 24: Implement Python CLI — failing test first

**Files:**
- Create: `packages/renderer-python/tests/test_cli.py`

- [ ] **Step 1: Write the failing test**

```python
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURE = REPO_ROOT / "packages" / "shared" / "fixtures" / "05-inline-figure.excalidraw"


def test_cli_renders_to_output_path(tmp_path):
    out = tmp_path / "out.png"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "excalidraw_render",
            str(FIXTURE),
            "--theme",
            "default-sketchy",
            "--output",
            str(out),
            "--scale",
            "1",
            "--width",
            "800",
        ],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stderr
    assert out.exists()
    assert out.stat().st_size > 5000
```

- [ ] **Step 2: Run the test, verify FAIL**

```bash
cd packages/renderer-python && uv run pytest tests/test_cli.py -v
```
Expected: FAIL (no `__main__` yet).

- [ ] **Step 3: Implement `cli.py`**

Create `packages/renderer-python/src/excalidraw_render/cli.py`:

```python
"""CLI for excalidraw-render."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from excalidraw_render.render import render_to_png


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="excalidraw-render",
        description="Render Excalidraw JSON to PNG via Playwright + Chromium.",
    )
    parser.add_argument("input", help="Path to .excalidraw JSON file")
    parser.add_argument(
        "--theme", default="default-sketchy", help="Theme name (default: default-sketchy)"
    )
    parser.add_argument(
        "--output", "-o", default=None, help="Output PNG path (default: <input>.png)"
    )
    parser.add_argument(
        "--scale", type=int, default=2, help="Render scale multiplier (default: 2)"
    )
    parser.add_argument(
        "--width", type=int, default=1920, help="Viewport width in px (default: 1920)"
    )
    args = parser.parse_args(argv)

    input_path = Path(args.input)
    if not input_path.exists():
        print(f"error: input file not found: {input_path}", file=sys.stderr)
        return 2

    output_path = (
        Path(args.output)
        if args.output
        else input_path.with_suffix(".png")
    )

    png = render_to_png(
        input_path.read_text(encoding="utf-8"),
        theme=args.theme,
        scale=args.scale,
        width=args.width,
    )
    output_path.write_bytes(png)
    print(f"wrote {output_path} ({len(png)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 4: Implement `__main__.py`**

Create `packages/renderer-python/src/excalidraw_render/__main__.py`:

```python
"""python -m excalidraw_render entry."""

from excalidraw_render.cli import main

raise SystemExit(main())
```

- [ ] **Step 5: Run tests, verify PASS**

```bash
cd packages/renderer-python && uv run pytest tests/test_cli.py -v
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/renderer-python/src/excalidraw_render/cli.py packages/renderer-python/src/excalidraw_render/__main__.py packages/renderer-python/tests/test_cli.py
git commit -m "feat(renderer-python): add CLI"
```

---

### Task 25: Canary regression — 5-diagram golden test

**Files:**
- Create: `packages/renderer-python/tests/test_canary.py`
- Create: `packages/shared/fixtures/golden/01-flow-pipeline.python.png`
- Create: `packages/shared/fixtures/golden/02-layered-stack.python.png`
- Create: `packages/shared/fixtures/golden/03-concept-card.python.png`
- Create: `packages/shared/fixtures/golden/04-relationship-map.python.png`
- Create: `packages/shared/fixtures/golden/05-inline-figure.python.png`

- [ ] **Step 1: Generate the golden PNGs from the current renderer**

```bash
cd packages/renderer-python
for f in ../shared/fixtures/*.excalidraw; do
  name=$(basename "$f" .excalidraw)
  uv run python -m excalidraw_render "$f" --theme default-sketchy \
    --output "../shared/fixtures/golden/$name.python.png" --scale 1 --width 800
done
```

- [ ] **Step 2: Write the canary regression test**

Create `packages/renderer-python/tests/test_canary.py`:

```python
from pathlib import Path

import pytest
from PIL import Image
from pixelmatch.contrib.PIL import pixelmatch

from excalidraw_render.render import render_to_png

REPO_ROOT = Path(__file__).resolve().parents[3]
FIXTURES = REPO_ROOT / "packages" / "shared" / "fixtures"
GOLDENS = FIXTURES / "golden"


@pytest.mark.parametrize(
    "name",
    [
        "01-flow-pipeline",
        "02-layered-stack",
        "03-concept-card",
        "04-relationship-map",
        "05-inline-figure",
    ],
)
def test_canary_within_tolerance(name: str, tmp_path: Path) -> None:
    src = FIXTURES / f"{name}.excalidraw"
    golden = GOLDENS / f"{name}.python.png"
    assert golden.exists(), f"missing golden: {golden}"

    png = render_to_png(
        src.read_text(encoding="utf-8"),
        theme="default-sketchy",
        scale=1,
        width=800,
    )
    actual_path = tmp_path / f"{name}.png"
    actual_path.write_bytes(png)

    a = Image.open(actual_path).convert("RGBA")
    g = Image.open(golden).convert("RGBA")
    assert a.size == g.size, f"size mismatch: {a.size} vs {g.size}"

    diff = Image.new("RGBA", a.size)
    mismatched = pixelmatch(a, g, diff, threshold=0.1)
    total = a.size[0] * a.size[1]
    ratio = mismatched / total
    assert ratio < 0.02, f"{name}: {ratio:.2%} pixels differ (>2% tolerance)"
```

- [ ] **Step 3: Run the canary, verify PASS**

```bash
cd packages/renderer-python && uv run pytest tests/test_canary.py -v
```
Expected: 5 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/renderer-python/tests/test_canary.py packages/shared/fixtures/golden/
git commit -m "test(renderer-python): canary regression at 2% tolerance"
```

---

# Milestone 7 — Node Renderer

### Task 26: Scaffold `renderer-node`

**Files:**
- Create: `packages/renderer-node/package.json`
- Create: `packages/renderer-node/tsconfig.json`
- Create: `packages/renderer-node/README.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "excalidraw-render",
  "version": "0.0.0",
  "description": "Render Excalidraw JSON to PNG. Node binding for excalidraw-skill-pack.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "bin": {
    "excalidraw-render": "./dist/cli.js"
  },
  "exports": {
    ".": "./dist/index.js"
  },
  "files": ["dist", "src/render_template.html"],
  "scripts": {
    "build": "tsc -p tsconfig.json && cp src/render_template.html dist/render_template.html",
    "test": "vitest run",
    "lint": "eslint src",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "@excalidraw-skill-pack/core": "workspace:*",
    "commander": "^12.0.0",
    "playwright-core": "^1.45.0",
    "playwright": "^1.45.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "pixelmatch": "^7.1.0",
    "pngjs": "^7.0.0",
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

- [ ] **Step 3: Write `README.md`**

```markdown
# excalidraw-render (Node)

Render Excalidraw JSON to PNG via Playwright + Chromium.

## Install

```bash
npx excalidraw-render diagram.excalidraw --theme default-sketchy --output out.png --scale 2 --width 1920
```

Or as a dependency:

```bash
npm i excalidraw-render
npx playwright install chromium
```

## Programmatic

```javascript
import { renderToPng } from "excalidraw-render";
const png = await renderToPng(jsonString, { theme: "default-sketchy", scale: 2 });
```

Identical CLI to `python -m excalidraw_render`. Both bindings produce the same output bytes (within 1px tolerance).
```

- [ ] **Step 4: Symlink the shared template**

```bash
mkdir -p packages/renderer-node/src
ln -s ../../shared/render_template.html packages/renderer-node/src/render_template.html
```

- [ ] **Step 5: Install deps**

```bash
pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add packages/renderer-node/ pnpm-lock.yaml
git commit -m "feat(renderer-node): scaffold package"
```

---

### Task 27: Implement Node theme resolution — failing test first

**Files:**
- Create: `packages/renderer-node/tests/theme.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { resolveTheme } from "../src/theme.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const themesDir = join(__dirname, "..", "..", "core", "themes");

describe("resolveTheme (node renderer)", () => {
  it("loads default-sketchy", async () => {
    const t = await resolveTheme("default-sketchy", themesDir);
    expect(t.manifest.name).toBe("default-sketchy");
    expect(t.palette.ink).toBe("#1e1e1e");
  });

  it("throws on unknown", async () => {
    await expect(resolveTheme("nope", themesDir)).rejects.toThrow(/not found/i);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
pnpm --filter excalidraw-render test
```
Expected: FAIL.

- [ ] **Step 3: Implement `theme.ts` by re-exporting core**

Create `packages/renderer-node/src/theme.ts`:

```typescript
import { loadTheme, type ResolvedTheme } from "@excalidraw-skill-pack/core";

export type { ResolvedTheme };

export async function resolveTheme(
  name: string,
  themesDir: string
): Promise<ResolvedTheme> {
  return loadTheme(name, { themesDir });
}
```

- [ ] **Step 4: Run, verify PASS**

```bash
pnpm --filter @excalidraw-skill-pack/core build && pnpm --filter excalidraw-render test
```
Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-node/src/theme.ts packages/renderer-node/tests/theme.test.ts
git commit -m "feat(renderer-node): theme resolution re-exports core"
```

---

### Task 28: Implement Node render() — failing test first

**Files:**
- Create: `packages/renderer-node/tests/render.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderToPng } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(
  __dirname,
  "..",
  "..",
  "shared",
  "fixtures",
  "05-inline-figure.excalidraw"
);

describe("renderToPng", () => {
  it("returns PNG bytes for a valid diagram", async () => {
    const json = await readFile(FIXTURE, "utf-8");
    const png = await renderToPng(json, { theme: "default-sketchy", scale: 1, width: 800 });
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
    expect(png.length).toBeGreaterThan(5000);
  }, 60_000);
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
pnpm --filter excalidraw-render test
```
Expected: FAIL.

- [ ] **Step 3: Implement `render.ts`**

Create `packages/renderer-node/src/render.ts`:

```typescript
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const __dirname = dirname(fileURLToPath(import.meta.url));

const TEMPLATE_PATH = join(__dirname, "render_template.html");

export interface RenderOptions {
  theme?: string;
  scale?: number;
  width?: number;
}

export async function renderToPng(
  excalidrawJson: string,
  options: RenderOptions = {}
): Promise<Buffer> {
  const { theme = "default-sketchy", scale = 2, width = 1920 } = options;
  const template = await readFile(TEMPLATE_PATH, "utf-8");
  const payload = JSON.parse(excalidrawJson) as { type?: string };
  if (payload.type !== "excalidraw") {
    throw new Error(
      `Expected Excalidraw JSON with type="excalidraw", got ${payload.type ?? "<missing>"}`
    );
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ viewport: { width, height: width } });
    const page = await context.newPage();
    await page.setContent(template);
    const dataUrl = await page.evaluate(
      ([json, opts]) =>
        (window as unknown as {
          renderExcalidraw: (j: unknown, o: unknown) => Promise<string>;
        }).renderExcalidraw(json, opts),
      [payload, { scale, width, theme }]
    );
    if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png;base64,")) {
      throw new Error(`Renderer returned unexpected value: ${String(dataUrl).slice(0, 80)}`);
    }
    return Buffer.from(dataUrl.split(",", 2)[1]!, "base64");
  } finally {
    await browser.close();
  }
}
```

- [ ] **Step 4: Run, verify PASS**

```bash
pnpm exec playwright install chromium && pnpm --filter excalidraw-render test
```
Expected: PASS.

- [ ] **Step 5: Add `index.ts`**

Create `packages/renderer-node/src/index.ts`:

```typescript
export { renderToPng } from "./render.js";
export type { RenderOptions } from "./render.js";
export { resolveTheme } from "./theme.js";
export type { ResolvedTheme } from "./theme.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/renderer-node/src packages/renderer-node/tests/render.test.ts
git commit -m "feat(renderer-node): add renderToPng via Playwright"
```

---

### Task 29: Implement Node CLI — failing test first

**Files:**
- Create: `packages/renderer-node/tests/cli.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtempSync, statSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const exec = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI = join(__dirname, "..", "dist", "cli.js");
const FIXTURE = join(
  __dirname,
  "..",
  "..",
  "shared",
  "fixtures",
  "05-inline-figure.excalidraw"
);

describe("excalidraw-render CLI", () => {
  it("renders to output path", async () => {
    const tmp = mkdtempSync(join(tmpdir(), "esp-"));
    const out = join(tmp, "out.png");
    await exec("node", [
      CLI,
      FIXTURE,
      "--theme",
      "default-sketchy",
      "--output",
      out,
      "--scale",
      "1",
      "--width",
      "800"
    ]);
    expect(existsSync(out)).toBe(true);
    expect(statSync(out).size).toBeGreaterThan(5000);
  }, 60_000);
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
pnpm --filter excalidraw-render test
```
Expected: FAIL (no dist/cli.js yet).

- [ ] **Step 3: Implement `cli.ts`**

Create `packages/renderer-node/src/cli.ts`:

```typescript
#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { renderToPng } from "./render.js";

const program = new Command();

program
  .name("excalidraw-render")
  .description("Render Excalidraw JSON to PNG via Playwright + Chromium.")
  .argument("<input>", "Path to .excalidraw JSON file")
  .option("--theme <name>", "Theme name", "default-sketchy")
  .option("-o, --output <path>", "Output PNG path (default: <input>.png)")
  .option("--scale <n>", "Render scale multiplier", (v) => parseInt(v, 10), 2)
  .option("--width <px>", "Viewport width in px", (v) => parseInt(v, 10), 1920)
  .action(async (input: string, opts: { theme: string; output?: string; scale: number; width: number }) => {
    if (!existsSync(input)) {
      console.error(`error: input file not found: ${input}`);
      process.exit(2);
    }
    const json = await readFile(input, "utf-8");
    const png = await renderToPng(json, {
      theme: opts.theme,
      scale: opts.scale,
      width: opts.width
    });
    const out = opts.output ?? resolve(input.replace(/\.excalidraw$/, ".png"));
    await writeFile(out, png);
    console.log(`wrote ${out} (${png.length} bytes)`);
  });

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
```

- [ ] **Step 4: Build and re-run**

```bash
pnpm --filter excalidraw-render build && pnpm --filter excalidraw-render test
```
Expected: 3 tests PASS (theme + render + cli).

- [ ] **Step 5: Commit**

```bash
git add packages/renderer-node/src/cli.ts packages/renderer-node/tests/cli.test.ts
git commit -m "feat(renderer-node): add CLI"
```

---

### Task 30: Canary regression — Node side

**Files:**
- Create: `packages/renderer-node/tests/canary.test.ts`
- Create: `packages/shared/fixtures/golden/01-flow-pipeline.node.png` (and 4 more)

- [ ] **Step 1: Generate Node-side goldens**

```bash
cd packages/renderer-node
for f in ../shared/fixtures/*.excalidraw; do
  name=$(basename "$f" .excalidraw)
  node dist/cli.js "$f" --theme default-sketchy \
    --output "../shared/fixtures/golden/$name.node.png" --scale 1 --width 800
done
```

- [ ] **Step 2: Write the canary test**

Create `packages/renderer-node/tests/canary.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { readFile, mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { renderToPng } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(__dirname, "..", "..", "shared", "fixtures");
const GOLDENS = join(FIXTURES, "golden");

const names = [
  "01-flow-pipeline",
  "02-layered-stack",
  "03-concept-card",
  "04-relationship-map",
  "05-inline-figure"
];

describe("canary (node renderer)", () => {
  it.each(names)("%s within 2% of golden", async (name) => {
    const src = await readFile(join(FIXTURES, `${name}.excalidraw`), "utf-8");
    const golden = PNG.sync.read(await readFile(join(GOLDENS, `${name}.node.png`)));
    const actualBuf = await renderToPng(src, { theme: "default-sketchy", scale: 1, width: 800 });
    const actual = PNG.sync.read(actualBuf);
    expect(actual.width).toBe(golden.width);
    expect(actual.height).toBe(golden.height);
    const diff = new PNG({ width: golden.width, height: golden.height });
    const mismatched = pixelmatch(
      actual.data,
      golden.data,
      diff.data,
      golden.width,
      golden.height,
      { threshold: 0.1 }
    );
    const total = golden.width * golden.height;
    expect(mismatched / total).toBeLessThan(0.02);
  }, 90_000);
});
```

- [ ] **Step 3: Run, verify PASS**

```bash
pnpm --filter excalidraw-render test
```
Expected: 5 canary cases PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/renderer-node/tests/canary.test.ts packages/shared/fixtures/golden/*.node.png
git commit -m "test(renderer-node): canary regression at 2% tolerance"
```

---

### Task 31: Parity test — Node vs Python output

**Files:**
- Create: `packages/renderer-node/tests/parity.test.ts`

- [ ] **Step 1: Write the parity test**

```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDENS = join(__dirname, "..", "..", "shared", "fixtures", "golden");

const names = [
  "01-flow-pipeline",
  "02-layered-stack",
  "03-concept-card",
  "04-relationship-map",
  "05-inline-figure"
];

describe("renderer parity (node vs python goldens)", () => {
  it.each(names)("%s: node and python goldens match within 5%", async (name) => {
    const nodeImg = PNG.sync.read(await readFile(join(GOLDENS, `${name}.node.png`)));
    const pyImg = PNG.sync.read(await readFile(join(GOLDENS, `${name}.python.png`)));
    expect(nodeImg.width).toBe(pyImg.width);
    expect(nodeImg.height).toBe(pyImg.height);
    const diff = new PNG({ width: nodeImg.width, height: nodeImg.height });
    const mismatched = pixelmatch(
      nodeImg.data,
      pyImg.data,
      diff.data,
      nodeImg.width,
      nodeImg.height,
      { threshold: 0.15 }
    );
    const total = nodeImg.width * nodeImg.height;
    // Anti-aliasing varies between platforms; 5% tolerance.
    expect(mismatched / total).toBeLessThan(0.05);
  });
});
```

- [ ] **Step 2: Run, verify PASS**

```bash
pnpm --filter excalidraw-render test -- parity
```
Expected: 5 parity cases PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/renderer-node/tests/parity.test.ts
git commit -m "test(renderer-node): parity between node and python renderers at 5% tolerance"
```

---

# Milestone 8 — MCP Server

### Task 32: Scaffold `mcp-server`

**Files:**
- Create: `packages/mcp-server/package.json`
- Create: `packages/mcp-server/tsconfig.json`
- Create: `packages/mcp-server/README.md`

- [ ] **Step 1: Write `package.json`**

```json
{
  "name": "@excalidraw-skill-pack/mcp-server",
  "version": "0.0.0",
  "description": "MCP server exposing excalidraw-skill-pack tools to any MCP-compatible AI agent.",
  "license": "MIT",
  "type": "module",
  "main": "./dist/server.js",
  "bin": {
    "excalidraw-skill-pack-mcp": "./dist/server.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "vitest run",
    "lint": "eslint src",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "start": "node dist/server.js"
  },
  "dependencies": {
    "@excalidraw-skill-pack/core": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "excalidraw-render": "workspace:*",
    "zod": "^3.23.0"
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

- [ ] **Step 3: Write `README.md`**

```markdown
# @excalidraw-skill-pack/mcp-server

MCP server exposing the excalidraw-skill-pack methodology and renderer as tools.

## Run

```bash
npx @excalidraw-skill-pack/mcp-server
```

Transport: stdio. Register in your agent's MCP config.

## Tools

| Tool | Purpose |
|---|---|
| `generate_diagram_prompt` | Returns SKILL.md + active theme palette + relevant layouts as a structured prompt payload |
| `render_diagram` | Renders JSON to PNG; returns base64 + dimensions |
| `audit_diagram` | Validates against schema + design rules |
| `list_themes` | Lists installed themes |
| `apply_theme` | Re-skins an existing .excalidraw with a different theme |
```

- [ ] **Step 4: Install deps**

```bash
pnpm install
```

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/ pnpm-lock.yaml
git commit -m "feat(mcp-server): scaffold package"
```

---

### Task 33: Implement MCP server bootstrap — failing test first

**Files:**
- Create: `packages/mcp-server/tests/server.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
```

- [ ] **Step 2: Run, verify FAIL**

```bash
pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: FAIL.

- [ ] **Step 3: Implement `server.ts`**

Create `packages/mcp-server/src/server.ts`:

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";

import { generateDiagramPromptTool } from "./tools/generate-diagram-prompt.js";
import { renderDiagramTool } from "./tools/render-diagram.js";
import { auditDiagramTool } from "./tools/audit-diagram.js";
import { listThemesTool } from "./tools/list-themes.js";
import { applyThemeTool } from "./tools/apply-theme.js";

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: object;
  handler: (args: unknown) => Promise<unknown>;
}

const tools: ToolDefinition[] = [
  generateDiagramPromptTool,
  renderDiagramTool,
  auditDiagramTool,
  listThemesTool,
  applyThemeTool
];

export function listToolDefinitions(): ToolDefinition[] {
  return tools;
}

async function main(): Promise<void> {
  const server = new Server(
    { name: "excalidraw-skill-pack", version: "0.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: tools.map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema
    }))
  }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    const { name, arguments: args } = req.params;
    const tool = tools.find((t) => t.name === name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    const result = await tool.handler(args);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
```

- [ ] **Step 4: Add stub implementations for each tool (will be filled in subsequent tasks)**

Create `packages/mcp-server/src/tools/generate-diagram-prompt.ts`:

```typescript
import type { ToolDefinition } from "../server.js";

export const generateDiagramPromptTool: ToolDefinition = {
  name: "generate_diagram_prompt",
  description: "Returns the SKILL.md methodology + active theme palette + selected layout template as a structured prompt payload. Does not call an LLM.",
  inputSchema: {
    type: "object",
    properties: {
      theme: { type: "string", description: "Theme name (default: default-sketchy)" },
      style_template: {
        type: "string",
        enum: ["chapter-card", "flow-pipeline", "concept-card", "layered-stack", "relationship-map", "inline-figure"],
        description: "Layout template to splice in"
      },
      intent: { type: "string", description: "Free-text intent the agent passes through" }
    }
  },
  handler: async () => ({ stub: true })
};
```

Create `packages/mcp-server/src/tools/render-diagram.ts`:

```typescript
import type { ToolDefinition } from "../server.js";

export const renderDiagramTool: ToolDefinition = {
  name: "render_diagram",
  description: "Render Excalidraw JSON to PNG. Returns base64 + dimensions.",
  inputSchema: {
    type: "object",
    required: ["json"],
    properties: {
      json: { type: "string", description: "Excalidraw JSON string" },
      theme: { type: "string" },
      scale: { type: "integer" },
      width: { type: "integer" }
    }
  },
  handler: async () => ({ stub: true })
};
```

Create `packages/mcp-server/src/tools/audit-diagram.ts`:

```typescript
import type { ToolDefinition } from "../server.js";

export const auditDiagramTool: ToolDefinition = {
  name: "audit_diagram",
  description: "Validate an Excalidraw JSON against schema + design rules. Returns severity-tagged issues.",
  inputSchema: {
    type: "object",
    required: ["json"],
    properties: {
      json: { type: "string" },
      theme: { type: "string" }
    }
  },
  handler: async () => ({ stub: true })
};
```

Create `packages/mcp-server/src/tools/list-themes.ts`:

```typescript
import type { ToolDefinition } from "../server.js";

export const listThemesTool: ToolDefinition = {
  name: "list_themes",
  description: "List all installed themes with their metadata and preview URLs.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => ({ stub: true })
};
```

Create `packages/mcp-server/src/tools/apply-theme.ts`:

```typescript
import type { ToolDefinition } from "../server.js";

export const applyThemeTool: ToolDefinition = {
  name: "apply_theme",
  description: "Re-skin an existing Excalidraw JSON to a different theme. Swaps stroke/background colors per the target theme's roles; optionally re-renders.",
  inputSchema: {
    type: "object",
    required: ["json", "target_theme"],
    properties: {
      json: { type: "string" },
      target_theme: { type: "string" },
      render: { type: "boolean", description: "Re-render to PNG and include in response" }
    }
  },
  handler: async () => ({ stub: true })
};
```

- [ ] **Step 5: Build and run tests**

```bash
pnpm --filter @excalidraw-skill-pack/mcp-server build && pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp-server/src packages/mcp-server/tests/server.test.ts
git commit -m "feat(mcp-server): bootstrap stdio server with 5 tool stubs"
```

---

### Task 34: Implement `list_themes` tool — failing test first

**Files:**
- Create: `packages/mcp-server/tests/tool-list-themes.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { listThemesTool } from "../src/tools/list-themes.js";

describe("list_themes", () => {
  it("returns at least default-sketchy", async () => {
    const result = (await listThemesTool.handler({})) as {
      themes: Array<{ name: string; version: string; description?: string }>;
    };
    const names = result.themes.map((t) => t.name);
    expect(names).toContain("default-sketchy");
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

Run: `pnpm --filter @excalidraw-skill-pack/mcp-server test`
Expected: FAIL (stub returns `{stub: true}`).

- [ ] **Step 3: Implement real `list-themes.ts`**

Replace the stub:

```typescript
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type { ToolDefinition } from "../server.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Core's bundled themes dir. Resolved relative to the running mcp-server package.
async function resolveBundledThemesDir(): Promise<string> {
  const corePkgUrl = await import.meta.resolve(
    "@excalidraw-skill-pack/core/package.json"
  );
  const coreDir = dirname(fileURLToPath(corePkgUrl));
  return join(coreDir, "themes");
}

async function listInstalledThemes(): Promise<
  Array<{ name: string; version: string; description?: string; preview?: string; source: string }>
> {
  const bundledDir = await resolveBundledThemesDir();
  const entries = await readdir(bundledDir, { withFileTypes: true }).catch(() => []);
  const results: Array<{
    name: string;
    version: string;
    description?: string;
    preview?: string;
    source: string;
  }> = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      const manifest = JSON.parse(
        await readFile(join(bundledDir, entry.name, "theme.json"), "utf-8")
      ) as { name: string; version: string; description?: string; preview?: string };
      results.push({ ...manifest, source: "bundled" });
    } catch {
      // skip non-theme dirs
    }
  }
  return results;
}

export const listThemesTool: ToolDefinition = {
  name: "list_themes",
  description: "List all installed themes with their metadata and preview URLs.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const themes = await listInstalledThemes();
    return { themes };
  }
};
```

- [ ] **Step 4: Run tests, verify PASS**

```bash
pnpm --filter @excalidraw-skill-pack/core build && pnpm --filter @excalidraw-skill-pack/mcp-server build && pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: 3 tests PASS (2 server + 1 list-themes).

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/tools/list-themes.ts packages/mcp-server/tests/tool-list-themes.test.ts
git commit -m "feat(mcp-server): implement list_themes tool"
```

---

### Task 35: Implement `generate_diagram_prompt` tool — failing test first

**Files:**
- Create: `packages/mcp-server/tests/tool-generate-diagram-prompt.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
    const result = (await generateDiagramPromptTool.handler({})) as {
      theme: string;
    };
    expect(result.theme).toBe("default-sketchy");
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

```bash
pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: FAIL.

- [ ] **Step 3: Implement real `generate-diagram-prompt.ts`**

```typescript
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadTheme } from "@excalidraw-skill-pack/core";
import type { ToolDefinition } from "../server.js";

async function resolveCoreDir(): Promise<string> {
  const corePkgUrl = await import.meta.resolve(
    "@excalidraw-skill-pack/core/package.json"
  );
  return dirname(fileURLToPath(corePkgUrl));
}

export const generateDiagramPromptTool: ToolDefinition = {
  name: "generate_diagram_prompt",
  description:
    "Returns the SKILL.md methodology + active theme palette + selected layout template as a structured prompt payload. Does not call an LLM.",
  inputSchema: {
    type: "object",
    properties: {
      theme: { type: "string", description: "Theme name (default: default-sketchy)" },
      style_template: {
        type: "string",
        enum: [
          "chapter-card",
          "flow-pipeline",
          "concept-card",
          "layered-stack",
          "relationship-map",
          "inline-figure"
        ],
        description: "Layout template to splice in"
      },
      intent: { type: "string", description: "Free-text intent the agent passes through" }
    }
  },
  handler: async (args: unknown) => {
    const {
      theme = "default-sketchy",
      style_template,
      intent = ""
    } = (args as {
      theme?: string;
      style_template?: string;
      intent?: string;
    }) ?? {};

    const coreDir = await resolveCoreDir();
    const skill = await readFile(join(coreDir, "SKILL.md"), "utf-8");
    const resolved = await loadTheme(theme, { themesDir: join(coreDir, "themes") });

    const layout =
      style_template && resolved.layouts[style_template]
        ? resolved.layouts[style_template]
        : "";

    return {
      theme,
      intent,
      skill,
      palette_markdown: resolved.paletteMarkdown,
      layout,
      typography: resolved.typography,
      element_defaults: resolved.elements
    };
  }
};
```

- [ ] **Step 4: Build and test**

```bash
pnpm --filter @excalidraw-skill-pack/core build && pnpm --filter @excalidraw-skill-pack/mcp-server build && pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: 5 tests PASS (server 2 + list-themes 1 + generate-diagram-prompt 2).

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/tools/generate-diagram-prompt.ts packages/mcp-server/tests/tool-generate-diagram-prompt.test.ts
git commit -m "feat(mcp-server): implement generate_diagram_prompt tool"
```

---

### Task 36: Implement `render_diagram` tool — failing test first

**Files:**
- Create: `packages/mcp-server/tests/tool-render-diagram.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { renderDiagramTool } from "../src/tools/render-diagram.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(
  __dirname,
  "..",
  "..",
  "shared",
  "fixtures",
  "05-inline-figure.excalidraw"
);

describe("render_diagram", () => {
  it("renders JSON to base64 PNG", async () => {
    const json = await readFile(FIXTURE, "utf-8");
    const result = (await renderDiagramTool.handler({
      json,
      theme: "default-sketchy",
      scale: 1,
      width: 800
    })) as { png_base64: string; width: number; height: number };
    expect(result.png_base64.length).toBeGreaterThan(1000);
    expect(result.width).toBeGreaterThan(100);
    expect(result.height).toBeGreaterThan(100);
  }, 60_000);
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement real `render-diagram.ts`**

```typescript
import { renderToPng } from "excalidraw-render";
import { PNG } from "pngjs";
import type { ToolDefinition } from "../server.js";

export const renderDiagramTool: ToolDefinition = {
  name: "render_diagram",
  description: "Render Excalidraw JSON to PNG. Returns base64 + dimensions.",
  inputSchema: {
    type: "object",
    required: ["json"],
    properties: {
      json: { type: "string", description: "Excalidraw JSON string" },
      theme: { type: "string" },
      scale: { type: "integer" },
      width: { type: "integer" }
    }
  },
  handler: async (args: unknown) => {
    const {
      json,
      theme = "default-sketchy",
      scale = 2,
      width = 1920
    } = (args as { json: string; theme?: string; scale?: number; width?: number }) ?? {};
    if (typeof json !== "string") {
      throw new Error("render_diagram: `json` must be a string");
    }
    const png = await renderToPng(json, { theme, scale, width });
    const parsed = PNG.sync.read(png);
    return {
      png_base64: png.toString("base64"),
      width: parsed.width,
      height: parsed.height
    };
  }
};
```

> Note for the implementer: `mcp-server` depends on `excalidraw-render` via `workspace:*`. Add `pngjs` to mcp-server `package.json` if not already present.

- [ ] **Step 4: Add pngjs dep**

```bash
pnpm --filter @excalidraw-skill-pack/mcp-server add pngjs
pnpm --filter @excalidraw-skill-pack/mcp-server add -D @types/pngjs
```

- [ ] **Step 5: Build and test**

```bash
pnpm --filter excalidraw-render build && pnpm --filter @excalidraw-skill-pack/mcp-server build && pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: 6 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/mcp-server/src/tools/render-diagram.ts packages/mcp-server/tests/tool-render-diagram.test.ts packages/mcp-server/package.json pnpm-lock.yaml
git commit -m "feat(mcp-server): implement render_diagram tool"
```

---

### Task 37: Implement `audit_diagram` tool — failing test first

**Files:**
- Create: `packages/mcp-server/tests/tool-audit-diagram.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
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
      elements: [
        { type: "rectangle", x: 0, y: 0, width: 100, height: 100, strokeColor: "#1e1e1e" }
      ]
    });
    const result = (await auditDiagramTool.handler({ json })) as { issues: unknown[] };
    expect(result.issues).toEqual([]);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement real `audit-diagram.ts`**

```typescript
import type { ToolDefinition } from "../server.js";

interface Issue {
  severity: "error" | "warning" | "info";
  message: string;
  path?: string;
}

function auditExcalidraw(payload: unknown): Issue[] {
  const issues: Issue[] = [];
  if (!payload || typeof payload !== "object") {
    issues.push({ severity: "error", message: "payload is not an object" });
    return issues;
  }
  const p = payload as Record<string, unknown>;
  if (p.type !== "excalidraw") {
    issues.push({
      severity: "error",
      message: `expected type="excalidraw", got ${JSON.stringify(p.type)}`,
      path: "/type"
    });
  }
  if (!Array.isArray(p.elements)) {
    issues.push({ severity: "error", message: "missing elements[] array", path: "/elements" });
  } else {
    if (p.elements.length === 0) {
      issues.push({
        severity: "warning",
        message: "elements[] is empty — nothing to render",
        path: "/elements"
      });
    }
    p.elements.forEach((el, i) => {
      if (!el || typeof el !== "object") {
        issues.push({
          severity: "error",
          message: `element[${i}] is not an object`,
          path: `/elements/${i}`
        });
        return;
      }
      const e = el as Record<string, unknown>;
      if (typeof e.type !== "string") {
        issues.push({
          severity: "error",
          message: `element[${i}] missing type`,
          path: `/elements/${i}/type`
        });
      }
    });
  }
  return issues;
}

export const auditDiagramTool: ToolDefinition = {
  name: "audit_diagram",
  description:
    "Validate an Excalidraw JSON against schema + design rules. Returns severity-tagged issues.",
  inputSchema: {
    type: "object",
    required: ["json"],
    properties: {
      json: { type: "string" },
      theme: { type: "string" }
    }
  },
  handler: async (args: unknown) => {
    const { json } = (args as { json: string }) ?? {};
    if (typeof json !== "string") {
      return { issues: [{ severity: "error", message: "`json` must be a string" }] };
    }
    let payload: unknown;
    try {
      payload = JSON.parse(json);
    } catch (e) {
      return {
        issues: [
          { severity: "error", message: `JSON parse error: ${(e as Error).message}` }
        ]
      };
    }
    return { issues: auditExcalidraw(payload) };
  }
};
```

- [ ] **Step 4: Run, verify PASS**

```bash
pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/tools/audit-diagram.ts packages/mcp-server/tests/tool-audit-diagram.test.ts
git commit -m "feat(mcp-server): implement audit_diagram tool"
```

---

### Task 38: Implement `apply_theme` tool — failing test first

**Files:**
- Create: `packages/mcp-server/tests/tool-apply-theme.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, it, expect } from "vitest";
import { applyThemeTool } from "../src/tools/apply-theme.js";

const ORIGINAL = JSON.stringify({
  type: "excalidraw",
  version: 2,
  source: "test",
  elements: [
    {
      type: "rectangle",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      strokeColor: "#1e1e1e",
      backgroundColor: "#ffffff"
    }
  ]
});

describe("apply_theme", () => {
  it("returns transformed JSON with target theme's palette", async () => {
    const result = (await applyThemeTool.handler({
      json: ORIGINAL,
      target_theme: "default-sketchy"
    })) as { json: string; mapping: Record<string, string> };
    const transformed = JSON.parse(result.json);
    expect(transformed.type).toBe("excalidraw");
    expect(transformed.elements.length).toBe(1);
    expect(typeof result.mapping).toBe("object");
  });

  it("throws on unknown target_theme", async () => {
    await expect(
      applyThemeTool.handler({ json: ORIGINAL, target_theme: "nope" })
    ).rejects.toThrow(/not found/i);
  });
});
```

- [ ] **Step 2: Run, verify FAIL**

- [ ] **Step 3: Implement real `apply-theme.ts`**

```typescript
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { loadTheme } from "@excalidraw-skill-pack/core";
import { renderToPng } from "excalidraw-render";
import { PNG } from "pngjs";
import type { ToolDefinition } from "../server.js";

async function resolveCoreThemesDir(): Promise<string> {
  const corePkgUrl = await import.meta.resolve(
    "@excalidraw-skill-pack/core/package.json"
  );
  return join(dirname(fileURLToPath(corePkgUrl)), "themes");
}

/**
 * Best-effort color swap: for each element, replace `strokeColor` and
 * `backgroundColor` with the equivalent role color from the target theme.
 * Mapping is by exact match against any role color in the *source theme*'s
 * palette; when no match, leave the value untouched.
 */
async function reskin(
  payload: { elements: Array<Record<string, unknown>> },
  targetTheme: string,
  themesDir: string
): Promise<{ json: object; mapping: Record<string, string> }> {
  const target = await loadTheme(targetTheme, { themesDir });
  // Map: source-default-sketchy-role -> target-role color.
  const source = await loadTheme("default-sketchy", { themesDir });
  const mapping: Record<string, string> = {};
  for (const [role, srcColor] of Object.entries(source.palette)) {
    if (typeof srcColor !== "string") continue;
    const targetColor = (target.palette as Record<string, unknown>)[role];
    if (typeof targetColor === "string") {
      mapping[srcColor] = targetColor;
    }
  }
  const swap = (c: unknown): unknown =>
    typeof c === "string" && mapping[c] ? mapping[c] : c;
  const transformedElements = payload.elements.map((el) => ({
    ...el,
    strokeColor: swap(el.strokeColor),
    backgroundColor: swap(el.backgroundColor)
  }));
  return {
    json: { ...payload, elements: transformedElements },
    mapping
  };
}

export const applyThemeTool: ToolDefinition = {
  name: "apply_theme",
  description:
    "Re-skin an existing Excalidraw JSON to a different theme. Swaps stroke/background colors per the target theme's roles; optionally re-renders.",
  inputSchema: {
    type: "object",
    required: ["json", "target_theme"],
    properties: {
      json: { type: "string" },
      target_theme: { type: "string" },
      render: { type: "boolean", description: "Re-render to PNG and include in response" }
    }
  },
  handler: async (args: unknown) => {
    const { json, target_theme, render = false } = (args as {
      json: string;
      target_theme: string;
      render?: boolean;
    }) ?? {};
    if (typeof json !== "string") throw new Error("apply_theme: `json` must be a string");
    if (typeof target_theme !== "string") throw new Error("apply_theme: `target_theme` required");

    const payload = JSON.parse(json) as { elements: Array<Record<string, unknown>> };
    const themesDir = await resolveCoreThemesDir();
    const { json: transformed, mapping } = await reskin(payload, target_theme, themesDir);

    const response: {
      json: string;
      mapping: Record<string, string>;
      png_base64?: string;
      width?: number;
      height?: number;
    } = { json: JSON.stringify(transformed), mapping };

    if (render) {
      const png = await renderToPng(response.json, { theme: target_theme });
      const parsed = PNG.sync.read(png);
      response.png_base64 = png.toString("base64");
      response.width = parsed.width;
      response.height = parsed.height;
    }
    return response;
  }
};
```

- [ ] **Step 4: Run, verify PASS**

```bash
pnpm --filter @excalidraw-skill-pack/mcp-server test
```
Expected: 11 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/mcp-server/src/tools/apply-theme.ts packages/mcp-server/tests/tool-apply-theme.test.ts
git commit -m "feat(mcp-server): implement apply_theme tool with role-based color swap"
```

---

# Milestone 9 — Release Pipeline Alpha

### Task 39: Add changeset for v0.1.0-alpha

**Files:**
- Create: `.changeset/initial-release.md`

- [ ] **Step 1: Write the changeset**

```markdown
---
"@excalidraw-skill-pack/core": minor
"excalidraw-render": minor
"@excalidraw-skill-pack/mcp-server": minor
---

Initial alpha release: core methodology, dual-language renderer (npm + PyPI), MCP server with 5 tools, default-sketchy theme bundled in core.
```

- [ ] **Step 2: Commit**

```bash
git add .changeset/initial-release.md
git commit -m "chore: add changeset for v0.1.0-alpha"
```

---

### Task 40: Version sync script for renderer + mcp-server

**Files:**
- Create: `tools/sync-versions.ts`

- [ ] **Step 1: Write the script**

```typescript
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = join(__dirname, "..");

interface Pkg {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
}

async function readPkg(p: string): Promise<Pkg> {
  return JSON.parse(await readFile(p, "utf-8")) as Pkg;
}

async function main(): Promise<void> {
  const rendererPath = join(REPO, "packages", "renderer-node", "package.json");
  const mcpPath = join(REPO, "packages", "mcp-server", "package.json");
  const renderer = await readPkg(rendererPath);
  const mcp = await readPkg(mcpPath);
  if (renderer.version !== mcp.version) {
    console.warn(
      `Lockstep mismatch: renderer-node@${renderer.version} vs mcp-server@${mcp.version}`
    );
    console.warn(`Bumping mcp-server to ${renderer.version}.`);
    mcp.version = renderer.version;
    await writeFile(mcpPath, JSON.stringify(mcp, null, 2) + "\n");
  } else {
    console.log(`Already in sync at ${renderer.version}.`);
  }
}

main().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Add `tools` to root scripts**

In root `package.json`, append to scripts:

```json
"sync-versions": "tsx tools/sync-versions.ts"
```

And add `tsx` as a devDep:

```bash
pnpm add -wD tsx
```

- [ ] **Step 3: Run to verify (should print "already in sync" with both at 0.0.0)**

```bash
pnpm sync-versions
```

Expected: `Already in sync at 0.0.0.`

- [ ] **Step 4: Commit**

```bash
git add tools/sync-versions.ts package.json pnpm-lock.yaml
git commit -m "chore: add version sync script for renderer + mcp-server"
```

---

### Task 41: Test the changesets dry-run

- [ ] **Step 1: Run changesets version**

```bash
pnpm version
```
Expected: changesets bumps `core`, `excalidraw-render`, and `mcp-server` to 0.1.0; creates CHANGELOG entries; removes the `.changeset/initial-release.md` file.

- [ ] **Step 2: Verify CHANGELOG.md files**

Check `packages/core/CHANGELOG.md`, `packages/renderer-node/CHANGELOG.md`, `packages/mcp-server/CHANGELOG.md` — each should have a `## 0.1.0` entry.

- [ ] **Step 3: Verify version sync**

```bash
pnpm sync-versions
```
Expected: confirms 0.1.0 across renderer + mcp.

- [ ] **Step 4: Reset (we don't actually want to ship from a plan)**

```bash
git restore packages/
git restore .changeset/
```

- [ ] **Step 5: Recreate the changeset for the actual release**

```bash
mkdir -p .changeset
cat > .changeset/initial-release.md <<'EOF'
---
"@excalidraw-skill-pack/core": minor
"excalidraw-render": minor
"@excalidraw-skill-pack/mcp-server": minor
---

Initial alpha release: core methodology, dual-language renderer (npm + PyPI), MCP server with 5 tools, default-sketchy theme bundled in core.
EOF
git add .changeset/initial-release.md
git commit -m "chore: restore changeset for v0.1.0 release"
```

---

### Task 42: Full pipeline smoke test

- [ ] **Step 1: Run full build**

```bash
pnpm build
```
Expected: every package builds without errors. Dist artifacts in each package.

- [ ] **Step 2: Run full test suite**

```bash
pnpm test
```
Expected: All tests PASS across core, renderer-node, mcp-server. Python tests run separately (`cd packages/renderer-python && uv run pytest`).

- [ ] **Step 3: Run lint + typecheck**

```bash
pnpm lint
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 4: Run Python checks**

```bash
cd packages/renderer-python
uv run ruff check .
uv run pytest
cd ../..
```
Expected: ruff clean, pytest 8 tests PASS (theme: 2, render: 1, cli: 1, canary: 5; subtract overlap).

- [ ] **Step 5: Commit nothing — this is a verification step. If anything fails, fix it before moving on.**

---

# Final Verification

- [ ] All 42 tasks marked complete.
- [ ] `git log --oneline` shows ~40 commits with conventional prefixes.
- [ ] `pnpm build && pnpm test` is green.
- [ ] `cd packages/renderer-python && uv run pytest` is green.
- [ ] All 5 MCP tools have ≥1 test and pass.
- [ ] Renderer parity test (Node vs Python) passes at 5% tolerance.
- [ ] Canary regression (5 diagrams) passes at 2% tolerance on both bindings.
- [ ] `.changeset/initial-release.md` queued for first publish.
- [ ] Repo is releasable: `pnpm version && pnpm release` would publish 3 packages to npm.
- [ ] PyPI publish is wired (will trigger on `excalidraw-render@0.1.0` tag push).

---

## Self-Review Notes

**Spec coverage:**
- Section 1 (architecture/repo layout) → Tasks 1-3 (skeleton) + Tasks 4-9 (CI) + Tasks 10-18 (core)
- Section 2 (themes) → Tasks 15-17 (default-sketchy bundled in core). Other 4 themes ship in Plan B.
- Section 3 (renderer + MCP server) → Tasks 19-31 (renderers) + Tasks 32-38 (MCP server)
- Section 4 (CI/release) → Tasks 4-9 (CI scaffolding) + Tasks 39-41 (changesets, version sync, dry-run)
- Section 5 (docs + launch) → deferred to Plan C
- Adapters (5) → deferred to Plan B
- Other 4 themes (stripe-press, notion, whiteboard, dark) + create-excalidraw-theme scaffolder → deferred to Plan B

**Placeholder scan:** no "TBD" or "implement later" markers in code. Two implementer notes flagged (HTML template API contract, package linking) — these are explanation, not placeholders.

**Type consistency:** `ResolvedTheme`/`Theme`/`Palette` names match between TS (`packages/core/src/theme-loader.ts`) and Python (`packages/renderer-python/src/excalidraw_render/theme.py`). MCP tool names (`generate_diagram_prompt`, `render_diagram`, `audit_diagram`, `list_themes`, `apply_theme`) match the spec.

**Scope check:** 42 tasks across 9 milestones. Each milestone produces a verifiable checkpoint (lint/test green). Average task size: 5-7 steps × 2-3 minutes = ~15 minutes. Whole plan ≈ 10-12 hours of focused work for a familiar engineer.
