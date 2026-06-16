# @excalidraw-skill-pack/mcp-server

MCP server exposing **excalidraw-skill-pack** to any MCP-compatible AI agent — the diagram-*quality* layer that turns "draw me a diagram" into figures that argue visually, not labeled boxes.

It returns *methodology* (the skill prompt + active theme), not LLM-generated content — your agent's own model drafts the JSON. Proven on 77 diagrams in the published book [*From Copilot to Colleague*](https://fromcopilottocolleague.com).

## Tools

| Tool | Inputs | Output |
|------|--------|--------|
| `generate_diagram_prompt` | `theme?` (default `default-sketchy`), `style_template?` (e.g. `concept-card`), `intent?` | A structured system-prompt payload (SKILL.md methodology + theme palette + layout). **Does not call an LLM.** |
| `render_diagram` | `json` *(required)*, `theme?`, `scale?` (default `2`), `width?` (default `1200`) | `{ png_base64, width, height }` — renders Excalidraw JSON to a PNG via headless Chromium. |
| `apply_theme` | `json` *(required)*, `target_theme` *(required)*, `render?` | Re-colours an existing diagram's elements with the target theme's palette; optionally returns `png_base64`. |
| `audit_diagram` | `json` *(required)* | A list of structural issues with `severity` (error/warning) and `path` — validates Excalidraw JSON. |
| `list_themes` | _(none)_ | All installed themes with `name`, `version`, `description`. |

## Usage

```bash
npx -y @excalidraw-skill-pack/mcp-server
```

Add to your MCP client config:

```json
{
  "mcpServers": {
    "excalidraw-skill-pack": {
      "command": "npx",
      "args": ["-y", "@excalidraw-skill-pack/mcp-server"]
    }
  }
}
```

### Claude Code

Install the whole pack (skill + this server) as a plugin:

```text
/plugin marketplace add isatimur/excalidraw-skill-pack
/plugin install excalidraw-skill-pack
```

## Themes

Themes ship as standalone packages (`@excalidraw-skill-pack/theme-*` on npm, `excalidraw-skill-pack-theme-*` on PyPI). The server discovers every installed theme. Browse the registry at [excalidraw-skill-pack.vercel.app/themes](https://excalidraw-skill-pack.vercel.app/themes).

## Links

- Docs: https://excalidraw-skill-pack.vercel.app
- Repo: https://github.com/isatimur/excalidraw-skill-pack
- License: MIT
