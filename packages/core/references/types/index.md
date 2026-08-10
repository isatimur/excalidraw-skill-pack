# Diagram Type Selection

Use this directory before drawing. All type guidance uses the active theme's `palette.md`; never invent colors.

| Type | Use when the visual claim is | Prefer a table when |
|---|---|---|
| Architecture | components and boundaries | only an inventory is needed |
| Flowchart | branching decisions | rules fit as rows |
| Sequence | messages over time | order has no interaction |
| State / IT state | allowed modes and transitions | states are merely labels |
| ER | data entities and cardinality | fields are the only concern |
| Timeline / Gantt | time is the argument | dates need no spatial relation |
| Swimlane | ownership across a handoff | ownership is a single column |
| Quadrant / Radar / Scatter | relative position matters | values are exact and comparable |
| Loop / Process | recurrence or transformation matters | steps are a checklist |
| Layers / Nested / Medallion | containment or abstraction matters | hierarchy is one simple list |
| Tree / Org chart | branching lineage matters | relationships are tabular |
| Venn / Pyramid | overlap or rank is the argument | memberships/ranks are exact lists |
| Evidence / Comparison | proof or contrast changes the conclusion | prose and a table establish it |
| High-level / DP integration / DP security | platform topology or access is the claim | a table of services or grants is enough |
| Bar / Line | magnitude or trend matters | there are too few values to justify a chart |

## Rules of thumb

- Do not draw when a table answers faster.
- Do not hybridize types: choose the dominant claim, then load that type file before drawing.
- Prefer `excalidraw-skeleton`; use bound labels only for meaningful containers.
- Use frames for zones and lanes. Route arrows with orthogonal `points` waypoints; never cut diagonally through boxes.
- `roughness: 0` for technical diagrams, `1` only for intentional whiteboards; `opacity: 100` always.
- Default to free-floating text; keep fewer than 30% of text elements in containers.
- Budget about nine primary nodes. For comprehensive work, build and audit one section at a time.
