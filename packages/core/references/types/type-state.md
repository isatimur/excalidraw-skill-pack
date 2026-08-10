# State Machine

Use a state machine to establish legal states and transitions, not a chronological to-do list. Choose state, trigger, warning, and error colors from the active theme's `palette.md`.

## Layout
- Place the initial state at the visual entry and terminal states at the edge.
- Group mutually exclusive modes in frames; show transition labels on arrows.
- Add guard conditions as free-floating text near the transition, not inside every state.

## Excalidraw pattern
- Skeleton ellipses or rounded rectangles with bound labels represent states.
- Solid arrows show transitions; dashed arrows show recovery or supervisory control. Use orthogonal points.
- Use evidence cards for a real enum, event name, or transition payload when technical.

## Avoid
- Treating implementation steps as states, multiple start nodes without explanation, and omitted invalid/error paths.

## Budget
4–8 states, 8–12 transitions. Split nested substates into their own frame.
