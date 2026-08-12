# DP security matrix

**Best for:** role × dataset permissions.

## Layout conventions
Grid as labeled rows; columns as datasets. Use table if >4×4.

## Excalidraw pattern
Wide rectangles per cell; white=read, orange=write, red=deny. Include a least-privilege row (Intern) and a secrets column so deny-by-default is visible, not captioned.

## Connectors & routing
N/A

## Anti-patterns
Redrawing a spreadsheet with 20 columns; a matrix with only read/write and no deny cells.

## Budget
≤6 roles × 4 datasets.

## Example
- Fixture: [`packages/shared/fixtures/types/dp-security-matrix/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/dp-security-matrix/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/dp-security-matrix.png)
