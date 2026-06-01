# Product Hunt — excalidraw-skill-pack

**Tagline:** Make your AI agent argue visually.

**Description:**

A universal skill pack that teaches Claude / Cursor / Codex / Gemini how to draft Excalidraw diagrams that pass the isomorphism test (the shape IS the meaning). Ships with 5 themes, a renderer in both Node + Python, an MCP server with 5 tools, and a one-command installer per agent. The proof: 64 diagrams in a published book were generated with this methodology.

**First comment (maker comment):**

I'm Timur. I wrote a book about modern AI engineering (*From Copilot to Colleague*) and needed to render dozens of diagrams without manually opening Excalidraw 64 times. I built a Claude Code skill that does it from JSON — but then realized every AI-agent platform deserves the same skill, plus a way for anyone to author their own brand theme. So I extracted the skill, made it polyglot (npm + PyPI), added an MCP server, and split themes into standalone packages.

The interesting design call: the MCP server returns *methodology*, not generated content. Your agent's own model does the drafting. That keeps it model-agnostic (works with Claude, GPT, Gemini equally) and we don't pay for any inference.

Try it: `npx @excalidraw-skill-pack/install claude-code` or `npx @excalidraw-skill-pack/mcp-server`. Tell it what you want diagrammed. Done.

**Galleries / images:**
- Hero demo GIF (15s)
- 5-theme grid
- 4 sample diagrams from the book
