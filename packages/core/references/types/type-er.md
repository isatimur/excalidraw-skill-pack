# Entity Relationship

Use ER diagrams to argue data ownership and cardinality. Use active-theme `palette.md` primary/secondary colors for entities and muted structural lines; keep field text readable.

## Layout
- Put the entity that owns the relationship nearest the center; arrange dependents around it.
- Show only fields that explain identity, linkage, or the claim. Put cardinality at each relationship end.
- Frame bounded contexts and keep notes free-floating.

## Excalidraw pattern
- Use skeleton rectangles with bound entity labels; list key fields as adjacent free-floating text.
- Use orthogonal relationship lines/arrows; label `1`, `0..1`, or `*` directly at the endpoints.
- Dark evidence cards may show a real schema fragment or JSON record.

## Avoid
- Reproducing every database column, unlabeled cardinality, and using arrows to imply foreign keys ambiguously.

## Budget
4–8 entities per view; one bounded context per frame. Split cross-domain relationships into a context map.
