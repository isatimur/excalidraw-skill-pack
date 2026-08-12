# Line chart

**Best for:** trends over time, KPI movement.

## Layout conventions
Axes plus two muted gridlines carrying units. Dots on each reading, and the last value called out beside the endpoint. Mark the event that caused the change.

## Excalidraw pattern
Series as an open `line` polyline (last point must not return to the first, or it fills); axes and gridlines as thin `line` elements; SLA dashed threshold; alert band under SLA so the page fires before the contract breaks; thick safe-band stroke after the rewrite so hold is visible; vertical event marker; dashed prior-year series so the event isn't confused with seasonality.

## Connectors & routing
Time left→right. Series may diagonal; axes and markers stay orthogonal.

## Anti-patterns
Exact data points without source; a trend with no scale or event — mood, not an argument; claiming a rewrite win without a prior-year control; an alert threshold that equals the SLA; under-SLA wins with no safe-band mark.

## Budget
1–2 series.

## Example
- Fixture: [`packages/shared/fixtures/types/line/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/line/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/line.png)
