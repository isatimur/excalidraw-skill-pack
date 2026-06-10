<!-- Publish T+7 -->

# How to use excalidraw-skill-pack with Claude Code

Your AI agent can already write code, refactor it, and explain it. This tutorial shows you how to also make it argue visually — turning a prompt into a version-controlled Excalidraw PNG in one step, inside Claude Code.

## Install

One command. It wires both the skill and the MCP server:

```bash
npx @excalidraw-skill-pack/install claude-code
```

What gets written:

- `~/.claude/skills/excalidraw-diagram/SKILL.md` — the methodology the agent reads
- `~/.claude/skills/excalidraw-diagram/themes/default-sketchy/` — the bundled starting theme
- `~/.claude/mcp.json` — registers `@excalidraw-skill-pack/mcp-server` so Claude can call `render_diagram` directly

Restart Claude Code after install so the skill and MCP server load.

## Your first diagram

Open Claude Code and type:

> "Make me a diagram of our auth flow. Use the stripe-press theme."

The agent will:

1. Load the methodology from `SKILL.md` (isomorphism test, evidence artifacts, one accent per diagram)
2. Draft Excalidraw JSON shaped around your auth flow — with real node labels, not "Component A"
3. Call `render_diagram` via the MCP server to produce a PNG

The PNG lands in your working directory. The `.excalidraw` source goes there too — version-control both.

## Understanding what makes the diagram good

The skill teaches two concepts that matter:

**The isomorphism test.** Would the structure alone (with no text labels) communicate the concept? A good diagram passes. If you stripped every label off your auth flow and the remaining shapes still showed "request → verify → grant/deny," the structure is carrying the argument.

**Evidence artifacts.** Real API names, actual JSON formats, real event names from your codebase. The agent replaces "Service B" with `POST /auth/verify`, replaces "Token" with `{ iat, sub, exp }`. This specificity is what makes diagrams useful over time — they document how things actually work, not how you wish they were abstracted.

## Switching themes

Per project, drop a config file at the root:

```bash
echo '{ "theme": "stripe-press" }' > .excalidraw-skill-pack.json
```

Per call, just tell Claude: "Use the notion theme." The MCP server reads the project config first, then falls back to `default-sketchy`.

Five themes ship with v0.1: `default-sketchy`, `stripe-press` (editorial / book-grade), `notion` (rounded, off-white), `whiteboard` (low-fi, workshop-style), `dark` (inverted contrast). Each theme's palette is written in both JSON (for the renderer) and Markdown (for the agent — explaining *when* to use each color).

To publish your own brand theme: `npx @excalidraw-skill-pack/create-theme my-brand && npm publish --access public`. It shows up in the registry within 24 hours.

## Uninstall

```bash
rm -rf ~/.claude/skills/excalidraw-diagram
# Remove the excalidraw-skill-pack entry from ~/.claude/mcp.json
```

## What's next

The [book gallery on GitHub](https://github.com/isatimur/excalidraw-skill-pack/tree/main/examples/book) shows the range of what the methodology produces. Every diagram there was generated with the same skill you just installed — part of the 77 drawn for the book *From Copilot to Colleague* ([read them all](https://fromcopilottocolleague.com)).

If you build something, share it. If the diagram comes back wrong on the first try, look at the isomorphism test first — usually the prompt is describing content rather than structure.
