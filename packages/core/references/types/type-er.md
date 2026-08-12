# ER / data model

**Best for:** entities, relationships, cardinality.

## Layout conventions
Entities as rectangles with key fields in bound labels. Crow's-foot marks on the N side; free `1:N` labels above the shaft.

## Excalidraw pattern
Skeleton rectangles; `endArrowhead: null` so tips never paint over the feet.

## Connectors & routing
Minimize crossing; stack related entities.

## Anti-patterns
Full field lists when a table would be faster; default arrowheads covering crow's feet.

## Budget
≤6 entities.

## Example
- Fixture: [`packages/shared/fixtures/types/er/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/er/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/er.png)
