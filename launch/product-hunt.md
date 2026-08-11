# Product Hunt — excalidraw-skill-pack

**Tagline:** Diagrams that argue, not boxes that label.

**Description:**

The diagram-*quality* layer for AI agents. Excalidraw's official MCP is a strong MCP App (live canvas, streaming draw, remote host). This pack is the layer beside it: typed layouts, taste gate, audit, publishable themes, and a render-view-fix loop where the agent looks at the PNG and fixes itself. Works in Claude Code, Cursor, GitHub Copilot, Codex, Gemini CLI, and any MCP agent. 5 publishable themes, a Node + Python renderer, model-agnostic by design. The proof: 77 diagrams in a published technical book were drawn with it.

**First comment (maker comment):**

I'm Timur. I wrote a book about modern AI engineering (*From Copilot to Colleague*) and needed real diagrams — not the boxes-and-arrows you get when you tell an LLM "draw the architecture." So I built a Claude Code skill that teaches the agent a *methodology* instead of just "make valid Excalidraw JSON." It drew 77 diagrams for the book, all from JSON, all in version control next to the manuscript.

People kept asking "is this just another Excalidraw MCP?" — so let me answer it up front. The official product is an MCP App: great live canvas in chat. Community emit-JSON servers still exist too. Neither decides what to draw or why the way a taste gate + typed layouts do. This is the quality layer: methodology the agent reads before it draws. You can run it *alongside* the official MCP.

One design call I like: the MCP server returns methodology, not generated content. Your agent's own model does the drafting — so it's model-agnostic (Claude, GPT, Gemini all work), needs no API key, and costs me nothing to run.

Try it: `npx @excalidraw-skill-pack/install claude-code` (or `copilot`, `cursor`, `codex`, `gemini-cli`), then tell it what to diagram. MIT.

**Galleries / images:**
- Hero demo GIF (15s)
- 5-theme grid
- 4 sample diagrams from the book (before/after vs. a generic prompt-to-diagram tool)
