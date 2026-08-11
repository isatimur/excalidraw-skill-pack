# High-level

**Best for:** end-to-end path across one cluster, executive overview.

## Layout conventions
The full path left→right, with the zone drawn around only what you operate. Leave the upstream hops (browser, CDN) outside it.

## Excalidraw pattern
Zone rectangle + 3–7 components; minimal labels.

## Connectors & routing
One primary path; no nested detail.

## Anti-patterns
Low-level protocol annotations; a zone that contains everything, which draws a boundary that excludes nothing.

## Budget
≤7 components inside zone.

## Example
- Fixture: [`packages/shared/fixtures/types/high-level/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/high-level/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/high-level.png)
