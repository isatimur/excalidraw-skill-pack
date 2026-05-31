# Plan C — Docs + Launch

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Mintlify docs site at excalidraw-skill-pack.dev, wire up the auto-rebuilding theme registry, port the 64-diagram proof gallery as the examples surface, rewrite the README hero with the theme grid + 1-line installs, draft the launch sequence assets (blog posts, Show HN, Product Hunt, Twitter thread), and submit to external registries. After this plan, the project is launch-ready.

**Architecture:** Mintlify docs in `docs/site/` (separate from `docs/superpowers/` plans), built on push to main and deployed to Vercel/Cloudflare Pages. A nightly GitHub Action scans npm + PyPI for `@excalidraw-skill-pack/theme-*` and `excalidraw-skill-pack-theme-*`, regenerates the theme registry index, and commits back to main. Examples gallery lives in `examples/` with one diagram per theme + the 64 book diagrams; CI pixel-regresses against goldens.

**Tech Stack:** Mintlify (docs), Vercel (hosting), GitHub Actions, Node fetch for registry scanning, npm CLI + uv CLI for verification, Markdown for blog drafts.

**Prerequisite:** Plans A and B complete and merged.

---

## File Structure

```
excalidraw-skill-pack/
├── docs/
│   ├── site/                                    # Mintlify source
│   │   ├── mint.json                            # Mintlify config (nav, theme, colors)
│   │   ├── snippets/                            # reused includes (install commands, theme grid)
│   │   ├── images/
│   │   │   ├── hero-demo.gif                    # 15-second animated demo
│   │   │   ├── theme-grid.png                   # 5 themes side-by-side
│   │   │   └── logo.svg
│   │   ├── introduction.mdx                     # /
│   │   ├── getting-started/
│   │   │   ├── claude-code.mdx
│   │   │   ├── cursor.mdx
│   │   │   ├── codex.mdx
│   │   │   ├── gemini-cli.mdx
│   │   │   └── cli.mdx
│   │   ├── themes/
│   │   │   ├── index.mdx                        # registry — auto-generated nightly
│   │   │   ├── create.mdx                       # 3-min author tutorial
│   │   │   └── _registry.json                   # committed nightly by workflow
│   │   ├── examples/
│   │   │   └── index.mdx                        # 64 + theme grid
│   │   ├── mcp/
│   │   │   └── tool-reference.mdx               # 5-tool API
│   │   └── spec/
│   │       └── theme-manifest.mdx
│   └── ...
├── examples/                                    # 64 book diagrams + 1 representative per theme
│   ├── book/                                    # 64 diagrams from "From Copilot to Colleague"
│   │   ├── 01-book-argument-spine.excalidraw
│   │   ├── 01-book-argument-spine.png
│   │   ├── ...
│   │   └── golden/                              # PNG goldens for regression
│   └── themes/
│       ├── stripe-press.excalidraw
│       ├── notion.excalidraw
│       ├── whiteboard.excalidraw
│       └── dark.excalidraw
├── tools/
│   ├── build-theme-registry.ts                  # nightly: scan npm + PyPI, write _registry.json
│   ├── regenerate-examples.sh                   # re-render all examples + goldens
│   └── build-readme.ts                          # generates README.md from snippets + registry
├── launch/                                      # one-time launch-day assets
│   ├── show-hn.md
│   ├── product-hunt.md
│   ├── twitter-thread.md
│   ├── blog/
│   │   ├── 01-anchor-how-i-made-64-diagrams.md
│   │   ├── 02-claude-code-tutorial.md
│   │   ├── 03-cursor-tutorial.md
│   │   └── 04-comparison-vs-mermaid-vs-diagrams-net.md
│   └── registry-submissions/
│       ├── smithery.md
│       ├── glama.md
│       ├── cline.md
│       ├── cursor-directory.md
│       └── awesome-lists.md
├── .github/
│   ├── workflows/
│   │   ├── deploy-docs.yml                      # deploy to Vercel on push to main
│   │   ├── rebuild-theme-registry.yml           # nightly cron
│   │   └── examples-regression.yml              # PR check
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug.yml
│   │   ├── theme-idea.yml
│   │   ├── feature-request.yml
│   │   └── registry-add.yml
│   └── pull_request_template.md
├── README.md                                    # rewritten hero
└── CONTRIBUTING.md
```

---

# Milestone 1 — Mintlify Docs Site Skeleton

### Task 1: Initialize Mintlify project

**Files:**
- Create: `docs/site/mint.json`
- Create: `docs/site/introduction.mdx`
- Create: `docs/site/snippets/install-commands.mdx`
- Create: `docs/site/snippets/theme-grid.mdx`

- [ ] **Step 1: Write `mint.json`**

```json
{
  "$schema": "https://mintlify.com/schema.json",
  "name": "excalidraw-skill-pack",
  "logo": {
    "light": "/images/logo.svg",
    "dark": "/images/logo.svg",
    "href": "https://excalidraw-skill-pack.dev"
  },
  "favicon": "/images/logo.svg",
  "colors": {
    "primary": "#B8472A",
    "light": "#E47C5F",
    "dark": "#8B3320",
    "background": { "light": "#F4EDE0", "dark": "#18181B" }
  },
  "topbarLinks": [
    { "name": "GitHub", "url": "https://github.com/isatimur/excalidraw-skill-pack" }
  ],
  "topbarCtaButton": {
    "name": "Install",
    "url": "/getting-started/claude-code"
  },
  "navigation": [
    {
      "group": "Get Started",
      "pages": ["introduction"]
    },
    {
      "group": "Install",
      "pages": [
        "getting-started/claude-code",
        "getting-started/cursor",
        "getting-started/codex",
        "getting-started/gemini-cli",
        "getting-started/cli"
      ]
    },
    {
      "group": "Themes",
      "pages": ["themes/index", "themes/create"]
    },
    {
      "group": "Examples",
      "pages": ["examples/index"]
    },
    {
      "group": "MCP",
      "pages": ["mcp/tool-reference"]
    },
    {
      "group": "Spec",
      "pages": ["spec/theme-manifest"]
    }
  ],
  "footerSocials": {
    "twitter": "https://twitter.com/isatimur",
    "github": "https://github.com/isatimur/excalidraw-skill-pack"
  }
}
```

- [ ] **Step 2: Write `introduction.mdx`**

```mdx
---
title: "Make your AI agent argue visually"
description: "Universal skill pack for Excalidraw diagrams across Claude Code, Cursor, Codex, Gemini CLI, and any MCP-compatible agent."
---

<img src="/images/hero-demo.gif" alt="Demo: prompt to PNG in 5 themes" />

## Install for your agent

import InstallCommands from '/snippets/install-commands.mdx';

<InstallCommands />

## Why this exists

Diagrams are arguments. The shape should BE the meaning. This skill teaches your AI agent to draft Excalidraw JSON that passes the **Isomorphism Test** (would the structure alone communicate the concept?) and includes **evidence artifacts** (real code snippets, actual API names, concrete formats — not placeholder text).

64 diagrams in the book *From Copilot to Colleague* were generated with this methodology. The full gallery lives at [/examples](/examples).

## Bring your own brand

import ThemeGrid from '/snippets/theme-grid.mdx';

<ThemeGrid />

Five themes ship in v0.1. Authoring a new theme is 20 lines of JSON + `npm publish`. See [/themes/create](/themes/create).
```

- [ ] **Step 3: Write `snippets/install-commands.mdx`**

```mdx
<CodeGroup>
```bash Claude Code
npx @excalidraw-skill-pack/install claude-code
```

```bash Cursor
npx @excalidraw-skill-pack/install cursor
```

```bash Codex
npx @excalidraw-skill-pack/install codex
```

```bash Gemini CLI
npx @excalidraw-skill-pack/install gemini-cli
```

```bash Any MCP agent
npx @excalidraw-skill-pack/mcp-server
```

```bash Renderer only (Node)
npx excalidraw-render diagram.excalidraw --theme stripe-press
```

```bash Renderer only (Python)
pipx install excalidraw-render && excalidraw-render diagram.excalidraw --theme stripe-press
```
</CodeGroup>
```

- [ ] **Step 4: Write `snippets/theme-grid.mdx`**

```mdx
<CardGroup cols={5}>
  <Card title="default-sketchy" img="/images/themes/default-sketchy.png">
    The original hand-drawn Excalidraw look. Bundled.
  </Card>
  <Card title="stripe-press" img="/images/themes/stripe-press.png">
    Editorial / book-grade. Proven on 64 diagrams.
  </Card>
  <Card title="notion" img="/images/themes/notion.png">
    Rounded, off-white, soft.
  </Card>
  <Card title="whiteboard" img="/images/themes/whiteboard.png">
    Low-fi, bright, sketchy. For workshops.
  </Card>
  <Card title="dark" img="/images/themes/dark.png">
    Inverted contrast, neutral.
  </Card>
</CardGroup>
```

- [ ] **Step 5: Commit**

```bash
git add docs/site/
git commit -m "docs(site): Mintlify skeleton with hero + nav"
```

---

### Task 2: Write 5 getting-started pages (per adapter)

**Files:**
- Create: `docs/site/getting-started/claude-code.mdx`
- Create: `docs/site/getting-started/cursor.mdx`
- Create: `docs/site/getting-started/codex.mdx`
- Create: `docs/site/getting-started/gemini-cli.mdx`
- Create: `docs/site/getting-started/cli.mdx`

- [ ] **Step 1: Write `claude-code.mdx`**

```mdx
---
title: "Claude Code"
description: "Install excalidraw-skill-pack in Claude Code in one command."
---

## Install

<CodeGroup>
```bash One command
npx @excalidraw-skill-pack/install claude-code
```

```bash Lite (skill only, no MCP)
npx @excalidraw-skill-pack/install claude-code --lite
```
</CodeGroup>

This writes:
- `~/.claude/skills/excalidraw-diagram/SKILL.md` — the methodology
- `~/.claude/skills/excalidraw-diagram/themes/default-sketchy/` — bundled theme
- `~/.claude/mcp.json` — registers `@excalidraw-skill-pack/mcp-server` (full mode only)

Restart Claude Code to load the skill.

## Use

In any conversation, type:

> "Make me a diagram of the post-meeting redaction pipeline. Use the stripe-press theme."

The skill auto-loads, the agent drafts JSON, the MCP server renders to PNG.

## Switch themes

Per project:

```bash
echo '{ "theme": "stripe-press" }' > .excalidraw-skill-pack.json
```

Per call: tell the agent `"...use the notion theme."`

## Uninstall

```bash
rm -rf ~/.claude/skills/excalidraw-diagram
# and remove the excalidraw-skill-pack entry from ~/.claude/mcp.json
```
```

- [ ] **Step 2: Write `cursor.mdx`** (mirror structure: install command, what gets written, use, switch themes, uninstall)

```mdx
---
title: "Cursor"
description: "Install excalidraw-skill-pack in Cursor as a rule + MCP server."
---

## Install

```bash
npx @excalidraw-skill-pack/install cursor
```

Writes `.cursor/rules/excalidraw.mdc` and `.cursor/mcp.json`. The MDC rule auto-activates when editing `.excalidraw` files.

## Use

Open Cursor, ask the agent: "Generate an Excalidraw diagram for our auth flow."

The agent has the methodology in context (via the MDC rule) and can call `render_diagram` via the MCP server to produce PNGs.

## Theme per project

```bash
THEME=stripe-press npx @excalidraw-skill-pack/install cursor
```

(Reinstall to swap themes; the MDC rule embeds the active theme's palette.)
```

- [ ] **Step 3: Write `codex.mdx`** (parallel structure)

```mdx
---
title: "Codex CLI"
description: "Install excalidraw-skill-pack in Codex CLI as a skill + MCP server."
---

## Install

```bash
npx @excalidraw-skill-pack/install codex
```

Writes `~/.codex/skills/excalidraw-diagram/` and registers MCP in `~/.codex/mcp.json`.

## Use

```bash
codex chat "Diagram the order pipeline. Theme: dark."
```

## Uninstall

```bash
rm -rf ~/.codex/skills/excalidraw-diagram
```
```

- [ ] **Step 4: Write `gemini-cli.mdx`** (parallel structure)

```mdx
---
title: "Gemini CLI"
description: "Install excalidraw-skill-pack as a Gemini CLI extension."
---

## Install

```bash
npx @excalidraw-skill-pack/install gemini-cli
```

Writes `~/.gemini/extensions/excalidraw-skill-pack/extension.json`, which Gemini auto-loads on next session.

## Use

```bash
gemini "Sketch the data flow for our event ingest. Use the whiteboard theme."
```

## Uninstall

```bash
rm -rf ~/.gemini/extensions/excalidraw-skill-pack
```
```

- [ ] **Step 5: Write `cli.mdx`** (renderer-only docs)

```mdx
---
title: "Raw CLI / any MCP agent"
description: "Use excalidraw-render directly, or wire the MCP server into your own agent."
---

## Renderer (Node)

```bash
npx excalidraw-render diagram.excalidraw --theme stripe-press --output out.png --scale 2 --width 1920
```

## Renderer (Python)

```bash
pipx install excalidraw-render
playwright install chromium
excalidraw-render diagram.excalidraw --theme stripe-press --output out.png --scale 2
```

Identical CLI surface; identical output bytes (within 1px tolerance).

## MCP server

```bash
npx @excalidraw-skill-pack/mcp-server
```

Transport: stdio. Tools: `generate_diagram_prompt`, `render_diagram`, `audit_diagram`, `list_themes`, `apply_theme`.

## Claude Desktop

Add to `claude_desktop_config.json`:

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

- [ ] **Step 6: Commit**

```bash
git add docs/site/getting-started/
git commit -m "docs(site): 5 per-adapter getting-started pages"
```

---

# Milestone 2 — Theme Registry Auto-Build

### Task 3: Implement `build-theme-registry.ts`

**Files:**
- Create: `tools/build-theme-registry.ts`

- [ ] **Step 1: Write the script**

```typescript
import { writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "..", "docs", "site", "themes", "_registry.json");

interface NpmRegistryEntry {
  package: { name: string; version: string; description?: string; links?: { homepage?: string } };
}

interface NpmSearchResponse {
  objects?: NpmRegistryEntry[];
}

interface PyPIProject {
  name: string;
  summary?: string;
  version?: string;
}

interface PyPISearchResponse {
  projects?: PyPIProject[];
}

interface ThemeEntry {
  name: string;
  npm?: { name: string; version: string };
  pypi?: { name: string; version: string };
  description?: string;
  homepage?: string;
  source: "monorepo" | "community";
}

async function fetchNpm(): Promise<ThemeEntry[]> {
  const r = await fetch(
    "https://registry.npmjs.org/-/v1/search?text=scope:excalidraw-skill-pack&size=250"
  );
  const data = (await r.json()) as NpmSearchResponse;
  return (data.objects ?? [])
    .filter((e) => e.package.name.startsWith("@excalidraw-skill-pack/theme-"))
    .map((e) => ({
      name: e.package.name.replace("@excalidraw-skill-pack/theme-", ""),
      npm: { name: e.package.name, version: e.package.version },
      description: e.package.description,
      homepage: e.package.links?.homepage,
      source: "community" as const
    }));
}

async function fetchPyPI(): Promise<ThemeEntry[]> {
  // PyPI does not have a JSON search API; we use the simple HTML index.
  const r = await fetch("https://pypi.org/simple/");
  const html = await r.text();
  const pattern = /href="\/simple\/(excalidraw-skill-pack-theme-[a-z0-9-]+)\//g;
  const seen = new Set<string>();
  const results: ThemeEntry[] = [];
  for (const m of html.matchAll(pattern)) {
    const pkgName = m[1];
    if (!pkgName || seen.has(pkgName)) continue;
    seen.add(pkgName);
    const detail = (await (
      await fetch(`https://pypi.org/pypi/${pkgName}/json`)
    ).json()) as { info?: { name: string; version: string; summary?: string } };
    if (detail.info) {
      results.push({
        name: pkgName.replace("excalidraw-skill-pack-theme-", ""),
        pypi: { name: detail.info.name, version: detail.info.version },
        description: detail.info.summary,
        source: "community" as const
      });
    }
  }
  return results;
}

function merge(npm: ThemeEntry[], pypi: ThemeEntry[]): ThemeEntry[] {
  const map = new Map<string, ThemeEntry>();
  for (const e of npm) map.set(e.name, e);
  for (const e of pypi) {
    const existing = map.get(e.name);
    if (existing) {
      existing.pypi = e.pypi;
    } else {
      map.set(e.name, e);
    }
  }
  // Mark monorepo-published themes
  const monorepo = new Set(["stripe-press", "notion", "whiteboard", "dark"]);
  for (const e of map.values()) {
    if (monorepo.has(e.name)) e.source = "monorepo";
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

async function main(): Promise<void> {
  console.log("Scanning npm...");
  const npm = await fetchNpm();
  console.log(`Found ${npm.length} npm themes`);
  console.log("Scanning PyPI...");
  const pypi = await fetchPyPI();
  console.log(`Found ${pypi.length} PyPI themes`);
  const merged = merge(npm, pypi);
  console.log(`Merged: ${merged.length} unique themes`);
  await writeFile(OUTPUT, JSON.stringify({ updated: new Date().toISOString(), themes: merged }, null, 2));
  console.log(`Wrote ${OUTPUT}`);
}

main().catch((e: Error) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 2: Run locally to verify**

```bash
pnpm tsx tools/build-theme-registry.ts
cat docs/site/themes/_registry.json | head
```
Expected: `{ "updated": "...", "themes": [...] }` with at least the 4 monorepo themes (after they publish).

- [ ] **Step 3: Commit**

```bash
git add tools/build-theme-registry.ts
git commit -m "feat(tools): build-theme-registry scans npm + PyPI"
```

---

### Task 4: Theme registry page (consumes `_registry.json`)

**Files:**
- Create: `docs/site/themes/index.mdx`
- Create: `docs/site/themes/create.mdx`

- [ ] **Step 1: Write `themes/index.mdx`**

```mdx
---
title: "Themes registry"
description: "Every published excalidraw-skill-pack theme. Rebuilt nightly from npm + PyPI."
---

import registry from "./_registry.json";

<Note>Last updated: {registry.updated}</Note>

## Bundled

- **default-sketchy** — ships inside `@excalidraw-skill-pack/core`. Always available.

## Curated (monorepo-published)

<CardGroup cols={2}>
  {registry.themes.filter(t => t.source === "monorepo").map((t) => (
    <Card key={t.name} title={t.name} href={`https://www.npmjs.com/package/${t.npm?.name}`}>
      {t.description}
      <br />
      <code>npm i -g {t.npm?.name}</code>
    </Card>
  ))}
</CardGroup>

## Community

<CardGroup cols={2}>
  {registry.themes.filter(t => t.source === "community").map((t) => (
    <Card key={t.name} title={t.name} href={`https://www.npmjs.com/package/${t.npm?.name}`}>
      {t.description ?? "—"}
      <br />
      {t.npm && <code>npm i -g {t.npm.name}</code>}
      {t.pypi && <><br /><code>pip install {t.pypi.name}</code></>}
    </Card>
  ))}
</CardGroup>

[Author your own →](/themes/create)
```

- [ ] **Step 2: Write `themes/create.mdx`** (3-minute author tutorial)

```mdx
---
title: "Create a theme"
description: "Author + publish a custom theme in 3 minutes."
---

## 1. Scaffold

```bash
npx create-excalidraw-theme my-brand \
  --description "Brand theme for ACME Co." \
  --author "Jane Doe"
cd theme-my-brand
```

## 2. Edit your palette

`palette.json` (machine-readable, used by the renderer):

```json
{
  "ink": "#1a1a1a",
  "paper": "#fff8f3",
  "accent": "#ff5722",
  ...
}
```

`palette.md` (read by the AI agent's system prompt — explain *when* to use each color):

```markdown
| Role | Hex | Use for |
|---|---|---|
| `accent` | `#ff5722` | One per diagram. The argument. |
```

## 3. Optionally override typography, elements, layouts

Drop files in `elements/box.json`, `layouts/chapter-card.md`, etc. Anything you don't override is inherited from `default-sketchy`.

## 4. Validate

```bash
npx validate-theme theme.json
```

Expected: `OK: theme.json`.

## 5. Render a preview

```bash
npx excalidraw-render \
  ../../packages/shared/fixtures/03-concept-card.excalidraw \
  --theme my-brand --output preview.png
```

## 6. Publish (npm)

```bash
npm publish --access public
```

## 7. Publish (PyPI mirror)

```bash
cd src/excalidraw_skill_pack_theme_my_brand
uv build
uv publish
```

## 8. Show up in the registry

Within 24 hours, the [/themes registry](/themes) auto-discovers your package via nightly scan. To get a curated listing, [open a registry-add PR](https://github.com/isatimur/excalidraw-skill-pack/issues/new?template=registry-add.yml).
```

- [ ] **Step 3: Commit**

```bash
git add docs/site/themes/
git commit -m "docs(site): themes registry page + 3-min author tutorial"
```

---

### Task 5: Nightly workflow to rebuild registry

**Files:**
- Create: `.github/workflows/rebuild-theme-registry.yml`

- [ ] **Step 1: Write the workflow**

```yaml
name: Rebuild theme registry

on:
  schedule:
    - cron: "0 9 * * *"   # 09:00 UTC daily
  workflow_dispatch:

jobs:
  rebuild:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
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
      - run: pnpm tsx tools/build-theme-registry.ts
      - name: Open PR on change
        uses: peter-evans/create-pull-request@v6
        with:
          title: "chore: nightly theme registry rebuild"
          commit-message: "chore: rebuild theme registry"
          branch: bot/theme-registry-update
          delete-branch: true
          add-paths: docs/site/themes/_registry.json
          body: |
            Auto-generated by the nightly theme registry rebuild workflow.

            Scanned npm + PyPI for `@excalidraw-skill-pack/theme-*` and `excalidraw-skill-pack-theme-*` packages.
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/rebuild-theme-registry.yml
git commit -m "ci: nightly theme registry rebuild + PR-on-change"
```

---

# Milestone 3 — Examples Gallery (64 Book Diagrams)

### Task 6: Port the 64 book diagrams

**Files:**
- Create: `examples/book/*.excalidraw` (64 files)
- Create: `examples/book/*.png` (64 files)

- [ ] **Step 1: Copy from the book repo**

```bash
mkdir -p examples/book
cp ~/Dev/LifeOS/knowledge-bases/ai-engineer-book/diagrams/*.excalidraw examples/book/
cp ~/Dev/LifeOS/knowledge-bases/ai-engineer-book/diagrams/*.png examples/book/
```

- [ ] **Step 2: Verify count**

```bash
ls examples/book/*.excalidraw | wc -l
ls examples/book/*.png | wc -l
```
Expected: 64 each (or whatever the canonical book count is — confirm against the source).

- [ ] **Step 3: Commit**

```bash
git add examples/book/
git commit -m "examples: port 64 diagrams from book"
```

---

### Task 7: Generate goldens for examples regression

**Files:**
- Create: `examples/book/golden/*.png` (64 files, scale=1 reference renders)

- [ ] **Step 1: Re-render all 64 with current Node renderer**

```bash
mkdir -p examples/book/golden
for f in examples/book/*.excalidraw; do
  name=$(basename "$f" .excalidraw)
  node packages/renderer-node/dist/cli.js "$f" \
    --theme default-sketchy --output "examples/book/golden/${name}.png" \
    --scale 1 --width 1200
done
```

- [ ] **Step 2: Commit**

```bash
git add examples/book/golden/
git commit -m "examples: golden PNGs for 64-diagram regression"
```

---

### Task 8: 64-diagram regression test

**Files:**
- Create: `packages/renderer-node/tests/examples-regression.test.ts`

- [ ] **Step 1: Write the test**

```typescript
import { describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { renderToPng } from "../src/render.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOOK = join(__dirname, "..", "..", "..", "examples", "book");
const GOLDENS = join(BOOK, "golden");

async function listFixtures(): Promise<string[]> {
  return (await readdir(BOOK))
    .filter((f) => f.endsWith(".excalidraw"))
    .map((f) => f.replace(".excalidraw", ""));
}

const fixtures = await listFixtures();

describe.concurrent("64-diagram regression", () => {
  it.each(fixtures)("%s within 2% of golden", async (name) => {
    const src = await readFile(join(BOOK, `${name}.excalidraw`), "utf-8");
    const golden = PNG.sync.read(await readFile(join(GOLDENS, `${name}.png`)));
    const actual = PNG.sync.read(await renderToPng(src, { theme: "default-sketchy", scale: 1, width: 1200 }));
    expect(actual.width).toBe(golden.width);
    expect(actual.height).toBe(golden.height);
    const diff = new PNG({ width: golden.width, height: golden.height });
    const mismatched = pixelmatch(actual.data, golden.data, diff.data, golden.width, golden.height, {
      threshold: 0.1
    });
    expect(mismatched / (golden.width * golden.height)).toBeLessThan(0.02);
  }, 120_000);
});
```

- [ ] **Step 2: Run, verify PASS**

```bash
pnpm --filter excalidraw-render test -- examples-regression
```

Expected: 64 cases PASS.

- [ ] **Step 3: Commit**

```bash
git add packages/renderer-node/tests/examples-regression.test.ts
git commit -m "test(renderer-node): 64-diagram regression at 2% tolerance"
```

---

### Task 9: Examples gallery page

**Files:**
- Create: `examples/themes/stripe-press.excalidraw` (and 3 more)
- Create: `docs/site/examples/index.mdx`

- [ ] **Step 1: Pick one representative diagram for each theme; copy to `examples/themes/`**

```bash
mkdir -p examples/themes
cp examples/book/05-chapter1-the-shift.excalidraw examples/themes/stripe-press.excalidraw
cp examples/book/03-scaffolding-stack.excalidraw examples/themes/notion.excalidraw
cp examples/book/02-autoresearch-machine.excalidraw examples/themes/whiteboard.excalidraw
cp examples/book/04-theme-corpus-map.excalidraw examples/themes/dark.excalidraw
```

- [ ] **Step 2: Render each in its target theme**

```bash
for t in stripe-press notion whiteboard dark; do
  node packages/renderer-node/dist/cli.js \
    examples/themes/$t.excalidraw \
    --theme $t --output docs/site/images/themes/$t.png \
    --scale 2 --width 1800
done
```

- [ ] **Step 3: Write `docs/site/examples/index.mdx`**

```mdx
---
title: "Examples"
description: "64 diagrams from the book + one per theme."
---

## One per theme

import ThemeGrid from '/snippets/theme-grid.mdx';

<ThemeGrid />

## The book — 64 diagrams

Generated for *From Copilot to Colleague* (fromcopilottocolleague.com). Source `.excalidraw` files in [`/examples/book`](https://github.com/isatimur/excalidraw-skill-pack/tree/main/examples/book) on GitHub.

<CardGroup cols={3}>
  <Card title="01 — Book argument spine" img="/images/book/01-book-argument-spine.png" />
  <Card title="02 — Autoresearch machine" img="/images/book/02-autoresearch-machine.png" />
  <Card title="03 — Scaffolding stack" img="/images/book/03-scaffolding-stack.png" />
  {/* ... 61 more ... */}
</CardGroup>
```

> **Note for implementer:** the gallery's 64 `<Card>` entries are mechanical. Generate them with a small script (`tools/generate-gallery-mdx.ts`) that reads `examples/book/*.excalidraw` and emits the card list. Run it once and check the result into the doc.

- [ ] **Step 4: Commit**

```bash
git add examples/themes/ docs/site/examples/ docs/site/images/themes/
git commit -m "docs(examples): one-per-theme + 64-card book gallery"
```

---

# Milestone 4 — MCP & Spec Reference Pages

### Task 10: MCP tool reference page

**Files:**
- Create: `docs/site/mcp/tool-reference.mdx`

- [ ] **Step 1: Write the page**

```mdx
---
title: "MCP tool reference"
description: "The 5 tools exposed by @excalidraw-skill-pack/mcp-server."
---

## Connection

Transport: stdio. Spawn with:

```bash
npx @excalidraw-skill-pack/mcp-server
```

## Tools

### `generate_diagram_prompt`

Returns SKILL.md + active theme palette + selected layout as a structured prompt payload. **Does not call an LLM** — the calling agent's model drafts the JSON.

```json
{
  "theme": "stripe-press",
  "style_template": "concept-card",
  "intent": "Show me the post-meeting redaction pipeline"
}
```

**Returns:**

```json
{
  "theme": "stripe-press",
  "intent": "...",
  "skill": "## Diagrams ARGUE...",
  "palette_markdown": "| Role | Hex...",
  "layout": "# concept-card\n\nA single concept rendered...",
  "typography": { ... },
  "element_defaults": { ... }
}
```

### `render_diagram`

Render Excalidraw JSON to PNG.

```json
{
  "json": "{...excalidraw json...}",
  "theme": "stripe-press",
  "scale": 2,
  "width": 1920
}
```

**Returns:**

```json
{ "png_base64": "iVBORw0...", "width": 1920, "height": 1080 }
```

### `audit_diagram`

Validate against schema + design rules. Returns severity-tagged issues.

```json
{ "json": "{...}", "theme": "stripe-press" }
```

**Returns:**

```json
{
  "issues": [
    { "severity": "warning", "message": "elements[] is empty", "path": "/elements" }
  ]
}
```

### `list_themes`

Discover all installed themes (bundled + npm + PyPI).

**Returns:**

```json
{
  "themes": [
    { "name": "default-sketchy", "version": "0.1.0", "source": "bundled" },
    { "name": "stripe-press", "version": "0.1.0", "source": "npm" }
  ]
}
```

### `apply_theme`

Re-skin an existing diagram. Swaps stroke/background colors per the target theme's role table.

```json
{ "json": "{...}", "target_theme": "dark", "render": true }
```

**Returns:**

```json
{
  "json": "{...transformed...}",
  "mapping": { "#1e1e1e": "#E7E5E4", "#ffffff": "#18181B" },
  "png_base64": "iVBORw0..."
}
```
```

- [ ] **Step 2: Commit**

```bash
git add docs/site/mcp/
git commit -m "docs(site): MCP tool reference page"
```

---

### Task 11: Theme manifest spec page

**Files:**
- Create: `docs/site/spec/theme-manifest.mdx`

- [ ] **Step 1: Write the page** (rendered from `packages/core/theme.schema.json`)

```mdx
---
title: "Theme manifest spec"
description: "Reference for theme.json + the surrounding theme package layout."
---

## Files in a theme package

| File | Required | Purpose |
|---|---|---|
| `theme.json` | yes | manifest (name, version, extends, roles) |
| `palette.json` | yes | color tokens — machine-readable, used by renderer |
| `palette.md` | yes | color tokens — agent-readable; explains *when* to use each |
| `typography.json` | no | font family + sizes + italic policy |
| `elements/*.json` | no | per-element-type style overrides (box, callout, arrow) |
| `layouts/*.md` | no | composition presets (chapter-card, flow-pipeline, ...) |
| `preview.png` | recommended | renders nicely in registry + README |

## `theme.json` schema

(Auto-pulled from [`theme.schema.json`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/core/theme.schema.json).)

### Required fields

- `name` — kebab-case string, matches the package suffix
- `version` — semver

### Optional fields

- `extends` — parent theme name; inherits palette, typography, elements, layouts
- `description` — one-sentence pitch
- `preview` — path/URL to preview PNG
- `homepage`, `license`, `author` — usual package fields
- `roles` — semantic color map (see below)

### Roles

The role table is the contract between themes for `apply_theme` (re-skinning). Every theme should define at least the core 4: `ink`, `paper`, `accent`, `muted`.

| Role | Meaning |
|---|---|
| `ink` | Primary text and strokes |
| `paper` | Main background |
| `accent` | The argument color — one per diagram |
| `accent_alt` | Secondary accent for comparisons |
| `evidence_bg` | Evidence artifact background |
| `evidence_text` | Evidence artifact text |
| `muted` | Secondary text, grid, dividers |
| `warning` | Soft warning (rare) |
| `danger` | Hard error (rare) |

Themes that don't define a role fall back to `default-sketchy`'s value during `apply_theme`.

## Inheritance

```json
{ "name": "my-brand", "extends": "default-sketchy" }
```

Resolution at load time merges per layer (`palette`, `typography`, `elements`, `layouts`). The child's value wins for any overlapping key. Element files and layout files override at file granularity (full replacement, not deep-merge).

## Versioning

Per-theme independent semver. Bump rules:

- **PATCH:** typo fix in palette.md, no color change
- **MINOR:** add a role; add a layout file; add an element override
- **MAJOR:** change a role hex code; change typography in a breaking way; remove an inherited layout
```

- [ ] **Step 2: Commit**

```bash
git add docs/site/spec/
git commit -m "docs(site): theme manifest spec page"
```

---

# Milestone 5 — README Hero Rewrite

### Task 12: Generate the hero demo GIF

**Files:**
- Create: `docs/site/images/hero-demo.gif`

- [ ] **Step 1: Record a 15-second screen capture**

This is manual: run a Claude Code session, prompt "Diagram our auth flow in 3 themes back-to-back", record the screen (QuickTime → File → New Screen Recording on macOS), trim to 15s, convert to GIF via ffmpeg:

```bash
ffmpeg -i recording.mov -vf "fps=12,scale=1200:-1:flags=lanczos" -loop 0 docs/site/images/hero-demo.gif
```

- [ ] **Step 2: Commit**

```bash
git add docs/site/images/hero-demo.gif
git commit -m "docs(site): hero demo GIF (15s, multi-theme generation)"
```

---

### Task 13: Rewrite README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace `README.md` content**

```markdown
<p align="center">
  <img src="docs/site/images/hero-demo.gif" alt="Make your AI agent argue visually" width="800" />
</p>

<h1 align="center">excalidraw-skill-pack</h1>

<p align="center">
  Make your AI agent argue visually.<br/>
  Universal skill pack for Excalidraw diagrams across Claude Code, Cursor, Codex, Gemini CLI, and any MCP-compatible agent.
</p>

<p align="center">
  <a href="https://excalidraw-skill-pack.dev"><img src="https://img.shields.io/badge/docs-excalidraw--skill--pack.dev-B8472A" alt="docs" /></a>
  <a href="https://www.npmjs.com/package/excalidraw-render"><img src="https://img.shields.io/npm/v/excalidraw-render?label=excalidraw-render" alt="npm" /></a>
  <a href="https://pypi.org/project/excalidraw-render/"><img src="https://img.shields.io/pypi/v/excalidraw-render?label=PyPI" alt="pypi" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/isatimur/excalidraw-skill-pack" alt="license" /></a>
</p>

## Install

| For | Command |
|---|---|
| Claude Code | `npx @excalidraw-skill-pack/install claude-code` |
| Cursor | `npx @excalidraw-skill-pack/install cursor` |
| Codex | `npx @excalidraw-skill-pack/install codex` |
| Gemini CLI | `npx @excalidraw-skill-pack/install gemini-cli` |
| Any MCP agent | `npx @excalidraw-skill-pack/mcp-server` |
| Renderer only (Node) | `npx excalidraw-render diagram.excalidraw --theme stripe-press` |
| Renderer only (Python) | `pipx install excalidraw-render && excalidraw-render diagram.excalidraw --theme stripe-press` |

## Themes

<p align="center">
  <img src="docs/site/images/themes/default-sketchy.png" width="160" />
  <img src="docs/site/images/themes/stripe-press.png" width="160" />
  <img src="docs/site/images/themes/notion.png" width="160" />
  <img src="docs/site/images/themes/whiteboard.png" width="160" />
  <img src="docs/site/images/themes/dark.png" width="160" />
</p>

Five themes ship in v0.1. Authoring a new theme is 20 lines of JSON + `npm publish`:

```bash
npx create-excalidraw-theme my-brand
cd theme-my-brand && npm publish --access public
```

[Browse the theme registry →](https://excalidraw-skill-pack.dev/themes)

## Proof

64 diagrams in [*From Copilot to Colleague*](https://fromcopilottocolleague.com) were generated with this methodology. [See the gallery →](https://excalidraw-skill-pack.dev/examples)

## Methodology

Diagrams are arguments. The shape should BE the meaning.

- **Isomorphism Test:** would the structure alone communicate the concept?
- **Evidence artifacts:** real code snippets, actual API names, concrete formats — not placeholder text.
- **One accent per diagram.** Two means a competing argument; split it.

Read the [full methodology](https://excalidraw-skill-pack.dev/spec/theme-manifest) (it's also what the AI agent reads).

## License

MIT. Contributions welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs(readme): rewrite hero with theme grid + 1-line installs"
```

---

# Milestone 6 — Docs Site Deploy

### Task 14: Vercel deploy workflow

**Files:**
- Create: `.github/workflows/deploy-docs.yml`
- Create: `docs/site/.vercel/project.json` (manual — set up via `vercel link`)

- [ ] **Step 1: Set up Vercel project**

```bash
cd docs/site
npx vercel link
```

Choose a Vercel team, accept the prompts, point to the `docs/site/` directory. This creates `.vercel/project.json`.

- [ ] **Step 2: Set Vercel secrets in GitHub**

Add `VERCEL_TOKEN` and `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (from `.vercel/project.json`) as repo secrets.

- [ ] **Step 3: Write `deploy-docs.yml`**

```yaml
name: Deploy docs

on:
  push:
    branches: [main]
    paths:
      - "docs/site/**"
      - ".github/workflows/deploy-docs.yml"
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm install --global vercel
      - working-directory: docs/site
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
        run: vercel deploy --prod --yes --token "$VERCEL_TOKEN"
```

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy-docs.yml docs/site/.vercel/project.json
git commit -m "ci: deploy Mintlify docs to Vercel on push to main"
```

---

### Task 15: Buy domain + DNS

This is a manual / out-of-band step that has to happen before deploy.

- [ ] **Step 1: Buy `excalidraw-skill-pack.dev` on Namecheap / Cloudflare**
- [ ] **Step 2: Add it to the Vercel project**
- [ ] **Step 3: Point DNS A/CNAME records to Vercel per their UI**
- [ ] **Step 4: Wait for SSL provisioning (Vercel handles it)**
- [ ] **Step 5: Smoke-test the live site**

```bash
curl -I https://excalidraw-skill-pack.dev
```

Expected: 200 OK with `server: Vercel` header.

> No commit — this is out-of-band infrastructure setup.

---

# Milestone 7 — Launch Assets

### Task 16: Show HN post

**Files:**
- Create: `launch/show-hn.md`

- [ ] **Step 1: Write the post**

```markdown
# Show HN: excalidraw-skill-pack — Make your AI agent argue visually

I've been generating diagrams for my book *From Copilot to Colleague* with a custom Claude Code skill — 64 diagrams over a few weeks, all rendered from JSON, all version-controlled with the rest of the manuscript. The skill teaches Claude the *methodology*: "diagrams argue, they don't display" — isomorphism test, evidence artifacts (real API names, actual JSON, never placeholders), one accent per diagram.

After enough of my friends asked "how did you do that?", I extracted it into a universal skill pack that works in every major AI-agent platform:

- **Claude Code, Cursor, Codex, Gemini CLI** — one-command install per agent
- **Any MCP-compatible agent** — stdio MCP server, 5 tools (generate prompt, render, audit, list themes, apply theme)
- **Renderer-only** — `npx excalidraw-render` or `pipx install excalidraw-render` for CI/batch use

The interesting bit is the **theme ecosystem**: each theme is a standalone npm + PyPI package (`@excalidraw-skill-pack/theme-stripe-press`, etc.), so anyone can publish a custom brand theme without PR-ing the main repo. We ship with 5: `default-sketchy`, `stripe-press` (the book's look), `notion`, `whiteboard`, `dark`. `npx create-excalidraw-theme my-brand` scaffolds a new one in 3 minutes.

There's an `apply_theme` MCP tool that re-skins any existing `.excalidraw` to a different theme via role-based color remapping — useful for "give me the same diagram in our brand palette."

Demo: https://excalidraw-skill-pack.dev (15-second video at the top)
Gallery (64 diagrams): https://excalidraw-skill-pack.dev/examples
Code: https://github.com/isatimur/excalidraw-skill-pack
License: MIT

Happy to answer questions. The biggest design call was "skill returns *methodology*, not generated content" — the MCP server doesn't call an LLM itself; the calling agent's model does the JSON drafting using the methodology + theme spliced in. Keeps it model-agnostic and free for us.
```

- [ ] **Step 2: Commit**

```bash
git add launch/show-hn.md
git commit -m "launch: Show HN draft"
```

---

### Task 17: Product Hunt draft

**Files:**
- Create: `launch/product-hunt.md`

- [ ] **Step 1: Write the listing**

```markdown
# Product Hunt — excalidraw-skill-pack

**Tagline:** Make your AI agent argue visually.

**Description:**

A universal skill pack that teaches Claude / Cursor / Codex / Gemini how to draft Excalidraw diagrams that pass the isomorphism test (the shape IS the meaning). Ships with 5 themes, a renderer in both Node + Python, an MCP server with 5 tools, and a one-command installer per agent. The proof: 64 diagrams in a published book were generated with this methodology.

**First comment (maker comment):**

I'm Timur. I wrote a book about modern AI engineering (*From Copilot to Colleague*) and needed to render dozens of diagrams without manually opening Excalidraw 64 times. I built a Claude Code skill that does it from JSON — but then realized every AI-agent platform deserves the same skill, plus a way for anyone to author their own brand theme. So I extracted the skill, made it polyglot (npm + PyPI), added an MCP server, and split themes into standalone packages.

The interesting design call: the MCP server returns *methodology*, not generated content. Your agent's own model does the drafting. That keeps it model-agnostic (works with Claude, GPT, Gemini equally) and we don't pay for any inference.

Try it: `npx @excalidraw-skill-pack/install claude-code` or `npx @excalidraw-skill-pack/mcp-server`. Tell it what you want diagrammed. Done.

**Galleries / images:**
- Hero demo GIF (15s)
- 5-theme grid
- 4 sample diagrams from the book
```

- [ ] **Step 2: Commit**

```bash
git add launch/product-hunt.md
git commit -m "launch: Product Hunt listing draft"
```

---

### Task 18: Twitter / X launch thread

**Files:**
- Create: `launch/twitter-thread.md`

- [ ] **Step 1: Write the thread**

```markdown
# Twitter / X launch thread (10 tweets)

1/ Shipping excalidraw-skill-pack — make your AI agent argue visually.

One command install for Claude Code, Cursor, Codex, Gemini CLI, or any MCP-compatible agent.

Demo + 64-diagram gallery: https://excalidraw-skill-pack.dev

[hero GIF]

2/ The methodology: "diagrams argue, they don't display."

Every shape carries meaning. Evidence artifacts (real API names, actual JSON) over placeholder text. One accent per diagram, ever.

The agent reads this. So do you.

[methodology snippet image]

3/ Proof: 64 diagrams in my book *From Copilot to Colleague* (https://fromcopilottocolleague.com) were generated with this skill.

The book argument lives in the diagrams. The diagrams live in version control. Same workflow as the manuscript.

[before/after screenshot from the book]

4/ Universal install:
- Claude Code: `npx @excalidraw-skill-pack/install claude-code`
- Cursor: `npx @excalidraw-skill-pack/install cursor`
- Codex: `npx @excalidraw-skill-pack/install codex`
- Gemini: `npx @excalidraw-skill-pack/install gemini-cli`
- Any MCP agent: `npx @excalidraw-skill-pack/mcp-server`

5/ Theme ecosystem: 5 ship today (default-sketchy, stripe-press, notion, whiteboard, dark).

[theme grid image]

Anyone can publish a custom theme:
`npx create-excalidraw-theme my-brand`
`npm publish`

3 minutes from "I want my brand colors" to "shipped on npm."

6/ The MCP server exposes 5 tools:

- generate_diagram_prompt — methodology + theme as a prompt payload
- render_diagram — JSON → PNG
- audit_diagram — schema + design rules
- list_themes — installed themes
- apply_theme — re-skin any diagram to a different theme

7/ The design call I'm most happy with: the server returns *methodology*, not generated content.

Your agent's own model drafts the JSON. We never call an LLM ourselves.

Means: model-agnostic, no API key, no cost to us, no rate limits.

8/ Renderer is dual-language — Node (`npx excalidraw-render`) and Python (`pipx install excalidraw-render`).

Same CLI. Same output. Use whichever fits your CI / scripts.

[CLI screenshot, both languages]

9/ It's open-source (MIT) and lives at https://github.com/isatimur/excalidraw-skill-pack

PRs welcome — especially new themes. The theme spec is 20 lines of JSON.

10/ If you tried it, lmk what you diagrammed. Or DM me your worst diagram and I'll send back what the skill does with it.

(Or just star the repo — that's the bat-signal that this matters.)

🙏
```

- [ ] **Step 2: Commit**

```bash
git add launch/twitter-thread.md
git commit -m "launch: 10-tweet Twitter/X launch thread"
```

---

### Task 19: Anchor blog post

**Files:**
- Create: `launch/blog/01-anchor-how-i-made-64-diagrams.md`

- [ ] **Step 1: Write the anchor post**

```markdown
# How I made 64 diagrams for an AI book with one skill

Last winter I started writing a book about modern AI engineering, *From Copilot to Colleague*. It's 10 chapters about how the engineer's role changes when the editor itself can reason. By chapter 3 I knew I needed a lot of diagrams — flows, layered stacks, relationship maps, evidence artifacts. By chapter 5 I had 30. By the final chapter, 64.

I made all of them with the same Claude Code skill I just open-sourced as `excalidraw-skill-pack`.

## The constraint

I wanted diagrams that **argued**, not diagrams that **labeled boxes**. The difference matters. A labeled-boxes diagram is a list with arrows. An arguing diagram is a position — the shape itself carries the claim.

Rules I held myself to:

- **Isomorphism test:** if you removed all the text, could you still read the structure?
- **Evidence artifacts only:** real API names, actual JSON formats, real event names from the spec. Never "Component A" or "Event 1".
- **One accent per diagram.** Two means there are two competing arguments. Split it.

And I wanted these to be version-controlled with the manuscript — JSON in git, not binary Figma files.

## The skill

The skill is a system prompt + a renderer + a theme. The system prompt teaches the agent the methodology (isomorphism, evidence artifacts, the rules). The renderer runs Excalidraw's library headless in Chromium and exports PNG. The theme defines the colors and the typography.

When I tell Claude "diagram the post-meeting redaction pipeline", three things happen:

1. The agent reads the methodology + my active theme's palette
2. The agent drafts Excalidraw JSON
3. The renderer turns it into a PNG

No back-and-forth. No "regenerate this." No "make it look more like our brand." The brand is in the theme, the methodology is in the prompt, and the agent does the work.

## Why a "skill" and not just a prompt

A prompt is a thing you paste. A skill is a thing that lives — versioned, audited, reusable, distributed across the team. Skills carry methodology durably. Once everyone on the team uses the same skill, every diagram in every doc starts to feel like it's from the same hand.

## What I extracted

The book is the proof artifact. The skill is the public good. What you get with `excalidraw-skill-pack`:

- The full methodology in `SKILL.md` (the same one I used)
- A dual-language renderer (Node + Python)
- An MCP server with 5 tools, so any MCP-compatible agent works
- 5 themes, including `stripe-press` (the book's look)
- A theme scaffolder — write your own brand theme in 20 lines

## Install for your agent

If you use Claude Code:

```bash
npx @excalidraw-skill-pack/install claude-code
```

For Cursor, Codex, Gemini CLI — same pattern, swap the adapter name. For any MCP-compatible agent: `npx @excalidraw-skill-pack/mcp-server`.

## What this is for

If you're writing — a book, a blog, internal docs, a deck — and you want your diagrams to *argue*, this is for you. If you're shipping a product and your team wants the same visual language across every README and every onboarding doc, this is for you.

It's MIT-licensed at https://github.com/isatimur/excalidraw-skill-pack.

If you build a theme, ping me — I'll add it to the curated registry.
```

- [ ] **Step 2: Commit**

```bash
git add launch/blog/01-anchor-how-i-made-64-diagrams.md
git commit -m "launch: anchor blog post — 64 diagrams story"
```

---

### Task 20: 3 per-adapter tutorial posts

**Files:**
- Create: `launch/blog/02-claude-code-tutorial.md`
- Create: `launch/blog/03-cursor-tutorial.md`
- Create: `launch/blog/04-comparison-vs-mermaid-vs-diagrams-net.md`

- [ ] **Step 1: Write `02-claude-code-tutorial.md`**

(2-3 paragraph install + first-diagram walkthrough. Screenshots optional. Schedule: T+7.)

- [ ] **Step 2: Write `03-cursor-tutorial.md`**

(Same shape, Cursor-specific. Schedule: T+14.)

- [ ] **Step 3: Write `04-comparison-vs-mermaid-vs-diagrams-net.md`**

(Comparison: Mermaid = grammar-constrained, diagrams.net = manual editor, excalidraw-skill-pack = AI-driven methodology + open theming. Honest about Mermaid wins for sequence/flow grammar; we win on visual control + theming + AI-native integration. Schedule: T+14.)

For each post, draft 500-800 words; the actual writing happens close to publish date with the real install screenshots.

- [ ] **Step 4: Commit drafts**

```bash
git add launch/blog/
git commit -m "launch: 3 per-adapter tutorials + comparison post (drafts)"
```

---

### Task 21: Registry submission package

**Files:**
- Create: `launch/registry-submissions/smithery.md`
- Create: `launch/registry-submissions/glama.md`
- Create: `launch/registry-submissions/cline.md`
- Create: `launch/registry-submissions/cursor-directory.md`
- Create: `launch/registry-submissions/awesome-lists.md`

- [ ] **Step 1: Each file contains the submission text + the URL**

```markdown
# Smithery submission

**Submit at:** https://smithery.ai/server/submit

**Server name:** excalidraw-skill-pack

**Package:** `@excalidraw-skill-pack/mcp-server`

**Install command:** `npx @excalidraw-skill-pack/mcp-server`

**Transport:** stdio

**Description:**
Make your AI agent argue visually. Generates Excalidraw diagrams with methodology + themes. 5 tools: generate_diagram_prompt, render_diagram, audit_diagram, list_themes, apply_theme. MIT-licensed. 64-diagram proof gallery.

**Tags:** diagrams, excalidraw, visualization, ai-agents, mcp

**Repository:** https://github.com/isatimur/excalidraw-skill-pack

**Homepage:** https://excalidraw-skill-pack.dev
```

(Repeat with the same pattern, swapping in each registry's required fields.)

- [ ] **Step 2: Commit**

```bash
git add launch/registry-submissions/
git commit -m "launch: registry submission packages (smithery, glama, cline, cursor, awesome lists)"
```

---

# Milestone 8 — Community Surface

### Task 22: Issue + PR templates

**Files:**
- Create: `.github/ISSUE_TEMPLATE/bug.yml`
- Create: `.github/ISSUE_TEMPLATE/theme-idea.yml`
- Create: `.github/ISSUE_TEMPLATE/feature-request.yml`
- Create: `.github/ISSUE_TEMPLATE/registry-add.yml`
- Create: `.github/pull_request_template.md`

- [ ] **Step 1: Write `bug.yml`**

```yaml
name: Bug report
description: Something doesn't work
labels: [bug]
body:
  - type: dropdown
    id: adapter
    attributes:
      label: Adapter
      options:
        - Claude Code
        - Cursor
        - Codex
        - Gemini CLI
        - Raw CLI (excalidraw-render)
        - MCP server (other agent)
    validations: { required: true }
  - type: input
    id: version
    attributes: { label: Version, description: "Output of `excalidraw-render --version` or the npm package version" }
    validations: { required: true }
  - type: textarea
    id: repro
    attributes: { label: Reproduction, description: "Steps to reproduce. Include the .excalidraw file if relevant." }
    validations: { required: true }
  - type: textarea
    id: expected
    attributes: { label: Expected behavior }
    validations: { required: true }
  - type: textarea
    id: actual
    attributes: { label: What actually happened, description: "Error output, screenshot, or rendered PNG" }
    validations: { required: true }
```

- [ ] **Step 2: Write `theme-idea.yml`**

```yaml
name: Theme idea
description: Suggest a new theme — for yourself to build or for someone else to pick up
labels: [theme]
body:
  - type: input
    id: name
    attributes: { label: Theme name (kebab-case) }
    validations: { required: true }
  - type: textarea
    id: rationale
    attributes: { label: Why this theme, description: "Who's it for, what existing brand does it match, what mood" }
    validations: { required: true }
  - type: input
    id: palette
    attributes: { label: Rough palette (4-7 hex codes) }
  - type: checkboxes
    attributes:
      label: Are you building it?
      options:
        - label: "Yes, I'll publish it as a community theme"
        - label: "No, I'm suggesting it for someone else"
```

- [ ] **Step 3: Write `feature-request.yml`**

```yaml
name: Feature request
description: Propose a new feature or change
labels: [enhancement]
body:
  - type: textarea
    id: problem
    attributes: { label: Problem, description: "What's painful today" }
    validations: { required: true }
  - type: textarea
    id: proposal
    attributes: { label: Proposed solution }
    validations: { required: true }
  - type: textarea
    id: alternatives
    attributes: { label: Alternatives considered }
```

- [ ] **Step 4: Write `registry-add.yml`** (for themes wanting a curated listing)

```yaml
name: Add theme to curated registry
description: Your community theme is published; you want a curated listing
labels: [registry-add]
body:
  - type: input
    id: package
    attributes: { label: npm package name, description: "@excalidraw-skill-pack/theme-..." }
    validations: { required: true }
  - type: input
    id: pypi
    attributes: { label: PyPI package name (optional), description: "excalidraw-skill-pack-theme-..." }
  - type: input
    id: preview
    attributes: { label: Preview image URL }
    validations: { required: true }
  - type: textarea
    id: pitch
    attributes: { label: One-sentence pitch }
    validations: { required: true }
```

- [ ] **Step 5: Write `pull_request_template.md`**

```markdown
## Summary

<!-- One sentence: what does this change and why -->

## Type

- [ ] bug fix
- [ ] feature
- [ ] new theme
- [ ] docs
- [ ] chore / CI

## Changeset

- [ ] Added `.changeset/<entry>.md` for any npm package changes

## Tests

- [ ] All existing tests pass (`pnpm test`)
- [ ] Added tests for new behavior
- [ ] Updated golden PNGs if renderer output changed (`pnpm --filter excalidraw-render test -- canary`)

## Checklist

- [ ] Linked any related issues
- [ ] Updated docs (if user-visible change)
- [ ] Updated CHANGELOG via changeset
```

- [ ] **Step 6: Commit**

```bash
git add .github/ISSUE_TEMPLATE/ .github/pull_request_template.md
git commit -m "chore: issue + PR templates"
```

---

### Task 23: CONTRIBUTING.md

**Files:**
- Create: `CONTRIBUTING.md`

- [ ] **Step 1: Write the file**

```markdown
# Contributing to excalidraw-skill-pack

Thanks for considering a contribution. This file explains the layout of the repo, how to set up local dev, and how PRs flow.

## Repo layout

See [docs/superpowers/specs/2026-05-28-excalidraw-universal-skill-pack-design.md](docs/superpowers/specs/2026-05-28-excalidraw-universal-skill-pack-design.md) for the full design. Short version:

- `packages/core/` — methodology + bundled default-sketchy theme
- `packages/renderer-{python,node}/` — dual-language renderer
- `packages/mcp-server/` — MCP server with 5 tools
- `packages/themes/<name>/` — monorepo-published themes
- `packages/create-excalidraw-theme/` — scaffolder for new themes
- `packages/install/` — meta-installer per adapter
- `adapters/<name>/` — per-AI-agent install scripts
- `docs/site/` — Mintlify docs

## Local dev

```bash
git clone https://github.com/isatimur/excalidraw-skill-pack.git
cd excalidraw-skill-pack
pnpm install
pnpm build
pnpm exec playwright install chromium
pnpm test
cd packages/renderer-python && uv sync && uv run playwright install chromium && uv run pytest
```

## PR flow

1. Branch from `main`
2. Make your change
3. Add tests
4. Run `pnpm lint && pnpm typecheck && pnpm test` (and Python equivalents if relevant)
5. Add a changeset: `pnpm changeset`
6. Open the PR using the PR template
7. CI runs lint + typecheck + tests + adapter install matrix
8. Maintainer review + merge
9. Changesets bot opens a "Version Packages" PR; merging that publishes affected packages

## Adding a new theme

The easiest path: publish your own theme as a standalone npm package. It will appear in the registry within 24 hours (nightly scan).

To get a curated listing in `/themes`: open a [registry-add issue](.github/ISSUE_TEMPLATE/registry-add.yml).

To contribute the theme to the monorepo (a higher bar — we want curated themes here to be broadly useful): open a PR adding `packages/themes/<name>/`, follow the existing themes' structure, include `preview.png`, add a changeset.

## Adding a new adapter

If you want to add support for a new AI agent (Aider, Continue, etc.):

1. Add `adapters/<adapter-name>/install.{sh,ps1}` following the patterns in existing adapters
2. Add the adapter to `ADAPTERS` in `packages/install/src/index.ts`
3. Add a CI matrix entry in `.github/workflows/adapter-install-matrix.yml`
4. Add `docs/site/getting-started/<adapter-name>.mdx`
5. Add a changeset bumping `@excalidraw-skill-pack/install`

## Code style

- TS: `eslint` + `tsc --strict`
- Python: `ruff check` + `ruff format` + `mypy --strict`

No JSDoc / no docstrings unless explaining *why*. No comments that describe *what* well-named code already shows.

## License

MIT. By contributing, you agree your contributions are MIT-licensed.
```

- [ ] **Step 2: Commit**

```bash
git add CONTRIBUTING.md
git commit -m "docs: CONTRIBUTING.md"
```

---

# Milestone 9 — Final Verification

### Task 24: Pre-launch checklist

- [ ] All Plan A and Plan B tasks complete.
- [ ] `pnpm build && pnpm test` green.
- [ ] `cd packages/renderer-python && uv run pytest` green.
- [ ] 64-diagram regression green.
- [ ] All 4 themes pass `validate-theme`.
- [ ] All 5 adapter install scripts pass in CI matrix.
- [ ] Docs site live at https://excalidraw-skill-pack.dev with valid SSL.
- [ ] All 7 nav pages render correctly (mobile + desktop).
- [ ] Theme registry shows at least the 4 monorepo themes.
- [ ] README hero renders with images on github.com (relative paths resolve).
- [ ] Hero demo GIF plays inline.
- [ ] Issue templates appear on `New Issue` page.
- [ ] PR template appears on new PR page.
- [ ] First v0.1.0 release tagged + published to npm + PyPI.
- [ ] Smithery, Glama, Cline, Cursor Directory, awesome-lists submissions queued.
- [ ] Blog anchor post scheduled on isatimur.com for T+0.
- [ ] Show HN + PH listing drafts approved by 2 readers.
- [ ] Twitter thread scheduled for T+0 09:00 ET.

---

## Self-Review Notes

**Spec coverage:**
- Docs site (Mintlify, getting-started/<5>, themes/, examples/, mcp/, spec/) → Tasks 1-2, 10-11
- Theme registry auto-build → Tasks 3-5
- Examples gallery + 64-diagram regression → Tasks 6-9
- README hero rewrite → Tasks 12-13
- Vercel deploy → Tasks 14-15
- Launch sequence (HN, PH, Twitter, blog, registry submissions) → Tasks 16-21
- Community surface (issue/PR templates, CONTRIBUTING) → Tasks 22-23
- Pre-launch checklist → Task 24

**Placeholder scan:**
- Task 9 step 3 references "61 more" gallery cards — solved by `tools/generate-gallery-mdx.ts` (script is described, not fully written; one-time use, simple to implement).
- Task 12 step 1 is manual screen recording, not codeable — appropriate placeholder.
- Task 15 is out-of-band DNS purchase — appropriate as a non-code step.
- Task 20 step 1-3 are blog *drafts* (writing happens close to publish date with screenshots). Acceptable: the launch content is creative work, not implementable code.

**Type consistency:**
- Theme entry shape consistent between `tools/build-theme-registry.ts` and `docs/site/themes/index.mdx`'s consumption of `_registry.json`.
- Adapter names consistent across `packages/install/src/index.ts`, `adapters/<name>/`, `docs/site/getting-started/<name>.mdx`, and `.github/workflows/adapter-install-matrix.yml`.

**Scope check:** 24 tasks across 9 milestones. End state: docs live, registry auto-rebuilds, examples gallery has 64 + 5 theme demos, README hero polished, all launch assets drafted, community surface ready. Combined with Plans A and B, the project is launch-ready.
