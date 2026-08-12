# High-level

**Best for:** end-to-end path across one cluster, executive overview.

## Layout conventions
The full path left→right, with the zone drawn around only what you operate. Leave the upstream hops (browser, CDN) outside it.

## Excalidraw pattern
Zone rectangle + 3–7 components; free protocol labels above shafts.

## Connectors & routing
Primary path horizontal; fan to datastores via orthogonal elbows, never diagonal spokes.

## Anti-patterns
A zone that contains everything; diagonal App→DB/Redis spokes.

## Budget
≤7 components inside zone.

## Example
- Fixture: [`packages/shared/fixtures/types/high-level/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/high-level/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/high-level.png)
