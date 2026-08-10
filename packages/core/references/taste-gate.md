# Taste Gate

Run this checklist before declaring an Excalidraw diagram complete.

## Type Fit

- Select the diagram type before drawing, then load its convention from `references/types/`.
- Use the visual structure that matches the claim: a timeline for sequence, fan-out for distribution, convergence for synthesis, a tree for hierarchy, and side-by-side for comparison.
- Use Mermaid only when rigid structure is the point. Use a composed Excalidraw layout when the diagram must make a visual argument.

## Remove Test

The highest-quality move is usually deletion. Remove any shape, connector, label, color, or section that does not strengthen the argument.

- Target visual density: about **4/10**—intentional, spacious, and readable at export size.
- Default to free-floating text; add containers only when they carry meaning, group content, or receive connections.
- If two elements say the same thing, keep the clearer one.

## Complexity Budget

| Constraint | Simple / conceptual | Comprehensive / technical |
| --- | --- | --- |
| Primary nodes | Maximum 9 | May exceed 9 only when split into clear sections |
| Focal accents | Maximum 2 | Maximum 2 per view; reuse consistently |
| Lanes / parallel flows | Maximum 3 | Maximum 5 |
| Visual patterns | 1–2 | One primary pattern per section |
| Containerized text | Under 30% | Under 30%, except compact evidence artifacts |
| Arrow crossings | 0 | 0; route with waypoints or separate sections |
| Evidence artifacts | Optional | Required for claims about real systems |

If the budget is exceeded, section the diagram, remove detail, or move supporting information into an annotation.

## Signal and Hierarchy

- Use scale, whitespace, and placement before color to establish hierarchy.
- Use only one or two focal accents selected from the active theme.
- Keep supporting content neutral; an accent must mean something.
- Make the intended reading order obvious without relying on a legend.

## Excalidraw Technical Checks

- Every full element uses `opacity: 100`.
- Use `roughness: 0` for polished or technical work; use `1` only when the selected theme and intent call for a sketchy result.
- Text uses `fontFamily: 3`.
- Containers have enough width and height for their bound labels at export scale.
- Full-element arrows bind to their intended start and end elements; route multi-waypoint arrows around content.
- Full Excalidraw elements never use a nonstandard `label` property. Skeleton elements may use `label: { "text": "…" }`.
- Keep bound text immediately after its container in full-element output.

## Evidence Checks for Technical Diagrams

- Verify names, payloads, formats, endpoints, and event types against an authoritative source.
- Include concrete evidence artifacts: real API names, code, JSON, schemas, events, or UI states.
- Make artifacts readable and distinguish them using colors defined by the active theme.
- Do not replace evidence with generic “Input / Process / Output” labels.

## Render Loop

Rendering is required before declaring the work done:

1. Render the diagram to PNG.
2. Inspect the image at its intended export size.
3. Fix clipping, overlaps, detached or crossing arrows, cramped spacing, weak hierarchy, and imbalanced composition.
4. Render and inspect again until it passes.

## Final Concept Tests

- **Isomorphism:** If the text disappeared, would the remaining structure still suggest the underlying relationship?
- **Education:** Does the diagram teach a concrete fact, mechanism, or trade-off rather than merely label concepts?
