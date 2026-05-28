---
title: excalidraw-skill-pack — Universal Skill Pack for AI Agents
date: 2026-05-28
status: design-approved
owner: isatimur
repo: github.com/isatimur/excalidraw-skill-pack (to be created)
---

# excalidraw-skill-pack — Design Spec

## Goal

Repackage the existing `~/.claude/skills/excalidraw-diagram/` skill — proven on 64 diagrams in the *From Copilot to Colleague* book — as a public, polyglot skill pack that any major AI-agent platform can install in one command, with a composable theme ecosystem published as standalone packages.

The two objectives, in priority order:

1. **Universality:** ship adapters for Claude Code, Cursor, Codex, Gemini CLI, and a raw CLI on day 1, plus an MCP server that any MCP-compatible agent (Claude Desktop, custom OpenAI/Gemini agents, etc.) can use.
2. **Popularity:** strong launch story (live demo, theme grid, 64-diagram proof gallery), decentralized theme ecosystem (anyone publishes a theme via `npm publish`), and external-registry distribution (Smithery, Glama, Cursor Directory, Cline, awesome lists).

## Non-Goals

- A hosted SaaS for diagram generation.
- Server-side multi-tenant rendering (MCP server is stdio / local-only for v0.1).
- Replacing Mermaid, Excalidraw the app, or diagrams.net — this is an *AI-agent skill layer*, not a drawing tool.
- Generating diagrams via our own LLM call. The skill returns *methodology* (a prompt payload) and tools; the calling agent's model does the JSON drafting.
- Backward compatibility with the existing `~/.claude/skills/excalidraw-diagram/` install (we provide a one-shot migration script, then deprecate).

---

## Section 1 — Architecture & Repo Layout

```
excalidraw-skill-pack/                  github.com/isatimur/excalidraw-skill-pack
├── packages/
│   ├── core/                           # content-only: methodology, schemas, default theme
│   │   ├── SKILL.md                    # "Diagrams ARGUE, not DISPLAY" methodology
│   │   ├── themes/default-sketchy/     # the one bundled theme; ships with core
│   │   ├── element-templates.md
│   │   ├── json-schema.md
│   │   ├── theme.schema.json           # JSON Schema for theme manifest validation
│   │   └── style-templates/            # 6 composition templates
│   ├── renderer-python/                # PyPI: excalidraw-render
│   ├── renderer-node/                  # npm:  excalidraw-render
│   ├── shared/render_template.html     # the one HTML template, symlinked into both renderers
│   ├── mcp-server/                     # npm:  @excalidraw-skill-pack/mcp-server
│   ├── create-excalidraw-theme/        # npm:  create-excalidraw-theme (scaffolder)
│   └── themes/                         # source dirs for monorepo-published themes
│       ├── stripe-press/               # → @excalidraw-skill-pack/theme-stripe-press
│       ├── notion/                     # → @excalidraw-skill-pack/theme-notion
│       ├── whiteboard/                 # → @excalidraw-skill-pack/theme-whiteboard
│       └── dark/                       # → @excalidraw-skill-pack/theme-dark
├── adapters/
│   ├── claude-code/                    # install.sh → ~/.claude/skills/excalidraw-diagram/
│   ├── cursor/                         # install.sh → .cursor/rules/excalidraw.mdc + MCP config
│   ├── codex/                          # install.sh → Codex skills dir + Codex MCP config
│   ├── gemini-cli/                     # install.sh → Gemini extension manifest + MCP
│   └── cli/                            # docs-only; CLI is just the renderer
├── examples/                           # 64 book diagrams (proof gallery)
├── docs/                               # Mintlify source for docs.excalidraw-skill-pack.dev
└── .github/workflows/                  # CI: PR checks + per-package publish on tag
```

### Principles

- **Content-only core.** `core/` is markdown + JSON only — no code. Every adapter pulls from it.
- **One HTML render template.** `shared/render_template.html` is symlinked into both renderers; divergence near-impossible.
- **MCP server is the universal multiplier.** One stdio server, 5 tools, reachable from any MCP-compatible agent.
- **Adapters are thin shims.** Install script + adapter-specific manifest + symlink/copy of core.

---

## Section 2 — Themes as Standalone Packages

A theme is a standalone publishable package, not a directory in the main repo.

| Channel | Naming convention |
|---|---|
| npm | `@excalidraw-skill-pack/theme-<name>` |
| PyPI | `excalidraw-skill-pack-theme-<name>` |

Each package ships the same directory structure:

```
theme/
├── theme.json               # manifest (extends, version, description, preview)
├── palette.json             # color tokens (machine-readable, used by renderer)
├── palette.md               # color tokens + usage doc (read by the agent's system prompt)
├── typography.json          # font family, sizes, weights, italic policy
├── elements/                # element-template overrides (box, callout, arrow)
└── layouts/                 # 6 composition presets (chapter-card, flow-pipeline, etc.)
```

### Composition: `extends`

```json
{ "name": "stripe-press",
  "extends": "default-sketchy",
  "version": "1.0.0",
  "description": "Editorial / book-grade. Proven on 64 diagrams.",
  "preview": "preview.png" }
```

Child themes inherit from parent and override per layer. Resolution merges per layer; file-level override for `elements/` and `layouts/`. Most third-party themes will be ~20 lines of `palette.json` overrides.

### What core ships

- **`default-sketchy` bundled inside core** — always available, no install required. Fallback for every adapter.
- **`theme.schema.json` + `validate-theme` CLI** — anyone publishing a theme can verify shape before push.
- **`create-excalidraw-theme` scaffolder** — `npx create-excalidraw-theme my-brand` generates a publishable package.
- **Curated registry index** — `docs.excalidraw-skill-pack.dev/themes` auto-discovers nightly via `npm search excalidraw-skill-pack-theme` + `pip index`.

### Theme selection (highest wins)

1. Per-call: `generate_diagram_prompt({ theme: "stripe-press" })` MCP arg / `--theme stripe-press` CLI flag
2. Per-project: `.excalidraw-skill-pack.json` `{ "theme": "notion" }`
3. Global: `~/.excalidraw-skill-pack/config.json`

### Adapter resolution

```
resolve(name):
  if name == "default-sketchy": load bundled
  for each installed package matching <prefix><name>: load
  if --theme <name> requested but not installed:
    prompt: "Install @excalidraw-skill-pack/theme-<name>? [Y/n]" → npm i -g / pip install
  fallback: default-sketchy + warn
```

### v0.1 themes shipping

| Theme | Status |
|---|---|
| `default-sketchy` | Bundled in core |
| `@excalidraw-skill-pack/theme-stripe-press` | Published from monorepo (proven on the book) |
| `@excalidraw-skill-pack/theme-notion` | Published from monorepo |
| `@excalidraw-skill-pack/theme-whiteboard` | Published from monorepo |
| `@excalidraw-skill-pack/theme-dark` | Published from monorepo |

All four monorepo-published themes also publish a PyPI mirror under `excalidraw-skill-pack-theme-<name>`.

---

## Section 3 — Renderer + MCP Server

### Renderer: two bindings, one HTML

```
packages/shared/render_template.html     # bundled Excalidraw + html-to-image
packages/renderer-python/                # PyPI: excalidraw-render
  python -m excalidraw_render <file>.excalidraw --theme stripe-press --output out.png --scale 2
packages/renderer-node/                  # npm:  excalidraw-render
  npx excalidraw-render <file>.excalidraw --theme stripe-press --output out.png --scale 2
```

Both bindings:

- Expose an **identical CLI surface**: same flags, same exit codes, same output bytes.
- Source the **same HTML template** from `packages/shared/` (symlink in repo, file-copy in published artifacts).
- **Lazy-install** Playwright Chromium on first run; cached thereafter.
- CI regression: the 64 book diagrams render nightly on both bindings; pixel-diff against golden PNGs (≤2% per image) fails the build on drift.

### MCP server

Distributed as `@excalidraw-skill-pack/mcp-server` on npm. Run via `npx @excalidraw-skill-pack/mcp-server`. Transport: stdio.

| Tool | Purpose | Args |
|---|---|---|
| `generate_diagram_prompt` | Returns SKILL.md + active theme `palette.md` + relevant `layouts/<template>.md` as a structured prompt payload. **Does not call an LLM.** | `theme?`, `style_template?`, `intent?` |
| `render_diagram` | Runs the Node renderer on a JSON payload; returns base64 PNG + dimensions. | `json`, `theme?`, `scale?`, `width?` |
| `audit_diagram` | Validates `.excalidraw` against schema + design rules (isomorphism, evidence artifacts, color usage). Returns severity-tagged issues. | `json`, `theme?` |
| `list_themes` | Lists installed themes + metadata + preview URLs. | — |
| `apply_theme` | Re-skins an existing `.excalidraw` with a different theme: swaps stroke/background colors per the target theme's palette, optionally swaps fonts. Returns transformed JSON; optionally re-renders. | `json`, `target_theme`, `render?` |

The MCP server returns *methodology*, not generated content. This keeps the skill model-agnostic — the calling agent's model does the JSON drafting.

### Adapter integration matrix

| Adapter | "Lite" install (skill only) | "Full" install (skill + MCP) |
|---|---|---|
| Claude Code | `~/.claude/skills/excalidraw-diagram/` | + `mcpServers` entry in `~/.claude/mcp.json` |
| Cursor | `.cursor/rules/excalidraw.mdc` | + entry in Cursor's MCP config |
| Codex | Codex skills dir | + entry in Codex MCP config |
| Gemini CLI | Extension manifest | + Gemini MCP registration |
| Raw CLI | — (renderer only) | — |

Each adapter directory ships `install.sh` (and `install.ps1`) with a `--mode lite|full` flag, defaulting to `full`.

---

## Section 4 — CI / Release Pipeline

### Tooling

| Layer | Tool | Why |
|---|---|---|
| JS package management | pnpm workspaces | Light, fast, works with polyglot monorepos |
| JS versioning + changelog | changesets | Per-package independent semver; automated release PRs |
| Python package management | uv | Fast resolver; `pyproject.toml` per package |
| Python release | `uv build` + `twine upload` in GitHub Actions | Per-package PyPI publish |
| Cross-language version sync | `tools/sync-versions.ts` | Lockstep bump for renderer + MCP when renderer feature ships |

### PR checks (every pull request)

1. Lint: ESLint (TS) + Ruff (Python)
2. Type-check: `tsc --noEmit` + `mypy --strict`
3. Theme validation: `validate-theme` against every changed theme package + every theme directory
4. Renderer smoke tests: 5-diagram canary set on both bindings; compare to golden PNGs (1px tolerance via pixelmatch)
5. 64-diagram pixel regression on `examples/` (≤2% drift per image)
6. Adapter install tests: Docker matrix runs `install.sh` for each adapter on Ubuntu + macOS images
7. Schema check: every `theme.json` validates against `core/theme.schema.json`

### Release flow

```
PR merges to main
   ↓
changesets bot opens "Version Packages" PR (cumulative bumps)
   ↓
Merge that PR
   ↓
publish.yml workflow:
   ├── npm publish (matrix: every changed npm package, in parallel)
   ├── pypi publish (matrix: every changed PyPI package, in parallel via twine)
   ├── git tag + GitHub release with auto-generated changelog
   └── update docs/themes registry index (commit back to main)
```

Per-package versions, independent semver. A theme bump publishes only that theme. A renderer bump cascades to the MCP server via the lockstep script.

### v0.1.0 release manifest

| npm | PyPI |
|---|---|
| `@excalidraw-skill-pack/core` | `excalidraw-skill-pack-core` |
| `excalidraw-render` (Node) | `excalidraw-render` (Python) |
| `@excalidraw-skill-pack/mcp-server` | — |
| `create-excalidraw-theme` | — |
| `@excalidraw-skill-pack/theme-stripe-press` | `excalidraw-skill-pack-theme-stripe-press` |
| `@excalidraw-skill-pack/theme-notion` | `excalidraw-skill-pack-theme-notion` |
| `@excalidraw-skill-pack/theme-whiteboard` | `excalidraw-skill-pack-theme-whiteboard` |
| `@excalidraw-skill-pack/theme-dark` | `excalidraw-skill-pack-theme-dark` |

**Total: 12 packages (8 npm + 4 PyPI), published from one tag via the matrix.**

### Quality gates (cannot release without)

- All themes pass validator
- Renderer test suite green on Python + Node
- 64-diagram pixel regression within tolerance
- All adapter `install.sh` succeed in CI Docker matrix
- ≥1 `examples/` diagram per theme exists and renders cleanly

---

## Section 5 — Docs + Launch

### Docs site

| Choice | Stack | Domain |
|---|---|---|
| Mintlify | Markdown → polished docs site, free for OSS | `excalidraw-skill-pack.dev` (purchase) |

**Pages:**

- `/` — hero, tagline, theme grid, one-line install per agent
- `/getting-started/<adapter>` — 5 install guides (Claude Code, Cursor, Codex, Gemini CLI, raw CLI)
- `/themes` — curated registry; auto-rebuilds nightly from npm + PyPI search
- `/themes/create` — 3-minute tutorial: `npx create-excalidraw-theme my-brand` → `npm publish`
- `/examples` — 64-diagram book gallery + 1 representative diagram per theme
- `/mcp` — MCP tool reference (`generate_diagram_prompt`, `render_diagram`, `audit_diagram`, `list_themes`, `apply_theme`)
- `/spec/theme` — theme manifest spec for authors

### README hero

```
Make your AI agent argue visually.
─────────────────────────────────────────
[15-sec animated demo: prompt → JSON → PNG, switching across 5 themes]

Claude Code         npx @excalidraw-skill-pack/install claude-code
Cursor              npx @excalidraw-skill-pack/install cursor
Codex               npx @excalidraw-skill-pack/install codex
Gemini CLI          npx @excalidraw-skill-pack/install gemini
MCP-compatible      npx @excalidraw-skill-pack/mcp-server
Renderer-only       pipx install excalidraw-render  /  npx excalidraw-render

[Theme grid: 5 PNGs side-by-side]
[Proof gallery: 64 diagrams from "From Copilot to Colleague"]
```

### Launch sequence

| Day | Action |
|---|---|
| T−7 | Twitter teaser: book diagram timelapses |
| T−3 | Draft Show HN post; line up Product Hunt hunter |
| T−1 | Finalize PH listing; pre-publish blog post on isatimur.com |
| T+0 | **Launch:** Show HN + Product Hunt + Twitter thread + blog post |
| T+1 | Post in r/ClaudeAI, r/cursor, r/ChatGPTPro, r/LocalLLaMA |
| T+3 | Post in MCP Discord, Cursor Discord, Anthropic Discord (skills channel) |
| T+7 | Submit to external registries |
| T+14 | Follow-up post: "First 7 community themes" |

### External registry submissions

- Smithery (smithery.ai)
- Glama (glama.ai)
- Cline marketplace
- Cursor Directory (cursor.directory)
- Awesome MCP Servers (GitHub list)
- awesome-claude-code-skills (GitHub list)
- npm + PyPI (automatic via publish)

### Community on-ramps

- **GitHub Discussions** (no Discord for v0.1; revisit at v0.2 if traction warrants)
- Issue templates: bug, theme idea, feature request, registry-add request
- Theme PR template (optional — themes work without it; only needed for curated registry listing)
- Examples gallery PR convention: every theme PR adds ≥1 example diagram

### Content / SEO bets

| Asset | Slot |
|---|---|
| Anchor post: "How I made 64 diagrams for an AI book with one skill" | Launch day on isatimur.com |
| Per-adapter tutorials: "excalidraw-skill-pack in Claude Code / Cursor / Codex / Gemini" | Weekly T+1 → T+30 |
| Comparison: "excalidraw-skill-pack vs Mermaid vs diagrams.net for AI agents" | T+14 |
| Theme spotlight (each new community theme) | Ongoing |

### Success metrics (90-day window from launch)

- ≥1,000 GitHub stars
- ≥5 community-published themes
- ≥3 third-party integrations (people writing their own agents on the MCP)
- Top-10 SERP for "AI agent diagram" / "MCP diagram server"

---

## Open Questions (deferred to writing-plans phase)

- **Domain purchase:** `excalidraw-skill-pack.dev` — buy now or after name is locked post-launch?
- **MIT vs Apache 2.0:** convention says MIT for skills; Apache 2.0 friendlier to enterprise contributors. Default MIT unless objection.
- **`apply_theme` color-mapping semantics:** literal-color-swap vs role-based-remap (e.g., "primary accent" → target's "primary accent"). Role-based is more robust but requires every theme to declare a role table. Defer to writing-plans.
- **Renderer migration:** existing book repo's renderer needs to switch from `~/.claude/skills/excalidraw-diagram/references/render_excalidraw.py` to the new `excalidraw-render` PyPI package. One-shot migration script vs gradual deprecation? Defer.

## Risks

| Risk | Mitigation |
|---|---|
| Twin-publish (npm + PyPI) per theme doubles release surface | Shared release workflow + tag-matrix; `create-excalidraw-theme` scaffolds both targets |
| First-run install latency for themes | `default-sketchy` bundled in core; auto-install prompt is opt-in |
| Renderer divergence between Python and Node | One HTML template (symlinked); 64-diagram pixel regression on both bindings nightly |
| Adapter format churn (Cursor MDC, Gemini extension, etc.) | Adapters are 100% thin shims; format changes affect ~50 LOC each |
| MCP `apply_theme` requires consistent color roles across themes | Role schema lives in `core/theme.schema.json`; validator enforces it; v0.1 themes all use the same role set |
| "Most popular" depends on launch execution, not just code | Launch playbook in Section 5; rehearsable T−7 → T+30 |

## Self-Review Notes

- No "TBD" or "TODO" markers remain in main spec sections (open questions are explicitly bucketed as deferred to writing-plans).
- Sections internally consistent: theme model (Section 2) consumed by renderer (Section 3) consumed by CI release matrix (Section 4) consumed by docs registry (Section 5).
- Scope: 12 packages + 5 adapters is large but each unit is small and parallelizable. Decomposable into ≥6 milestones in the implementation plan.
- Ambiguity check: `apply_theme` semantics flagged as open question — fix is to specify in writing-plans rather than leaving spec ambiguous.

---

## Next step

Hand to `superpowers:writing-plans` to produce the implementation plan: milestone breakdown, task graph, owner assignments, parallel work streams.
