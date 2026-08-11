# Layer stack

**Best for:** stacked abstractions, OSI-style tiers.

## Layout conventions
Wide horizontal bands, top = highest abstraction. Keep every band the same width; tapering them reads as a pyramid.

## Excalidraw pattern
Equal-width stacked rectangles, one accent band for the layer under discussion.

## Connectors & routing
One downward dependency arrow beside the stack, and state the rule it enforces (`no upward calls`). Bands alone show order, not direction.

## Anti-patterns
More than 5 layers in one figure; a stack with no direction, which claims nothing.

## Budget
3–5 layers.

## Example
- Fixture: [`packages/shared/fixtures/types/layers/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/layers/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/layers.png)
