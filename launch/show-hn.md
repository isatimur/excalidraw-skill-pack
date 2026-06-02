# Show HN: excalidraw-skill-pack — Make your AI agent argue visually

I've been generating diagrams for my book *From Copilot to Colleague* with a custom Claude Code skill — 14 diagrams over a few weeks, all rendered from JSON, all version-controlled with the rest of the manuscript. The skill teaches Claude the *methodology*: "diagrams argue, they don't display" — isomorphism test, evidence artifacts (real API names, actual JSON, never placeholders), one accent per diagram.

After enough of my friends asked "how did you do that?", I extracted it into a universal skill pack that works in every major AI-agent platform:

- **Claude Code, Cursor, Codex, Gemini CLI** — one-command install per agent
- **Any MCP-compatible agent** — stdio MCP server, 5 tools (generate prompt, render, audit, list themes, apply theme)
- **Renderer-only** — `npx @excalidraw-skill-pack/render` or `pipx install excalidraw-skill-pack-render` for CI/batch use

The interesting bit is the **theme ecosystem**: each theme is a standalone npm + PyPI package (`@excalidraw-skill-pack/theme-stripe-press`, etc.), so anyone can publish a custom brand theme without PR-ing the main repo. We ship with 5: `default-sketchy`, `stripe-press` (the book's look), `notion`, `whiteboard`, `dark`. `npx @excalidraw-skill-pack/create-theme my-brand` scaffolds a new one in 3 minutes.

There's an `apply_theme` MCP tool that re-skins any existing `.excalidraw` to a different theme via role-based color remapping — useful for "give me the same diagram in our brand palette."

Demo: https://excalidraw-skill-pack.vercel.app (15-second video at the top)
Gallery (14 diagrams): https://excalidraw-skill-pack.vercel.app/examples
Code: https://github.com/isatimur/excalidraw-skill-pack
License: MIT

Happy to answer questions. The biggest design call was "skill returns *methodology*, not generated content" — the MCP server doesn't call an LLM itself; the calling agent's model does the JSON drafting using the methodology + theme spliced in. Keeps it model-agnostic and free for us.
