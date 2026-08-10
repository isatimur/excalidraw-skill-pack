# Layers

Use layers to argue abstraction, dependency direction, or control separation. Use active-theme `palette.md` colors consistently by semantic role.

## Layout
- Stack 3–6 wide horizontal bands from foundation to experience; each band has one free-floating title and concise supporting labels.
- Put cross-cutting control planes beside or above the stack, not as another indistinguishable layer.
- Use frames when layers belong to different trust or ownership zones.

## Excalidraw pattern
- Use skeleton rectangles only for actual layer boundaries; labels are bound there, details float inside.
- Orthogonal arrows cross layers only to show a genuine dependency; dashed governance (theme connector stroke) arrows indicate governance.

## Avoid
- Horizontal boxes with no dependency claim, every item boxed, and bidirectional arrows everywhere.

## Budget
3–6 layers, 1–3 items per layer. Split deployment topology into architecture.
