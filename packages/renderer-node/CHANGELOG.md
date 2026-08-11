# @excalidraw-skill-pack/render

## 0.3.1

### Patch Changes

- Updated dependencies [e90e380]
  - @excalidraw-skill-pack/core@0.2.2

## 0.3.0

### Minor Changes

- 77d63f2: feat(render): batch rendering that reuses one Chromium instance. Adds the `Renderer` class, `renderMany()`, and `hydrateSkeleton` to the public API, and the CLI now accepts multiple input files (rendering them in a single browser session, with `-o` as an output directory). `renderToPng` is unchanged and output is byte-identical — browser launch, previously paid per render, now happens once per batch.

### Patch Changes

- 5186be0: chore: add discoverability metadata (keywords, repository, homepage, bugs, author) to all published packages so they surface in npm search and link back to the repo/docs.
- Updated dependencies [5186be0]
- Updated dependencies [34be389]
  - @excalidraw-skill-pack/core@0.2.1

## 0.2.0

### Minor Changes

- Add a **Mermaid fast-path** for structured diagrams. A document with `"type": "mermaid"` and a `definition` string is parsed via `@excalidraw/mermaid-to-excalidraw`, hydrated to full elements, and rendered in the active theme's hand-drawn style. `hydrate` works on Mermaid documents too. Mermaid is imported dynamically so it adds no cost to non-Mermaid renders.

  `SKILL.md` documents when to reach for Mermaid (rigid flowchart/sequence/class structure) versus the skeleton format (bespoke visual arguments the methodology is built for). Only flowchart/sequence/class are natively supported; other Mermaid types fall back to an image.

- Add the Excalidraw **Skeleton authoring format**. Agents can now emit minimal element skeletons (`"type": "excalidraw-skeleton"`) instead of fully-qualified JSON — the renderer hydrates them via Excalidraw's `convertToExcalidrawElements`, auto-generating `id`/`seed`/`versionNonce`/`boundElements`/`containerId`, bound text labels, and arrow point geometry. This roughly halves per-element output and removes a whole class of malformed-JSON defects.

  - Renderer accepts skeleton documents directly (node + Python share the template).
  - New `excalidraw-render hydrate <skeleton>` subcommand converts a skeleton into a full, Excalidraw-openable `.excalidraw` file.
  - `SKILL.md` and `element-templates.md` document the skeleton format, the arrow-binding rule (bound arrows still need approximate `x`/`y`/`width`), and native `frame` elements for section boundaries.

  Note: elbow arrows were evaluated and intentionally **not** adopted — orthogonal routing is computed by Excalidraw's interactive editor, not by the static SVG export path, so `elbowed: true` renders as a straight line in this pipeline.

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @excalidraw-skill-pack/core@0.2.0

## 0.1.1

### Patch Changes

- Docs-only: README/palette markdown bundled with the package now matches the post-v0.1.0 names and counts (14 book diagrams, scoped package names in import + `npx` examples). No behavior change.

## 0.1.0

### Minor Changes

- 5d65794: Initial alpha release: core methodology, dual-language renderer (npm + PyPI), MCP server with 5 tools, default-sketchy theme bundled in core.

### Patch Changes

- Updated dependencies [5d65794]
  - @excalidraw-skill-pack/core@0.1.0
