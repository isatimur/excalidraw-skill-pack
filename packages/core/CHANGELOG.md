# @excalidraw-skill-pack/core

## 0.2.0

### Minor Changes

- Add a **Mermaid fast-path** for structured diagrams. A document with `"type": "mermaid"` and a `definition` string is parsed via `@excalidraw/mermaid-to-excalidraw`, hydrated to full elements, and rendered in the active theme's hand-drawn style. `hydrate` works on Mermaid documents too. Mermaid is imported dynamically so it adds no cost to non-Mermaid renders.

  `SKILL.md` documents when to reach for Mermaid (rigid flowchart/sequence/class structure) versus the skeleton format (bespoke visual arguments the methodology is built for). Only flowchart/sequence/class are natively supported; other Mermaid types fall back to an image.

- Add the Excalidraw **Skeleton authoring format**. Agents can now emit minimal element skeletons (`"type": "excalidraw-skeleton"`) instead of fully-qualified JSON — the renderer hydrates them via Excalidraw's `convertToExcalidrawElements`, auto-generating `id`/`seed`/`versionNonce`/`boundElements`/`containerId`, bound text labels, and arrow point geometry. This roughly halves per-element output and removes a whole class of malformed-JSON defects.

  - Renderer accepts skeleton documents directly (node + Python share the template).
  - New `excalidraw-render hydrate <skeleton>` subcommand converts a skeleton into a full, Excalidraw-openable `.excalidraw` file.
  - `SKILL.md` and `element-templates.md` document the skeleton format, the arrow-binding rule (bound arrows still need approximate `x`/`y`/`width`), and native `frame` elements for section boundaries.

  Note: elbow arrows were evaluated and intentionally **not** adopted — orthogonal routing is computed by Excalidraw's interactive editor, not by the static SVG export path, so `elbowed: true` renders as a straight line in this pipeline.

## 0.1.1

### Patch Changes

- SKILL.md: added Output Contract, Excalidraw Correctness Contract, and Step 7 (Report the Artifact) for more deterministic agent output.
- element-templates.md: added Decision Diamond and Evidence Artifact Box templates.

## 0.1.0

### Minor Changes

- 5d65794: Initial alpha release: core methodology, dual-language renderer (npm + PyPI), MCP server with 5 tools, default-sketchy theme bundled in core.
