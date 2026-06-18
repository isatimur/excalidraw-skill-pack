# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A skill pack that makes AI agents produce *good* Excalidraw diagrams — visual arguments, not labeled boxes. The product is the **methodology** (`packages/core/SKILL.md`) plus **themes** and a **dual-language renderer**. The shipped artifacts are npm + PyPI packages and per-agent install adapters; there is no long-running application.

## Commands

pnpm workspace (Node ≥20, pnpm 8.9.2). Run from repo root unless noted.

```bash
pnpm install
pnpm build                 # tsc across all packages (pnpm -r build)
pnpm test                  # vitest across all packages
pnpm lint                  # eslint
pnpm typecheck             # tsc --noEmit
pnpm exec playwright install chromium   # required before renderer tests run
```

- **Single package:** `pnpm --filter @excalidraw-skill-pack/core test` (or `build`/`lint`/`typecheck`).
- **Single test file:** `pnpm --filter @excalidraw-skill-pack/render exec vitest run tests/parity.test.ts`.
- **Watch one file:** append the path to `vitest` without `run`.

Python renderer (`packages/renderer-python/`, uses `uv`, requires Python ≥3.11):

```bash
cd packages/renderer-python
uv sync && uv run playwright install chromium
uv run pytest                          # all
uv run pytest tests/test_canary.py     # single
uv run ruff check && uv run ruff format && uv run mypy --strict
```

## Architecture

### Monorepo layout (`packages/`)

- **`core/`** (`@excalidraw-skill-pack/core`) — the methodology. `SKILL.md` is the prompt agents actually read; `theme.schema.json` + `validate-theme.ts` validate theme JSON (Ajv); `theme-loader.ts` discovers and resolves themes. Bundles the `default-sketchy` theme. Has the `validate-theme` bin. Every other package depends on this.
- **`renderer-node/`** (`@excalidraw-skill-pack/render`) — renders `.excalidraw` JSON → PNG by loading `src/render_template.html` in headless Chromium via Playwright. Exposes the `excalidraw-render` CLI (`commander`).
- **`renderer-python/`** (`excalidraw-skill-pack-render`) — a **parity mirror** of the Node renderer. It ships the *same* `render_template.html`; both renderers must produce pixel-identical output (see Visual regression below).
- **`mcp-server/`** (`@excalidraw-skill-pack/mcp-server`) — stdio MCP server. Each tool is one file in `src/tools/`: `generate_diagram_prompt`, `render_diagram`, `apply_theme`, `list_themes`, `audit_diagram`. `server.ts` is a thin dispatcher over a tool registry.
- **`themes/<name>/`** — published, curated themes (`dark`, `notion`, `stripe-press`, `whiteboard`). Each is a **dual npm + PyPI package**: `package.json` + `pyproject.toml`, `theme.json` (manifest), `palette.{json,md}`, `typography.json`, and `elements/` + `layouts/` markdown that gets spliced into agent prompts.
- **`create-excalidraw-theme/`** (`@excalidraw-skill-pack/create-theme`) — Mustache scaffolder for new theme packages (`src/template/`).
- **`install/`** (`@excalidraw-skill-pack/install`) — meta-installer. Its build copies `adapters/` into `dist/adapters/`; `ADAPTERS` in `src/index.ts` is the source of truth for supported agents.
- **`shared/fixtures/`** — canonical `.excalidraw` example diagrams + `golden/` baseline images used by renderer tests.

### Adapters (`adapters/<agent>/`)

`install.sh` + `install.ps1` (and READMEs/templates) for each agent: `claude-code`, `cursor`, `copilot`, `codex`, `gemini-cli`, `cli`. The installer wires the skill/MCP server into that agent's config.

### Theme resolution (`core/theme-loader.ts`)

Active theme is resolved in priority order: `--theme` flag → project `.excalidraw-skill-pack.json` → global `~/.excalidraw-skill-pack/config.json` → `default-sketchy`. Themes support inheritance via the manifest's `extends` field, merged by `mergeThemes`. The MCP `generate_diagram_prompt` tool splices the resolved theme's `palette.md` and requested `layouts/<template>.md` into the system prompt at call time — themes shape output through prompt content, not just color tokens.

### Visual regression / dual-language parity

The renderer tests are the load-bearing safety net. `renderer-node/tests/`: `parity.test.ts` (Node vs Python output), `canary.test.ts`, `examples-regression.test.ts` (fixtures vs `golden/`), plus `test_canary.py` on the Python side. They diff PNGs with `pixelmatch`. **Any change to render logic or `render_template.html` must be mirrored in both renderers and re-baseline the golden images deliberately.**

### Container build (Glama MCP registry)

`Dockerfile` builds the image the Glama registry runs to inspect the server. Two non-obvious requirements, both of which silently break the build if missed:

- It must `COPY tsconfig.base.json` — every package extends it, and without it `tsc` falls back to an ES3 target (fails with errors like `Property 'replaceAll' does not exist`).
- It must `COPY packages/shared` — `renderer-node/src/render_template.html` is a symlink into `shared/`, so omitting it dangles the symlink and the renderer build fails.

The Dockerfile sets `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` and builds only `--filter @excalidraw-skill-pack/mcp-server...`: the registry only needs the server to start and enumerate tools (the MCP server imports `render` lazily, so tool inspection needs no browser). `glama.json` at the repo root claims maintainership for the registry listing.

## Conventions

- ESM only (`"type": "module"`), TS `strict` + `noUncheckedIndexedAccess` + `noImplicitOverride` (see `tsconfig.base.json`). Each package has its own `tsconfig.json` extending the base.
- Cross-package deps use `workspace:*` (except `install`, which pins `core` by published range so the standalone installer resolves from the registry).
- **No JSDoc/docstrings and no comments that restate what well-named code shows.** Comment only to explain *why*.
- Do not emit nonstandard Excalidraw properties (e.g. `label`); shape labels are separate text elements bound via `containerId`, placed immediately after their container in `elements`. See `SKILL.md` for the full output contract.

## Release flow (changesets)

1. `pnpm changeset` to record intended version bumps in `.changeset/`.
2. Merging to `main` lets the Changesets bot open a "Version Packages" PR; merging *that* publishes affected npm packages.
3. PyPI mirrors (renderer + themes) publish via `tools/publish-pypi-themes.sh` / the `publish-pypi` workflow. `pnpm sync-versions` (`tools/sync-versions.ts`) keeps npm and PyPI package versions aligned — run it after a version bump if npm/PyPI drift.
4. CI (`.github/workflows/`): `ci.yml` (lint + typecheck + test), `adapter-install-matrix.yml` (every adapter installs cleanly), `publish-npm`, `publish-pypi`, `deploy-web`, and `rebuild-theme-registry.yml` (nightly scan that lists any published `*theme-*` package in the registry within ~24h).

## Docs & site

- `docs/site/` — Mintlify documentation source.
- `web/` — static theme registry + spec site, deployed to Vercel (`vercel.json`). `tools/build-theme-registry.ts` generates the registry; `tools/render-theme-previews.mjs` generates preview images.
- `docs/superpowers/specs/2026-05-28-excalidraw-universal-skill-pack-design.md` — the full original design doc.

## Adding things

- **New theme:** `npx @excalidraw-skill-pack/create-theme my-brand` (standalone, auto-listed via nightly scan), or add `packages/themes/<name>/` mirroring an existing theme for a curated monorepo theme.
- **New adapter:** add `adapters/<name>/install.{sh,ps1}`, register it in `packages/install/src/index.ts`, add a CI matrix entry, and a `docs/site/getting-started/<name>.mdx`. See `CONTRIBUTING.md`.
