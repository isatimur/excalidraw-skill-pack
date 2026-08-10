# DP Security Matrix

Use when the claim is who can do what to which data-platform component. Prefer a spatial matrix over a prose ACL dump. Colors from active theme `palette.md`.

## Layout
- Rows = roles (or principals). Columns = components / data tiers.
- Cell treatment encodes permission: allow (success colors), deny (error/warning), conditional (decision), absent (muted).
- Free-floating axis labels; hairline grid via `line` elements. One focal cell callout if a surprising grant/deny is the point.

## Excalidraw pattern
- Skeleton rectangles for cells; do not put every cell label in a heavy container — typography can carry allow/deny.
- Legend as a bottom strip of free-floating text + small swatches, outside the matrix.
- If more than ~8×6 cells, split by domain (overview matrix + detail matrix).

## Avoid
- Rainbow encoding without a legend; identical green checkmarks that hide nuance; floating legend inside the grid.

## Budget
Max ~12 roles × 8 components for a single view; 1 focal callout.
