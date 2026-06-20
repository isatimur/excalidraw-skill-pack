# Launch runbook

The coordination layer for launching `excalidraw-skill-pack`. All the *content* already
exists in this directory; this file sequences it and tracks what's been shipped. Anchor
every public post on the **77-diagram book proof** ([*From Copilot to Colleague*](https://fromcopilottocolleague.com))
— it's the credibility asset no other Excalidraw generator can match.

The repo-side discoverability work (npm/PyPI metadata, `server.json`, the Claude Code
plugin marketplace manifest, GitHub topics, `FUNDING.yml`) is done. What remains needs
your accounts — this runbook makes each step copy-paste.

---

## Pre-flight (do before T+0)

- [x] **Ship the metadata release.** ✅ **Live on npm** (2026-06-20): all 9 packages
      published with `keywords`/`repository`/`homepage` — `core@0.2.1`, `render@0.3.0`
      (batch API), `mcp-server@0.1.3`, `install@0.1.8`, `create-theme@0.1.2`, 4 themes
      (`0.2.1`/`0.2.2`). Verify any time: `npm view @excalidraw-skill-pack/core keywords`.
- [x] **PyPI packages published.** ✅ **Live on PyPI** (2026-06-20): `excalidraw-skill-pack-render@0.2.0`
      (batch API + classifiers/urls) and the 4 themes' first publish at `0.1.0`
      (`-theme-dark/-notion/-whiteboard/-stripe-press`).
- [x] **`server.json` synced** to the published `@excalidraw-skill-pack/mcp-server@0.1.3`. ✅
- [ ] **Test the plugin locally** (see verification below). It must install cleanly from a
      fresh clone before you advertise `/plugin marketplace add`. *(Your action — needs a
      Claude Code session in a scratch dir.)*
- [ ] **Upload the GitHub social preview**: repo → Settings → Social preview →
      `docs/site/images/hero.png`. *(Can't be scripted — GitHub UI.)*
- [ ] **Produce the 3 missing visual assets** (blockers for Product Hunt):
      hero GIF (agent → JSON → render loop), the 5-theme grid, a before/after
      (labeled-boxes vs. arguing diagram).

> **Status (2026-06-20):** All repo-side + publishing pre-flight is done — both registries
> are live and search-indexable, and the release pipeline is fixed/self-healing. The three
> open items above all require your accounts/UI (plugin smoke-test, social-preview upload,
> visual assets). Every submission payload below is copy-paste-ready against the live packages.

---

## Calendar

### T+0 — launch day
- [ ] **Show HN** — paste `show-hn.md` verbatim. Post early-morning US Pacific, weekday.
- [ ] **Product Hunt** — `product-hunt.md` + the visual assets. Schedule for 12:01am PT.
- [ ] **Twitter/X thread** — `twitter-thread.md` (needs hero GIF in tweet 1).
- [ ] **Anchor blog** — publish `blog/01-anchor-how-i-made-77-diagrams.md` (dev.to / Medium / personal site).
- [ ] Cross-link everything: HN post links to the blog; the blog links to the gallery; tweets link to PH.

### T+7
- [ ] **Claude Code tutorial** — publish `blog/02-claude-code-tutorial.md`. Lead with the
      `/plugin marketplace add` path (now the primary install).

### T+14
- [ ] **Cursor tutorial** — publish `blog/03-cursor-tutorial.md`.
- [ ] **Comparison post** — publish `blog/04-comparison-vs-mermaid-vs-diagrams-net.md`.

---

## Submission tracker

The metadata release is **live** (npm + PyPI), so these are ready to open now. The
**awesome-list PRs are the highest-value items** — they compound (evergreen discovery).
Lead each with the book proof. Every payload below installs cleanly against the published
packages (`npx @excalidraw-skill-pack/mcp-server`, `npx @excalidraw-skill-pack/install <agent>`).

| # | Channel | Where | Payload | Type | Status | Date |
|---|---------|-------|---------|------|--------|------|
| 1 | awesome-mcp-servers | github.com/punkpeye/awesome-mcp-servers | `registry-submissions/awesome-lists.md` | PR | ☐ | |
| 2 | awesome-claude-code | github.com/hesreallyhim/awesome-claude-code | `registry-submissions/awesome-lists.md` | PR | ☐ | |
| 3 | Smithery | smithery.ai/server/submit | `registry-submissions/smithery.md` | form | ☐ | |
| 4 | Glama | glama.ai/mcp/servers | `registry-submissions/glama.md` (+ root `Dockerfile`) | form | ☐ | |
| 5 | Cline MCP marketplace | github.com/cline/mcp-marketplace | `registry-submissions/cline.md` | PR | ☐ | |
| 6 | Cursor Directory | cursor.directory | `registry-submissions/cursor-directory.md` | form | ☐ | |
| 7 | MCP official registry | github.com/modelcontextprotocol/registry | root `server.json` | CLI/PR | ☐ | |
| 8 | mcp.so | mcp.so | (auto-indexes from `server.json` / GitHub) | passive | ☐ | |
| 9 | mcpservers.org | mcpservers.org | see `registry-submissions/awesome-lists.md` notes | PR | ☐ | |

Notes:
- The Claude Code **plugin marketplace** needs no external submission — users add it directly
  with `/plugin marketplace add isatimur/excalidraw-skill-pack`. Advertise that string everywhere.
- Glama is backed by the root `Dockerfile`; the others read `server.json` + the repo README.

---

## Verification (plugin install from a fresh clone)

```text
# in a scratch directory, in Claude Code:
/plugin marketplace add /absolute/path/to/excalidraw-skill-pack
/plugin install excalidraw-skill-pack
```

Confirm: the `excalidraw-diagram` skill loads, the `excalidraw-skill-pack` MCP server
registers (5 tools), and one end-to-end diagram renders. Then repeat with the GitHub form:
`/plugin marketplace add isatimur/excalidraw-skill-pack`.
