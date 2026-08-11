# Architecture

**Best for:** system overviews, integration maps, infra topology, trust boundaries.

## Layout conventions
Group by tier or trust boundary. Primary flow left→right or top→down. One accent on the integration point or primary store.

## Excalidraw pattern
Draft `excalidraw-skeleton`. Use dashed zone rectangles for VPC/trust regions. Rectangles for deployable components. Arrows with orthogonal `points` only.

## Connectors & routing
Draw arrows before boxes when possible. Solid for data; dashed (theme connector stroke) for control. Bridge the less important arrow at crossings.

## Anti-patterns
Microservice wallpaper, unnamed arrows, equal-size boxes all in accent.

## Budget
5–9 primary components; one evidence card per critical boundary.

## Example
- Fixture: [`packages/shared/fixtures/types/architecture/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/architecture/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/architecture.png)
