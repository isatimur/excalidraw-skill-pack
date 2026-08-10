# High-Level Stack

Use when the claim is an end-to-end platform or product stack on a cluster — not a detailed architecture of every box. Pull colors from the active theme's `palette.md`.

## Layout
- One horizontal or vertical spine: ingress → control plane → data plane → storage → consumers.
- Frames mark trust or ownership zones (cluster, VPC, team). Keep 1–2 focal nodes for the integration hinge.
- Free-floating eyebrow labels name zones; avoid a card grid of equal services.

## Excalidraw pattern
- Prefer `excalidraw-skeleton` with frames as zones.
- Orthogonal arrows for the primary path; dashed governance connectors use the theme's AI/governance stroke (see palette connectors), not an invented purple.
- Technical ports and service names as free-floating mono-style detail under nodes when needed.

## Avoid
- Listing every microservice at equal weight; drowning the spine in decorative icons.

## Budget
5–9 primary nodes; max 3 zones; one focal accent.
