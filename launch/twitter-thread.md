# Twitter / X launch thread (10 tweets)

1/ Shipping excalidraw-skill-pack — make your AI agent argue visually.

One command install for Claude Code, Cursor, Codex, Gemini CLI, or any MCP-compatible agent.

Demo + 64-diagram gallery: https://excalidraw-skill-pack.dev

[hero GIF]

2/ The methodology: "diagrams argue, they don't display."

Every shape carries meaning. Evidence artifacts (real API names, actual JSON) over placeholder text. One accent per diagram, ever.

The agent reads this. So do you.

[methodology snippet image]

3/ Proof: 64 diagrams in my book *From Copilot to Colleague* (https://fromcopilottocolleague.com) were generated with this skill.

The book argument lives in the diagrams. The diagrams live in version control. Same workflow as the manuscript.

[before/after screenshot from the book]

4/ Universal install:
- Claude Code: `npx @excalidraw-skill-pack/install claude-code`
- Cursor: `npx @excalidraw-skill-pack/install cursor`
- Codex: `npx @excalidraw-skill-pack/install codex`
- Gemini: `npx @excalidraw-skill-pack/install gemini-cli`
- Any MCP agent: `npx @excalidraw-skill-pack/mcp-server`

5/ Theme ecosystem: 5 ship today (default-sketchy, stripe-press, notion, whiteboard, dark).

[theme grid image]

Anyone can publish a custom theme:
`npx @excalidraw-skill-pack/create-theme my-brand`
`npm publish`

3 minutes from "I want my brand colors" to "shipped on npm."

6/ The MCP server exposes 5 tools:

- generate_diagram_prompt — methodology + theme as a prompt payload
- render_diagram — JSON → PNG
- audit_diagram — schema + design rules
- list_themes — installed themes
- apply_theme — re-skin any diagram to a different theme

7/ The design call I'm most happy with: the server returns *methodology*, not generated content.

Your agent's own model drafts the JSON. We never call an LLM ourselves.

Means: model-agnostic, no API key, no cost to us, no rate limits.

8/ Renderer is dual-language — Node (`npx @excalidraw-skill-pack/render`) and Python (`pipx install excalidraw-skill-pack-render`).

Same CLI. Same output. Use whichever fits your CI / scripts.

[CLI screenshot, both languages]

9/ It's open-source (MIT) and lives at https://github.com/isatimur/excalidraw-skill-pack

PRs welcome — especially new themes. The theme spec is 20 lines of JSON.

10/ If you tried it, lmk what you diagrammed. Or DM me your worst diagram and I'll send back what the skill does with it.

(Or just star the repo — that's the bat-signal that this matters.)

🙏
