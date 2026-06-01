# Raw CLI

No adapter to install — the CLI is the renderer.

## Node

```bash
npx excalidraw-render diagram.excalidraw --theme stripe-press --output out.png --scale 2
```

## Python

```bash
pipx install excalidraw-render
playwright install chromium
excalidraw-render diagram.excalidraw --theme stripe-press --output out.png --scale 2
```

## With MCP-compatible tools

```bash
npx @excalidraw-skill-pack/mcp-server
# Then point any MCP client at this stdio server.
```

## With Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

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
