# Layer stack

**Best for:** stacked abstractions, OSI-style tiers.

## Layout conventions
Wide horizontal bands, top = highest abstraction. Keep every band the same width; tapering them reads as a pyramid. Name modules inside each band.

## Excalidraw pattern
Equal-width stacked rectangles, one accent band for the layer under discussion. Draw the bad upward import as a dashed shaft into Domain; CI FAIL chip when boundary lint trips.

## Connectors & routing
Downward `depends on` arrow; dashed forbidden upward call on the other side.

## Anti-patterns
More than 5 layers in one figure; a stack with no direction, which claims nothing; an upward ban that is only a caption with no shaft.

## Budget
3–5 layers.

## Example
- Fixture: [`packages/shared/fixtures/types/layers/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/layers/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/layers.png)
