# Flowchart

**Best for:** branching decisions, approval paths, error handling.

## Layout conventions
Single dominant direction. Ellipse for start/end, diamond for decisions, rectangle for actions.

## Excalidraw pattern
Prefer skeleton: `ellipse` trigger, `diamond` decision, `rectangle` action. Label edges with the condition that fires.

## Connectors & routing
Orthogonal arrow paths; never diagonal through nodes.

## Anti-patterns
More than one decision diamond without merge; orphan branches.

## Budget
≤7 nodes for a single decision story.

## Example
- Fixture: [`packages/shared/fixtures/types/flowchart/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/flowchart/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/flowchart.png)
