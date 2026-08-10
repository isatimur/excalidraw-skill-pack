# Flowchart

Use a flowchart for a decision-driven path with meaningful branches. Pull start, decision, success, warning, and error colors from the active theme's `palette.md`.

## Layout
- One reading direction, normally top-to-bottom or left-to-right.
- Put decisions at branch points, labeled on outgoing arrows; merge only when the paths genuinely reconverge.
- Use whitespace and frames for phases. Keep explanatory text free-floating beside the path.

## Excalidraw pattern
- Prefer `excalidraw-skeleton`: ellipse for trigger/end, diamond for decisions, rectangle for actions.
- Bound labels only to these semantic shapes. Route each branch with right-angle `points`.
- Use `roughness: 0`, `opacity: 100`, and 2px primary connectors.

## Avoid
- Diamonds for non-decisions, unlabeled yes/no branches, and arrows crossing boxes.
- Flowcharts for collaboration timing; use sequence or swimlane.

## Budget
3–7 decisions, under 9 primary nodes. Split exception handling into a second frame when it obscures the happy path.
