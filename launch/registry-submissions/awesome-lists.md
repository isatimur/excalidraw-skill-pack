# Awesome-list submissions

Open PRs against each list. The positioning to hold across all of them: this is the **diagram-quality / methodology layer**, not another prompt-to-Excalidraw plumbing MCP. Where a list already has the official `excalidraw-mcp`, that's fine — the one-liner makes clear this is a different category (taste vs. plumbing).

---

## 1. awesome-mcp-servers

**Repo:** https://github.com/punkpeye/awesome-mcp-servers (verify the canonical/most-starred awesome-mcp-servers at submission time)

**PR title:** `Add excalidraw-skill-pack — opinionated Excalidraw diagram methodology MCP`

**Entry** (place under 🎨 Art & Culture / Diagrams, or Developer Tools / Diagrams — match the list's existing taxonomy; create a Diagrams subcategory only if none fits):

```
- [isatimur/excalidraw-skill-pack](https://github.com/isatimur/excalidraw-skill-pack) 📇 ☁️ - Diagrams that argue, not boxes that label. An opinionated Excalidraw *methodology* (isomorphism test, evidence artifacts, multi-zoom, container discipline) + a render-view-fix loop, exposed as an MCP server. Model-agnostic (the server ships methodology, your agent's model drafts the JSON). 5 publishable themes; dual Node/Python renderer. Proven on a 77-diagram published book.
```

**Note on duplicates:** the official `excalidraw/excalidraw-mcp` may already be listed. Do **not** treat this as a duplicate — it's a different category (quality layer, not canvas plumbing). The entry text above states the distinction explicitly so a maintainer can see it's additive.

**Checklist before submitting:**
- [ ] Confirm the canonical awesome-mcp-servers repo (most-starred / actively merged)
- [ ] Read the list's category legend; match the emoji/tags convention (📇 stdio, ☁️ cloud, etc.)
- [ ] Confirm `npx @excalidraw-skill-pack/mcp-server` installs cleanly
- [ ] Confirm the homepage + gallery links are live
- [ ] One entry, alphabetical placement, no marketing fluff (maintainers reject hype)

---

## 2. awesome-claude-code (skills)

**Repo:** https://github.com/hesreallyhim/awesome-claude-code (verify canonical at submission time; the skills section may be a separate list)

**PR title:** `Add excalidraw-skill-pack — Excalidraw diagram skill`

**Entry** (Productivity / Diagrams, or the Skills section):

```
- [excalidraw-skill-pack](https://github.com/isatimur/excalidraw-skill-pack) — Teaches Claude an Excalidraw *methodology* (the shape IS the meaning): isomorphism test, evidence artifacts, multi-zoom, render-view-fix loop. 5 themes, anyone can publish a brand theme. MCP server + dual-language renderer. Drew 77 diagrams for a published book. `npx @excalidraw-skill-pack/install claude-code`
```

**Checklist before submitting:**
- [ ] Verify the canonical awesome-claude-code list URL
- [ ] Check for an existing entry (no duplicate)
- [ ] Confirm the one-line install works on a clean machine
- [ ] Match the list's formatting exactly

---

## 3. MCP registries (directory listings, not PRs)

These are form/registry submissions rather than awesome-list PRs. Same positioning. Submit at:

- **mcp.so** — https://mcp.so/submit
- **mcpservers.org** — https://mcpservers.org (PR to its repo)
- **Glama** — see `glama.md`
- **Smithery** — see `smithery.md`

**Registry blurb (reuse verbatim):**

> excalidraw-skill-pack — the diagram-quality layer for AI agents. Most Excalidraw MCPs solve plumbing (emit JSON, render a canvas). This one ships the *methodology* — isomorphism test, evidence artifacts, multi-zoom, container discipline — so the output is a visual argument, not a labeled grid. Model-agnostic, 5 publishable themes, dual Node/Python renderer. Proven on a 77-diagram published technical book. MIT.

**Tags:** `diagrams` `excalidraw` `visualization` `mcp` `themes` `architecture-diagrams`
