# Data Flow

Use data flow to establish what data moves, changes, persists, and exits. Use active-theme `palette.md` source, process, storage, and success colors; arrows inherit their source semantic stroke.

## Layout
- Read left-to-right: sources → transformations → stores/consumers.
- Use frames for security, ownership, or runtime boundaries. Name arrows with the artifact moving, not “data.”
- Put contracts, schemas, and sample records near the edge where they apply.

## Excalidraw pattern
- Skeleton ellipses for sources/sinks, rectangles for transforms, and labeled storage shapes where needed.
- Arrows use explicit orthogonal `points`; a dashed governance (theme connector stroke) arrow is control-plane metadata, not payload.
- Use dark cards for real JSON, event envelopes, or SQL fragments.

## Avoid
- Confusing control flow with payload movement, arrows without data names, and system boxes with no transformation.

## Budget
5–9 primary nodes. Split fan-out domains or lineage detail into separate frames.
