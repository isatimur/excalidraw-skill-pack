# Evidence Pipeline / Protocol Explainer

Use this type for a technical claim that must be inspectable, not merely plausible. It is an Excalidraw-native multi-zoom argument: overview flow, framed sections, then concrete artifacts. Pull every color from the active theme's `palette.md`, including dark evidence-card colors.

## Layout
- Overview: a 3–6 stage flow establishes the protocol’s causal story.
- Mid-zoom: frames separate producer, transport, consumer, validation, or failure domains.
- Detail: place a real artifact beside the transition it proves—code, JSON, command output, schema, event name, or UI state.

## Excalidraw pattern
- Draft `excalidraw-skeleton`; use frames as zones and bound labels only for actual endpoints.
- Route data arrows with orthogonal `points`; use dashed governance/control connectors from the theme's connector table (not an invented purple).
- Evidence cards use the theme's evidence-artifact colors (card background, stroke, plain code, path, JSON, before/after).
- Render, inspect, and iterate in Excalidraw. The editable canvas is part of the proof workflow, not a static HTML illustration.

## Avoid
- Generic “event payload” placeholders, artifacts disconnected from claims, and screenshot-only evidence that cannot be read.

## Budget
3–6 overview stages; 1–2 artifacts per critical section; build comprehensive diagrams section-by-section.
