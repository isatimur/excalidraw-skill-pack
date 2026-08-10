# Anti-Patterns

Avoid these common AI-generated diagram failures.

| Anti-pattern | Why it fails | Fix |
| --- | --- | --- |
| Uniform equal boxes or card grids | Replaces the argument with a generic inventory. | Use a pattern that mirrors the relationship; vary scale and use containers only where they carry meaning. |
| Dark mode with purple/cyan glow | Looks like a generic AI dashboard and usually ignores the selected brand. | Use the active theme palette, opaque fills, and hierarchy through scale and whitespace. |
| Accent on everything | Nothing remains important when everything competes. | Reserve theme accents for one or two focal elements. |
| Every text item in a container | Adds visual noise and hides typographic hierarchy. | Default to free-floating text; box only distinct entities, groups, or arrow targets. |
| Floating legend in the diagram area | Forces the viewer to decode instead of read the diagram. | Make color and shape usage self-explanatory; put unavoidable notes outside the visual flow. |
| Diagonal arrows through boxes | Breaks reading order and obscures content. | Reposition elements or route arrows with orthogonal waypoints around shapes. |
| Overlapping connectors with no routing | Makes relationships ambiguous. | Separate flows, add spacing, or route connectors deliberately. |
| Shadow or transparency used for hierarchy | Reduces clarity and does not survive all exports well. | Use `opacity: 100`; establish hierarchy through color, scale, stroke weight, and whitespace. |
| Generic “Input / Process / Output” with no evidence | Labels a system without explaining it. | Show real sources, transformations, events, payloads, APIs, or outputs. |
| Mermaid-slop when a visual argument is needed | Auto-layout produces a rigid graph where composition and evidence matter. | Use skeleton or full Excalidraw elements with deliberate layout and visual patterns. |
| Invented colors outside the theme palette | Breaks brand consistency and creates arbitrary meaning. | Read the active theme’s `palette.md` and use its semantic roles only. |
| Opacity below 100 | Creates muddy contrast and false hierarchy. | Set `opacity: 100` on every element. |
| Text overflow or clipped labels | Makes the export look unfinished and can hide meaning. | Size containers from rendered text and verify the PNG. |
| Bidirectional arrows when one direction is enough | Implies reciprocity or feedback that may not exist. | Use a single directed arrow; add a return arrow only for a real reverse flow. |
