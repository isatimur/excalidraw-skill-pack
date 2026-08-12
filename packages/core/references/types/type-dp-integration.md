# DP integration

**Best for:** sources → lakehouse → consumers.

## Layout conventions
Three-column topology. Accent the core platform.

## Excalidraw pattern
Sources, core, consumers as rectangles; fan-in/fan-out via orthogonal rails.

## Connectors & routing
Shared vertical trunk into/out of the core — never diagonal spokes.

## Anti-patterns
Diagonal fan-in; security matrix detail here (use dp-security-matrix).

## Budget
≤3 sources, ≤3 consumers.

## Example
- Fixture: [`packages/shared/fixtures/types/dp-integration/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/dp-integration/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/dp-integration.png)
