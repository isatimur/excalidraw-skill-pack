# @excalidraw-skill-pack/mcp-server

MCP server exposing excalidraw-skill-pack tools to any MCP-compatible AI agent.

## Tools

- `generate_diagram_prompt` — Build a system prompt with theme palette and layout for the agent to create diagram JSON.
- `render_diagram` — Render Excalidraw JSON to a base64 PNG.
- `audit_diagram` — Validate Excalidraw JSON and report structural issues.
- `list_themes` — List all available themes with metadata.
- `apply_theme` — Re-colour an existing diagram's elements using a target theme's palette.

## Usage

```bash
npx @excalidraw-skill-pack/mcp-server
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "excalidraw": {
      "command": "npx",
      "args": ["excalidraw-skill-pack-mcp"]
    }
  }
}
```
