# DP Integration

Use for a data-platform integration topology: sources → core → consumers. The argument is the shape of the topology, not a vendor inventory. Colors from active theme `palette.md`.

## Layout
- Three bands (frames): Sources | Core | Consumers. Primary flow left→right.
- Convergence into the core, fan-out to consumers. Mark the primary store or broker as the single focal accent.
- Show real connector names (Kafka topic, CDC stream, REST sink) as free-floating detail — not generic "API".

## Excalidraw pattern
- Skeleton + frames for bands.
- Orthogonal routing; dashed connectors for optional/async paths using theme connector styles.
- Evidence cards only when proving a specific contract (schema, topic config).

## Avoid
- Logo walls; every source the same size; arrows that skip the core without saying why.

## Budget
Max 9 primary nodes; 3 bands; 1–2 evidence artifacts if the contract is the claim.
