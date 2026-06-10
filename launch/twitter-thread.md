# Twitter / X launch thread (10 tweets)

1/ Most AI tools draw boxes that label.

This one draws diagrams that *argue*.

excalidraw-skill-pack — the diagram-quality layer for your AI agent. One command for Claude Code, Cursor, Copilot, Codex, Gemini, or any MCP agent.

https://excalidraw-skill-pack.vercel.app

[hero GIF]

2/ "Isn't there an official Excalidraw MCP now?"

Yes — and it's good. But it solves *plumbing*: emit valid JSON, render a canvas. So does every other one.

None of them decide WHAT to draw or WHY. You still get boxes-and-arrows.

This is the layer above: taste.

3/ The methodology the agent reads before it draws:

• Isomorphism test — delete every label; does the structure still carry the idea?
• Evidence artifacts — real API names, actual JSON, never placeholders
• Multi-zoom — overview + regions + detail
• One accent per diagram

4/ Proof, not vibes:

This skill drew 77 diagrams for my published book *From Copilot to Colleague*. Argument spines, chapter openers, concept figures, inline explainers.

No other Excalidraw generator can point at a corpus like that.

[before/after from the book]

5/ Universal install:
• Claude Code: `npx @excalidraw-skill-pack/install claude-code`
• Cursor: `…install cursor`
• GitHub Copilot: `…install copilot`
• Codex: `…install codex`
• Gemini: `…install gemini-cli`
• Any MCP agent: `npx @excalidraw-skill-pack/mcp-server`

6/ It renders, then *looks at the PNG*, then fixes itself.

Overlaps, clipped text, arrows routing through boxes — caught in a render-view-fix loop before it ever hands you the file. Most generators stop at "valid JSON." This stops at "actually good."

7/ Theme ecosystem: 5 ship today (default-sketchy, stripe-press, notion, whiteboard, dark).

[theme grid]

Anyone can publish a brand theme as its own npm package:
`npx @excalidraw-skill-pack/create-theme my-brand && npm publish`

3 minutes, no PR to my repo.

8/ The design call I'm happiest with: the MCP server returns *methodology*, not generated content.

Your agent's own model drafts the JSON. I never call an LLM.

→ model-agnostic, no API key, no cost, no rate limits.

9/ Honest about the edges: rigid flowcharts? Mermaid-to-Excalidraw does that better, and I'm wiring it in as a fast-path.

The skill earns its keep on the *bespoke argument* diagrams Mermaid can't express.

Open-source, MIT: https://github.com/isatimur/excalidraw-skill-pack

10/ If you draw something with it, show me. Or DM your worst diagram and I'll send back what the skill does with it.

(Or just star the repo — that's the signal that diagram quality matters.)

🙏
