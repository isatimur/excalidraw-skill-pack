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

## CLI

```bash
excalidraw-render diagram.excalidraw --output diagram.png --scale 2 --width 1920
```

## Parity with Node binding

The Python and Node renderers share `packages/shared/render_template.html` and produce pixel-equivalent output at matching scale/width settings.
