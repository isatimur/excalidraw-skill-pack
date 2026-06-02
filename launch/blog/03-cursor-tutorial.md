<!-- Publish T+14 -->

# How to use excalidraw-skill-pack with Cursor

Cursor's rule system lets you attach methodology to any file type — so when you're working on a `.excalidraw` file, or asking the agent to diagram something, it reads the right context automatically. This tutorial wires up excalidraw-skill-pack as a Cursor rule + MCP server so your agent produces diagrams that argue rather than label boxes.

## Install

```bash
npx @excalidraw-skill-pack/install cursor
```

What gets written:

- `.cursor/rules/excalidraw.mdc` — the Excalidraw methodology rule, auto-activates when editing `.excalidraw` files
- `.cursor/mcp.json` — registers `@excalidraw-skill-pack/mcp-server` so Cursor's agent can call `render_diagram`

The rule activation is scoped: it loads when the open file has a `.excalidraw` extension, or when you explicitly mention "excalidraw" or "diagram" in your prompt.

## Your first diagram

Open Cursor and in the agent chat, type:

> "Generate an Excalidraw diagram for our auth flow. Include the real endpoint names."

The agent reads the methodology from the MDC rule — isomorphism test, evidence artifacts, one accent per diagram — and drafts the JSON. It then calls `render_diagram` via the MCP server to produce a PNG.

The `.excalidraw` source file is the primary artifact. Commit it. The PNG is a derived artifact for docs and README use.

## Understanding what makes the diagram good

**The isomorphism test.** Strip every text label off your diagram. Does the shape alone still tell the story? A sequence of boxes and arrows should read as "request → decision → response" even without the words. If you need the labels to communicate the concept, the structure isn't doing enough work.

**Evidence artifacts.** The agent replaces generic labels with specifics from your codebase: `POST /api/auth/token` instead of "Auth Endpoint," `{ sub, iat, exp }` instead of "Token," `401 Unauthorized` instead of "Error." This is what makes a diagram durable — it describes how things actually work.

## Switching themes per project

Install with a specific theme:

```bash
THEME=stripe-press npx @excalidraw-skill-pack/install cursor
```

This re-runs the installer, embedding the stripe-press palette inside the MDC rule so the agent knows those colors when generating JSON. Reinstall to swap themes.

Per call, you can also just tell the agent: "Use the whiteboard theme for this one." The rule includes all five bundled palettes and the agent picks from them.

## Theme authoring

Five themes ship in v0.1: `default-sketchy`, `stripe-press` (editorial / book-grade), `notion` (rounded, off-white), `whiteboard` (low-fi, workshop-style), `dark` (inverted contrast).

To author your own:

```bash
npx create-excalidraw-theme my-brand
cd theme-my-brand
# edit palette.json and palette.md
npm publish --access public
```

Your theme appears in the registry within 24 hours. Reinstall with `THEME=my-brand npx @excalidraw-skill-pack/install cursor` to activate it.

## What's next

The [excalidraw-skill-pack.vercel.app/examples](https://excalidraw-skill-pack.vercel.app/examples) gallery shows 14 diagrams generated with this methodology — for the book *From Copilot to Colleague*. Good reference for what "diagrams that argue" looks like across diagram types: flows, stacks, relationship maps, concept cards.

The [MCP tool reference](https://excalidraw-skill-pack.vercel.app/mcp/tool-reference) documents all 5 tools if you want to call them directly from Cursor's tool-use interface.
