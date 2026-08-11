# ER / data model

**Best for:** entities, relationships, cardinality.

## Layout conventions
Entities as rectangles with key fields in bound labels. Relationships as labeled arrows.

## Excalidraw pattern
Skeleton rectangles; cardinality on arrow labels (`1:N`, `N:M`).

## Connectors & routing
Minimize crossing; stack related entities.

## Anti-patterns
Full field lists when a table would be faster.

## Budget
≤6 entities.

## Example
- Fixture: [`packages/shared/fixtures/types/er/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/er/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/er.png)
