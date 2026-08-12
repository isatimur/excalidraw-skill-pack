# Swimlane

**Best for:** cross-functional handoffs, RACI flows.

## Layout conventions
Horizontal lanes per role/team. Steps flow left→right within and across lanes.

## Excalidraw pattern
Dashed zone rectangles for lanes. Steps as rectangles; handoff arrows cross lane boundaries orthogonally. Dashed Test→Implement fail loop so red is a re-entry, not a dead end. Stage minutes + retry cap make the SLA auditable.

## Connectors & routing
Enter/exit lanes at lane centerlines.

## Anti-patterns
More than 4 lanes (split diagrams); a Test step that never returns on failure; an Eng SLA with no stage minutes.

## Budget
≤6 steps per lane.

## Example
- Fixture: [`packages/shared/fixtures/types/swimlane/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/swimlane/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/swimlane.png)
