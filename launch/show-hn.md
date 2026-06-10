# Show HN: Diagrams that argue, not boxes that label — an Excalidraw skill for AI agents

I wrote a technical book (*From Copilot to Colleague*) and needed real diagrams — not the boxes-and-arrows an LLM spits out when you say "draw the architecture." So I built a Claude Code skill that teaches the agent a *methodology* instead of just "emit valid Excalidraw JSON." It ended up drawing **77 diagrams** for the book — argument spines, chapter openers, concept figures, inline explainers — all rendered from JSON, all version-controlled alongside the manuscript.

The methodology is the whole point. It encodes editorial judgment as rules the agent reads before it draws:

- **Isomorphism test** — if you deleted every label, would the *structure alone* still carry the idea? If not, redesign.
- **Evidence artifacts** — real API names, actual JSON payloads, concrete formats. Never "Service A → Database."
- **Multi-zoom** — summary flow + labeled regions + detail-inside-sections, like a map that shows borders *and* street names.
- **Container discipline** — most things should be free-floating text, not boxed. One accent color per diagram, ever.
- **Render-view-fix loop** — it renders to PNG, *looks at the image*, and fixes overlaps/clipping/bad routing before it stops.

### "Why not just use Excalidraw's official MCP?"

Fair question — it shipped recently and it's good. But it (and every community MCP I tried) solves **plumbing**: get an agent to produce valid JSON and render a canvas. That's a commodity now; there are a dozen of them. None of them decide *what* to draw or *why*. You still get correct boxes-and-arrows.

This is the layer above that: the taste. It's why the [book gallery](https://github.com/isatimur/excalidraw-skill-pack/tree/main/examples/book) looks the way it does and a generic prompt-to-diagram tool doesn't. You can even run it *alongside* the official MCP — keep their canvas, add this methodology.

### What it is, mechanically

- **Universal install** — Claude Code, Cursor, GitHub Copilot, Codex, Gemini CLI, or any MCP agent. One command each.
- **The MCP server returns *methodology*, not generated content.** Your agent's own model drafts the JSON using the spec + active theme spliced into its prompt. So it's model-agnostic, needs no API key, and costs me nothing to run.
- **Theme ecosystem** — each theme is a standalone npm + PyPI package (`@excalidraw-skill-pack/theme-stripe-press`, etc.). `npx @excalidraw-skill-pack/create-theme my-brand` scaffolds one in 3 minutes; nobody has to PR the main repo.
- **Dual renderer** — Node (`npx @excalidraw-skill-pack/render`) and Python (`pipx install excalidraw-skill-pack-render`) for CI/batch.

Install: `npx @excalidraw-skill-pack/install claude-code`
Site: https://excalidraw-skill-pack.vercel.app
Gallery: https://github.com/isatimur/excalidraw-skill-pack/tree/main/examples/book
Code (MIT): https://github.com/isatimur/excalidraw-skill-pack

Happy to talk about the methodology, the model-agnostic design, or where it still falls short — the honest answer is that rigid flowcharts are better served by Mermaid-to-Excalidraw (which I'm adding as a fast-path); the skill's real value is the bespoke *argument* diagrams Mermaid can't express.
