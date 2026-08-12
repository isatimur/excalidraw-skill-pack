# Architecture

**Best for:** system overviews, integration maps, infra topology, trust boundaries.

## Layout conventions
Group by tier or trust boundary. Primary flow left→right. One accent on the primary store. Put at least one actor outside the zone so the boundary excludes something.

## Excalidraw pattern
Draft `excalidraw-skeleton`. Dashed zone for VPC/trust; free zone label at top-left. Rectangles for deployable components. Free text for edge labels above shafts. Queue→Worker consume plus Worker→store writeback so the publish story closes. Pin replica lag, consumer group, queue depth, and multi-AZ failover next to the boxes they measure. CDN (or edge) sits outside the VPC as a real box with a miss path into API; stamp TTL on a chip, not only a caption.

## Connectors & routing
Orthogonal `points` only. Solid for data; dashed for control. Bridge the less important arrow at crossings.

## Anti-patterns
Microservice wallpaper, unnamed arrows, a zone that contains everything, bound labels jammed onto short shafts, a Queue with no consumer, a Worker with no ack/UPDATE; SLOs that only live in a footer; a CDN named only in a caption.

## Budget
5–9 primary components; one evidence card per critical boundary.

## Example
- Fixture: [`packages/shared/fixtures/types/architecture/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/architecture/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/architecture.png)
