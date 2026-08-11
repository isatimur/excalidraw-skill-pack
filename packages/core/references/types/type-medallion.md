# Medallion

**Best for:** bronze/silver/gold data tiers, lakehouse zones.

## Layout conventions
Left→right tier progression with accent on gold/curated tier.

## Excalidraw pattern
Rectangles per tier; transform arrows labeled `raw→clean→mart`.

## Connectors & routing
Single pipeline direction.

## Anti-patterns
Mixing medallion with generic ETL jargon boxes.

## Budget
3 tiers + sources/sinks.

## Example
- Fixture: [`packages/shared/fixtures/types/medallion/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/medallion/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/medallion.png)
