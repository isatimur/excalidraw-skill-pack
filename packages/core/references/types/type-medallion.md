# Medallion

**Best for:** bronze/silver/gold data tiers, lakehouse zones.

## Layout conventions
Left→right tier progression with accent on gold/curated tier. Name a concrete table under each tier and who owns it.

## Excalidraw pattern
Rectangles per tier; free transform labels (`dedupe + types`, `aggregate`) above shafts.

## Connectors & routing
Single pipeline direction.

## Anti-patterns
Mixing medallion with generic ETL jargon boxes; bare Bronze/Silver/Gold with no contract.

## Budget
3 tiers + ownership captions.

## Example
- Fixture: [`packages/shared/fixtures/types/medallion/example.excalidraw`](https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/medallion/example.excalidraw)
- Rendered: [gallery PNG](https://excalidraw-skill-pack.vercel.app/images/types/medallion.png)
