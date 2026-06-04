# Cursor Directory submission

**Submit at:** https://cursor.directory

**Name:** excalidraw-skill-pack

**Adapter focus:** Cursor (MDC rule + MCP server)

**Install command:**

```bash
npx @excalidraw-skill-pack/install cursor
```

**What it does:**

Installs `.cursor/rules/excalidraw.mdc` (auto-activates on `.excalidraw` files and diagram-related prompts) and `.cursor/mcp.json` (registers the MCP server with 5 tools). Your Cursor agent reads the Excalidraw methodology — isomorphism test, evidence artifacts, one accent per diagram — and calls `render_diagram` to produce PNGs directly in your session.

**Theme ecosystem:**

5 themes ship in v0.1: `default-sketchy`, `stripe-press` (editorial / book-grade), `notion`, `whiteboard`, `dark`. Install with a specific theme:

```bash
THEME=stripe-press npx @excalidraw-skill-pack/install cursor
```

Anyone can publish a custom brand theme as a standalone npm package (`@excalidraw-skill-pack/theme-<name>`). Author one in 3 minutes:

```bash
npx @excalidraw-skill-pack/create-theme my-brand
cd theme-my-brand && npm publish --access public
```

**Tags:** diagrams, excalidraw, visualization, mcp, themes

**Repository:** https://github.com/isatimur/excalidraw-skill-pack

**Homepage:** https://excalidraw-skill-pack.vercel.app

**License:** MIT
