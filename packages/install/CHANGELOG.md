# @excalidraw-skill-pack/install

## 0.1.6

### Patch Changes

- Copilot adapter now uses sentinel sections (`<!-- BEGIN excalidraw-skill-pack -->`) so multiple skill packs can coexist in the same `.github/copilot-instructions.md` without overwriting each other.

## 0.1.5

### Patch Changes

- Add GitHub Copilot adapter: `npx @excalidraw-skill-pack/install copilot` writes `.github/copilot-instructions.md` in the current project and optionally registers the MCP server in `.vscode/mcp.json`.

## 0.1.0

### Minor Changes

- bcf5c46: Initial release of the one-command adapter installer:

  npx @excalidraw-skill-pack/install claude-code

  Supports `claude-code`, `cursor`, `codex`, `gemini-cli` on macOS/Linux/Windows.
