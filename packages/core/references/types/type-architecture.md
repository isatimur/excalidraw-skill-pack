# Architecture

**Best for:** system overviews, integration maps, infra topology, trust boundaries.

## Layout conventions
Group by tier or trust boundary. Primary flow left→right. One accent on the primary store. Put at least one actor outside the zone so the boundary excludes something.

## Excalidraw pattern
Draft `excalidraw-skeleton`. Dashed zone for VPC/trust; free zone label at top-left. Rectangles for deployable components. Free text for edge labels above shafts.

## Connectors & routing
Orthogonal `points` only. Solid for data; dashed for control. Bridge the less important arrow at crossings.

## Anti-patterns
Microservice wallpaper, unnamed arrows, a zone that contains everything, bound labels jammed onto short shafts.

## Budget
5–9 primary components; one evidence card per critical boundary.

## Example
- Fixture: [`packages/shared/fixtures/types/architecture/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/architecture/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/architecture.png)
