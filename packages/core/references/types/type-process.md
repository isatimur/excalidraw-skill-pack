# Process

**Best for:** multi-step workflows, ETL stages, pipelines.

## Layout conventions
Strict left→right transforms with concrete artifacts per stage. Accent the judgment stage.

## Excalidraw pattern
Skeleton rectangles chained by arrows; free handoff labels; DQ quarantine with dashed fix→retry back into the judgment stage.

## Connectors & routing
One arrow per handoff; orthogonal drop for failure; dashed re-entry so quarantine is not a dump.

## Anti-patterns
Checklist steps redrawn as bare verbs with no artifact; a quarantine that never returns.

## Budget
≤7 stages.

## Example
- Fixture: [`packages/shared/fixtures/types/process/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/process/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/process.png)
