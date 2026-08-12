# State machine

**Best for:** allowed modes, lifecycle, workflow status.

## Layout conventions
States as rectangles; transitions labeled with the event. Entry dot into the first state. Highlight terminal/live with theme success fill.

## Excalidraw pattern
Skeleton rectangles + free labels on transitions. Rejection is an orthogonal under-loop, not a diagonal.

## Connectors & routing
Prefer left→right progression; ban illegal shortcuts in a caption.

## Anti-patterns
States without incoming or outgoing edges unless truly terminal; Draft→Live without Review.

## Budget
≤7 states.

## Example
- Fixture: [`packages/shared/fixtures/types/state/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/state/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/state.png)
