# excalidraw-render

Python binding for rendering Excalidraw JSON to PNG, part of excalidraw-skill-pack.

## Install

```bash
pip install excalidraw-skill-pack-render
playwright install chromium
```

## Python API

```python
from excalidraw_render import render_to_png

png_bytes = render_to_png(json_str, theme="default-sketchy", scale=2, width=1920)
```

### Batch (reuse one browser)

Launching Chromium is the dominant cost of a render; reuse it across diagrams.

```python
from excalidraw_render import BatchItem, Renderer, render_many

# One-shot batch — launches one browser, renders all, closes it:
pngs = render_many([
    BatchItem(json=json_a, theme="dark", scale=2),
    BatchItem(json=json_b, theme="notion"),
])

# Or drive the browser yourself for long-lived processes / servers:
with Renderer() as renderer:
    png = renderer.render(json_str, theme="default-sketchy", scale=2, width=1920)
```

`render_to_png` is a convenience wrapper that launches and closes a browser for a
single render — output is identical to `Renderer.render`.

## CLI

```bash
excalidraw-render diagram.excalidraw --output diagram.png --scale 2 --width 1920
```

## Parity with Node binding

The Python and Node renderers share `packages/shared/render_template.html` and produce pixel-equivalent output at matching scale/width settings.
