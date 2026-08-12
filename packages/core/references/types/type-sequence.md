# Sequence

**Best for:** messages over time, protocol flows, OAuth handshakes.

## Layout conventions
Participants as top-row boxes; time flows downward. Group related messages.

## Excalidraw pattern
Skeleton rectangles for lifelines. Free-floating text for message labels placed ABOVE the shaft — bound labels collide at Cascadia width. Time ticks (t0…) beside the stack; per-hop ms on the right so the e2e budget is additive, not vibes. A cache-miss return (dashed, accent) before the write makes the path an argument; caption the warm-hit budget separately.

## Connectors & routing
Horizontal arrows for requests; return messages offset vertically and dashed.

## Anti-patterns
Mixing architecture boxes with sequence timing; a four-message wallpaper with no miss/fail branch; no time axis; a 250ms budget with no hop times.

## Budget
≤5 participants; ≤12 messages per diagram.

## Example
- Fixture: [`packages/shared/fixtures/types/sequence/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/sequence/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/sequence.png)
