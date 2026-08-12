# Process

**Best for:** multi-step workflows, ETL stages, pipelines.

## Layout conventions
Strict left→right transforms with concrete artifacts per stage. Accent the judgment stage.

## Excalidraw pattern
Skeleton rectangles chained by arrows; free handoff labels; optional DQ quarantine branch.

## Connectors & routing
One arrow per handoff; orthogonal drop for failure paths.

## Anti-patterns
Checklist steps redrawn as bare verbs with no artifact.

## Budget
≤7 stages.

## Example
- Fixture: [`packages/shared/fixtures/types/process/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/process/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/process.png)
