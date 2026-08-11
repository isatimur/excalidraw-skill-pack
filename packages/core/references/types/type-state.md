# State machine

**Best for:** allowed modes, lifecycle, workflow status.

## Layout conventions
States as rectangles; transitions labeled with the event. Highlight terminal/live states with theme success fill.

## Excalidraw pattern
Skeleton rectangles + labeled arrows. No container labels on states unless the state IS a zone.

## Connectors & routing
Prefer left→right progression for readability.

## Anti-patterns
States without incoming or outgoing edges unless truly terminal.

## Budget
≤7 states.

## Example
- Fixture: [`packages/shared/fixtures/types/state/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/state/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/state.png)
