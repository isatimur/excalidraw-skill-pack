# layered-stack

A vertical stack of N labeled layers, optionally with arrows showing data flow between them. Use for system architectures, abstraction layers, dependency hierarchies.

## Structure

- N rectangles stacked vertically, same width, varying heights ok.
- Each layer label is left-aligned inside.
- Optional right column: 1-2 evidence artifacts per layer (e.g., the actual library name).
- Optional arrows down/up the right edge showing call/response flow.

## Constraints

- 3-7 layers. The bottom layer is usually infrastructure; the top is user-facing.
- Layer order encodes dependency: top depends on bottom.
- Each layer label is 1-3 words, possibly with a parenthetical tech name.

## Anti-patterns

- Hidden ordering (alphabetical instead of dependency).
- Layers that overlap or merge.
- Evidence artifacts that are unrelated to the layer they sit beside.
