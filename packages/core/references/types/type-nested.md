# Nested

**Best for:** containment hierarchy, scope boundaries.

## Layout conventions
Outer zone contains inner zones/components. Free zone labels at top-left. Put an actor outside the outer zone.

## Excalidraw pattern
Dashed zone rectangles; leaf components as solid rectangles inside. Gateway as the edge of the platform; Worker beside Service A; API→Cache hit inside the service; Worker warm SET into Cache so the nest isn't a dead end. Name what is excluded (Service B). Miss path exits to Origin outside Service A. Pin TTL, RPS, and hit-rate next to the boxes they measure.

## Connectors & routing
Arrows only when crossing a boundary matters; free protocol labels above shafts; keep Gateway/API on one row for a pure horizontal route.

## Anti-patterns
Deep nesting >3 levels (split views); a Platform that contains the Client; a Worker that never touches Cache; SLAs that only live in a footer caption; miss→origin that is only a caption.

## Budget
≤3 containment levels.

## Example
- Fixture: [`packages/shared/fixtures/types/nested/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/nested/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/nested.png)
