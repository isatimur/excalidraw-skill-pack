# Product Hunt — excalidraw-skill-pack

**Tagline:** Diagrams that argue, not boxes that label.

**Description:**

The diagram-*quality* layer for AI agents. Most Excalidraw generators — including Excalidraw's own official MCP — solve plumbing: emit valid JSON, render a canvas. This one ships the *methodology*: the isomorphism test (the shape IS the meaning), evidence artifacts (real API names, actual data, never placeholders), multi-zoom architecture, and a render-view-fix loop where the agent looks at the PNG and fixes itself. Works in Claude Code, Cursor, GitHub Copilot, Codex, Gemini CLI, and any MCP agent. 5 publishable themes, a Node + Python renderer, model-agnostic by design. The proof: 77 diagrams in a published technical book were drawn with it.

**First comment (maker comment):**

I'm Timur. I wrote a book about modern AI engineering (*From Copilot to Colleague*) and needed real diagrams — not the boxes-and-arrows you get when you tell an LLM "draw the architecture." So I built a Claude Code skill that teaches the agent a *methodology* instead of just "make valid Excalidraw JSON." It drew 77 diagrams for the book, all from JSON, all in version control next to the manuscript.

People kept asking "is this just another Excalidraw MCP?" — so let me answer it up front. The official one (and the community ones) are great at plumbing. None of them decide what to draw or why; you still get a labeled grid. This is the layer above: taste, encoded as rules the agent reads before it draws. You can even run it *alongside* the official MCP.

One design call I like: the MCP server returns methodology, not generated content. Your agent's own model does the drafting — so it's model-agnostic (Claude, GPT, Gemini all work), needs no API key, and costs me nothing to run.

Try it: `npx @excalidraw-skill-pack/install claude-code` (or `copilot`, `cursor`, `codex`, `gemini-cli`), then tell it what to diagram. MIT.

**Galleries / images:**
- Hero demo GIF (15s)
- 5-theme grid
- 4 sample diagrams from the book (before/after vs. a generic prompt-to-diagram tool)
