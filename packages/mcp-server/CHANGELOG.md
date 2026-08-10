# @excalidraw-skill-pack/mcp-server

## 0.1.5

### Patch Changes

- Updated dependencies [e90e380]
  - @excalidraw-skill-pack/core@0.2.2
  - @excalidraw-skill-pack/render@0.3.1

## 0.1.4

### Patch Changes

- f89be0c: Sync the MCP server's self-reported version. The `Server()` identity hardcoded `0.1.2` while `package.json`, `server.json`, and the published npm package were all `0.1.3`, so the running container (and any Glama release built from it) advertised a stale version.

## 0.1.3

### Patch Changes

- 5186be0: chore: add discoverability metadata (keywords, repository, homepage, bugs, author) to all published packages so they surface in npm search and link back to the repo/docs.
- Updated dependencies [5186be0]
- Updated dependencies [77d63f2]
- Updated dependencies [34be389]
  - @excalidraw-skill-pack/core@0.2.1
  - @excalidraw-skill-pack/render@0.3.0

## 0.1.2

### Patch Changes

- Updated dependencies
- Updated dependencies
  - @excalidraw-skill-pack/render@0.2.0
  - @excalidraw-skill-pack/core@0.2.0

## 0.1.1

### Patch Changes

- Docs-only: README/palette markdown bundled with the package now matches the post-v0.1.0 names and counts (14 book diagrams, scoped package names in import + `npx` examples). No behavior change.
- Updated dependencies
  - @excalidraw-skill-pack/render@0.1.1

## 0.1.0

### Minor Changes

- 5d65794: Initial alpha release: core methodology, dual-language renderer (npm + PyPI), MCP server with 5 tools, default-sketchy theme bundled in core.

### Patch Changes

- Updated dependencies [5d65794]
  - @excalidraw-skill-pack/core@0.1.0
  - @excalidraw-skill-pack/render@0.1.0
