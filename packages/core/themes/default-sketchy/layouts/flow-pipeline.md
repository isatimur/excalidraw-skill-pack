# flow-pipeline

A left-to-right sequence of N stages connected by arrows, with optional evidence artifacts hanging off each stage. Use for protocols, data pipelines, methodologies.

## Structure

- N stage boxes in a horizontal row, evenly spaced, same height.
- Arrows between stages: `endArrowhead: "arrow"`, `strokeWidth: 2`.
- Below each stage (optional): an evidence artifact (code snippet, JSON sample, data shape).
- Above each stage (optional): a brief label or quantitative tag.

## Constraints

- 3-7 stages. More than 7 means the diagram is doing too much — split.
- Stage names are short (1-3 words). Verbs preferred ("Redact" beats "Redaction Step").
- Every stage either teaches something concrete (via evidence artifact) or is a single-purpose verb.

## Anti-patterns

- Branching arrows (use `relationship-map` instead).
- Stages of wildly different heights or widths.
- Evidence artifacts that just repeat the stage label.
