# Flowchart

**Best for:** branching decisions, approval paths, error handling.

## Layout conventions
Single dominant direction. Ellipse for start/end, diamond for decisions, rectangle for actions. Side-exit the diamond then drop — never diagonal through air.

## Excalidraw pattern
Prefer skeleton: `ellipse` trigger, `diamond` decision, `rectangle` action. Free text for Yes/No beside the elbows. Dashed Fix→audit retry so reject is a loop, not a dead end. Merge lands in Deploy (canary) so yes has a destination. Stamp fix-path duration and required checks as chips.

## Connectors & routing
Orthogonal arrow paths; never diagonal through nodes.

## Anti-patterns
More than one decision diamond without merge; orphan reject branches that never re-enter; a yes path that ends at Merge with nowhere to ship.

## Budget
≤7 nodes for a single decision story.

## Example
- Fixture: [`packages/shared/fixtures/types/flowchart/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/flowchart/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/flowchart.png)
