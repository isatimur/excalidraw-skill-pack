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

- [ ] **Ship the metadata release.** Merge the discoverability PR, then let the Changesets
      "Version Packages" PR merge so npm republishes with the new `keywords`/`repository`/
      `homepage`. Confirm with `npm view @excalidraw-skill-pack/core keywords`. *(npm/PyPI
      search must work before launch or the launch traffic finds nothing.)*
- [ ] **Bump + tag PyPI packages** so the new classifiers/urls ship (tag-triggered
      `publish-pypi` workflow). Run `pnpm sync-versions` if npm/PyPI versions drift.
- [ ] **Test the plugin locally** (see verification below). It must install cleanly from a
      fresh clone before you advertise `/plugin marketplace add`.
- [ ] **Set `server.json` version** to the latest published `@excalidraw-skill-pack/mcp-server`
      version right before submitting to MCP registries.
- [ ] **Upload the GitHub social preview**: repo → Settings → Social preview →
      `docs/site/images/hero.png`. *(Can't be scripted.)*
- [ ] **Produce the 3 missing visual assets** (blockers for Product Hunt):
      hero GIF (agent → JSON → render loop), the 5-theme grid, a before/after
      (labeled-boxes vs. arguing diagram).

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

Open these once the metadata release is live. The **awesome-list PRs are the highest-value
items** — they compound (evergreen discovery). Lead each with the book proof.

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
