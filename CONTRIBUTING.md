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
