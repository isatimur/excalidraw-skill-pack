# Sequence

**Best for:** messages over time, protocol flows, OAuth handshakes.

## Layout conventions
Participants as top-row boxes; time flows downward. Group related messages.

## Excalidraw pattern
Skeleton rectangles for lifelines. Free-floating text for message labels placed between participants.

## Connectors & routing
Horizontal arrows for requests; return messages offset vertically.

## Anti-patterns
Mixing architecture boxes with sequence timing.

## Budget
≤5 participants; ≤12 messages per diagram.

## Example
- Fixture: [`packages/shared/fixtures/types/sequence/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/sequence/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/sequence.png)
