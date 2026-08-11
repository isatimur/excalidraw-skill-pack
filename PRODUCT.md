# excalidraw-skill-pack — product truth

Assumptions labeled where inferred from repo artifacts and operator brief (not user interview).

## What it is

Open-source **diagram-quality layer** for AI agents: an opinionated Excalidraw methodology, publishable theme packages, dual-language PNG renderers, and an MCP server. Output is editable `.excalidraw` JSON that opens in Excalidraw, Obsidian, and VS Code — not static HTML+SVG exports.

## Primary user

Engineers and technical writers who use AI agents (Claude Code, Cursor, Copilot, Codex, Gemini CLI, any MCP client) to produce **figures that teach** — architecture, flows, sequences, evidence diagrams — and need them to survive editing, theming, and publication.

## Job to be done

Turn “draw me a diagram” into a **visual argument** with hierarchy, direction, and proof — then **render → inspect → fix** until the PNG looks right.

## Mechanism (differentiators vs HTML diagram skills)

| Capability | Why it matters |
|---|---|
| Editable Excalidraw artifact | Diagrams stay living; themes and edits apply |
| 29 progressive type references | Agents load only the grammar they need |
| Taste gate + `audit_diagram` | Self-enforcing budget, geometry, anti-slop |
| Theme packages (npm/PyPI) | Brand is publishable, not a one-off style file |
| MCP + multi-agent install | Works beyond a single Claude Code skill |
| Dual renderer parity | Node + Python golden-fixture PNG |
| Evidence + Comparison types | Moat types for proof and contrast diagrams |

## Proof (verified in repo)

- **77 figures** for published book *From Copilot to Colleague* (marketing claim; curated sources in `examples/book/`)
- Competitive fixture: `packages/shared/fixtures/competitive/why-editable-beats-static.excalidraw`
- Per-type gallery fixtures under `packages/shared/fixtures/types/` (Round B)

## Constraints for future work

- Do not invent star counts, customer logos, or benchmarks not in repo
- Competitor comparisons must stay honest (`web/vs-diagram-design/`)
- Public claims must trace to fixtures, book corpus, or package capabilities

## Platform

Web marketing site (`web/`), Mintlify docs (`docs/site/`), npm + PyPI packages, GitHub-first distribution.

## Voice

Direct, technical, anti-slop. Diagrams argue; copy names what the reader controls (install, theme, render, audit).
