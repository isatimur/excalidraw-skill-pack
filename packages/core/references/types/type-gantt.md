# Gantt

**Best for:** phases, parallel workstreams, delivery windows.

## Layout conventions
Time on X; stacked bars for phases. Offset bars to show overlap. Mark today with an accent vertical rule. Owner labels left of each bar.

## Excalidraw pattern
Rectangles as bars with concrete deliverables; free-floating owner + period labels; dashed week gridlines; % complete above each bar (never on the fill); today accent rule; burn vs remaining days and a go-live milestone tick.

## Connectors & routing
Align bar baselines to a shared timeline row.

## Anti-patterns
Sub-day precision when a calendar suffices; no now-line, which shows the plan but never whether it holds; % labels overlapping bar fills; progress % with no burn/remaining.

## Budget
≤6 bars.

## Example
- Fixture: [`packages/shared/fixtures/types/gantt/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/gantt/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/gantt.png)
