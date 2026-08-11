# Contract: excalidraw-skill-pack #1 campaign (Round A)

**Approved**: operator verbal "merge into main and continue make our excalidraw solution top 1" (2026-08-10)
**Stakes**: public (site + npm/GitHub product)
**Budget**: 1 session slice; circuit-break after 3 similar refine cycles
**Safe execution**: unit tests + local render; no registry submissions without operator OK

## Done when

1. PR #23 merged to `main` (typed taste loop + vs-diagram-design site).
2. Geometry-aware `audit_diagram` detects AABB overlap, off-canvas elements, and text overflow vs container; tests cover injected defects + known-good fixtures.
3. `render_diagram` returns audit issues alongside PNG (self-enforcing taste surface).
4. `/gallery` page live with competitive showcase + book proof links; sitemap + homepage CTA updated.
5. `web/llms.txt` shipped for GEO discovery.
6. Ship-gate PASS or REVISE recorded before any new public claim beyond what's already on the comparison pages.

## Out of scope (this round)

- Show HN / LinkedIn post publishing (needs operator voice)
- Registry submissions (skills.sh etc.) without operator approval
- Hosted render endpoint / Chromium-free path (spike next round)

## Builder uncertainties

- AABB checks may false-positive on intentional overlaps (clouds, evidence cards near shapes) — tune with fixtures.
- Gallery without many pre-rendered book PNGs on web/ may be thin; link to examples/book + competitive PNG as minimum.

## Acceptance checks

- `pnpm --filter @excalidraw-skill-pack/mcp-server test` green
- Injected-overlap fixture → warning; clean competitive skeleton → no geometry errors
- `/gallery` and `llms.txt` present in repo and sitemap
