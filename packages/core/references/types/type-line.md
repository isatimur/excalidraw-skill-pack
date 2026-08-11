# Line chart

**Best for:** trends over time, KPI movement.

## Layout conventions
Axes plus two muted gridlines carrying units. Dots on each reading, and the last value called out beside the endpoint.

## Excalidraw pattern
Series as an open `line` polyline (last point must not return to the first, or it fills); axes and gridlines as thin `line` elements.

## Connectors & routing
Time left→right.

## Anti-patterns
Exact data points without source; a trend with no scale, which shows the shape but not the size.

## Budget
1–2 series.

## Example
- Fixture: [`packages/shared/fixtures/types/line/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/line/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/line.png)
