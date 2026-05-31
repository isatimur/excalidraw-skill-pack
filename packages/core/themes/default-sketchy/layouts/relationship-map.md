# relationship-map

A graph of N entities (nodes) connected by labeled edges. Use for entity-relationship sketches, concept graphs, social/communication networks.

## Structure

- N nodes positioned with care (force-directed or hand-laid; not grid).
- Edges between nodes carry labels (verbs preferred): "publishes to", "consumes from", "owns".
- Optionally cluster nodes by role with a soft background shape.

## Constraints

- ≤12 nodes. Above 12 the map stops teaching; split into sub-maps.
- Every edge label is a verb or prepositional phrase, never a noun.
- Node labels are nouns (entities, not actions).

## Anti-patterns

- Unlabeled edges.
- Crossing edges that could be untangled by re-positioning.
- Trees pretending to be graphs (use `layered-stack` if it's a tree).
