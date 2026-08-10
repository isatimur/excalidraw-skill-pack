# Medallion Architecture

Use medallion to argue progressive data quality: raw, validated, and serving-ready layers. Use active-theme `palette.md` colors for input, transformation, quality gates, and outputs.

## Layout
- Arrange Bronze → Silver → Gold left-to-right, each as a frame containing free-floating evidence labels.
- Show the quality rule or transformation at each boundary, not only layer names.
- Place downstream consumers beyond Gold and source systems before Bronze.

## Excalidraw pattern
- Frames represent tiers; skeleton shapes with bound labels represent durable stores or explicit quality gates.
- Orthogonal arrows carry named datasets. Add dark cards showing a schema, SQL clause, or JSON record.

## Avoid
- Treating tiers as generic deployment layers, hiding data contracts, and placing consumers in every tier.

## Budget
3 tiers, 1–3 representative datasets each. Create a data-flow view for detailed lineage.
