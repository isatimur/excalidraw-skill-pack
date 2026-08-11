# Nested

**Best for:** containment hierarchy, scope boundaries.

## Layout conventions
Outer zone contains inner zones/components. Labels on zone boundaries.

## Excalidraw pattern
Dashed zone rectangles; leaf components as solid rectangles inside.

## Connectors & routing
No arrows unless crossing boundary matters.

## Anti-patterns
Deep nesting >3 levels (split views).

## Budget
≤3 containment levels.

## Example
- Fixture: [`packages/shared/fixtures/types/nested/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/nested/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/nested.png)
