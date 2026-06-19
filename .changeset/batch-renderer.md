---
"@excalidraw-skill-pack/render": minor
---

feat(render): batch rendering that reuses one Chromium instance. Adds the `Renderer` class, `renderMany()`, and `hydrateSkeleton` to the public API, and the CLI now accepts multiple input files (rendering them in a single browser session, with `-o` as an output directory). `renderToPng` is unchanged and output is byte-identical — browser launch, previously paid per render, now happens once per batch.
