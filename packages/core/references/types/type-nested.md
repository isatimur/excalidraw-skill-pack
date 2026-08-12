# Nested

**Best for:** containment hierarchy, scope boundaries.

## Layout conventions
Outer zone contains inner zones/components. Free zone labels at top-left. Put an actor outside the outer zone.

## Excalidraw pattern
Dashed zone rectangles; leaf components as solid rectangles inside. Gateway as the edge of the platform; Worker beside Service A; API→Cache hit inside the service.

## Connectors & routing
Arrows only when crossing a boundary matters; free protocol labels above shafts; keep Gateway/API on one row for a pure horizontal route.

## Anti-patterns
Deep nesting >3 levels (split views); a Platform that contains the Client.

## Budget
≤3 containment levels.

## Example
- Fixture: [`packages/shared/fixtures/types/nested/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/nested/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/nested.png)
