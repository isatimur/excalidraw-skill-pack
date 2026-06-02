<!-- Publish T+14 -->

# Mermaid vs diagrams.net vs excalidraw-skill-pack: an honest comparison

Three tools. Three different opinions on what "making a diagram" means. Here's where each wins — and where it doesn't.

## Mermaid

Mermaid is a grammar-constrained text-to-diagram tool. You write structured text in one of a dozen diagram types (flowchart, sequence, ER, Gantt, etc.) and Mermaid renders it.

**Mermaid wins when:**

- You need a specific diagram type with well-defined semantics — sequence diagrams, ER diagrams, state machines. The grammar enforces correctness.
- You want to live inside Markdown. Mermaid blocks render natively in GitHub, Notion, Obsidian, many wikis.
- The diagram is a byproduct, not the point. Flowcharts in READMEs, sequence diagrams in ADRs — Mermaid is frictionless.
- You're writing documentation that needs to be maintained by a team. Everyone knows the grammar; no special tooling required.

**Mermaid loses when:**

- You want visual control. Every Mermaid diagram of the same type looks roughly the same. You can't express brand, editorial tone, or spatial relationships that go beyond its grammar.
- The concept doesn't fit a supported diagram type. Mermaid can't express a layered system map, a concept card, or an argument diagram — those aren't in the grammar.
- You want the diagram to carry a visual argument. Mermaid layouts are determined by the graph topology, not by the meaning you're trying to communicate.

## diagrams.net (draw.io)

diagrams.net is a visual graph editor. You drag shapes onto a canvas, connect them with edges, and style everything manually. It's the most capable of the three for complex custom diagrams.

**diagrams.net wins when:**

- You need full visual control — arbitrary shapes, custom styles, pixel-precise layout.
- The diagram is complex and will be edited many times by different people. The visual editor is learnable and collaborative.
- You're generating diagrams for executive slides or polished technical documentation where the output needs to be publication-quality and hand-tuned.

**diagrams.net loses when:**

- You want to generate diagrams from an AI agent. diagrams.net has no AI-native workflow; you'd have to generate XML and import it, which is fragile.
- You want diagrams in version control as readable text. The XML source is long and noisy; diffs are painful.
- You want consistency across a team. Without a shared style library, every person's diagrams look different.
- You need batch rendering. There's no headless CLI; you render by opening the app.

## excalidraw-skill-pack

excalidraw-skill-pack is a methodology + theme ecosystem for generating Excalidraw diagrams from AI agents. You describe what you want; your agent drafts the Excalidraw JSON using the methodology; the renderer exports PNG.

**excalidraw-skill-pack wins when:**

- You want AI-native diagram generation. The methodology is what the agent reads — isomorphism test, evidence artifacts, one accent per diagram. The agent produces structured, meaningful JSON rather than random Excalidraw elements.
- You want theming across a team or product. Themes are standalone packages. Publish once; every agent on the team uses the same visual language.
- You want diagrams version-controlled as readable JSON. Excalidraw's format is clean enough to diff; the source is the artifact.
- You want to render in CI or scripts. The dual-language renderer (`npx @excalidraw-skill-pack/render` / `pipx install excalidraw-skill-pack-render`) works headlessly in any pipeline.
- You want diagrams that argue. The methodology teaches the agent to make shapes carry meaning, not just arrange labels.

**excalidraw-skill-pack loses when:**

- You need grammar-constrained diagram types. Sequence diagrams, ER diagrams, Gantt charts — if the type's semantics matter, Mermaid's grammar is better suited.
- You want a GUI editor for manual refinement. Excalidraw has one, but the skill-pack workflow is generate-and-use, not generate-then-tweak.
- You want zero tooling. Mermaid in a Markdown file is truly zero-install; excalidraw-skill-pack needs the installer and (for rendering) Node or Python.

## The honest summary

| | Mermaid | diagrams.net | excalidraw-skill-pack |
|---|---|---|---|
| Grammar-constrained types | Best | No | No |
| Visual editor | No | Best | Excalidraw app |
| AI-native generation | Passable | No | Native |
| Theming / brand | No | Manual | Package-based |
| Version control | Good (text) | Poor (XML) | Good (JSON) |
| Headless rendering | Via mermaid-js | No | Built-in CLI |
| Diagrams-as-arguments | No | With effort | Core methodology |

If your team writes Markdown docs and needs sequence or flow diagrams: use Mermaid.

If you need a complex, polished visual and have time to hand-tune it: use diagrams.net.

If you want your AI agent to generate visually consistent, methodologically grounded diagrams that live in version control alongside your code: use excalidraw-skill-pack.

The three tools aren't competing for the same use case. Most teams need all three at different points.

---

Try excalidraw-skill-pack: `npx @excalidraw-skill-pack/install claude-code`
Gallery of 64 diagrams made with the methodology: https://excalidraw-skill-pack.dev/examples
