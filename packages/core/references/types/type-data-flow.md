# Data flow

**Best for:** role-scoped pipelines, analytics paths.

## Layout conventions
Stages left→right, cut by dashed scope boxes where one role's reach ends. Accent the stages the role may not touch.

## Excalidraw pattern
Rectangles per stage; solid transform arrows; a dashed rectangle per scope with its label at the top-left edge.

## Connectors & routing
Label stage outputs briefly, and label the arrow that crosses a scope with what changes there (`masked`).

## Anti-patterns
Generic cloud icons without names; naming the role in a caption instead of drawing where it stops.

## Budget
≤6 stages.

## Example
- Fixture: [`packages/shared/fixtures/types/data-flow/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/data-flow/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/data-flow.png)
