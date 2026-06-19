# excalidraw-render

Node.js renderer for Excalidraw JSON → PNG, using Playwright + Chromium.

## Install

```bash
npm install @excalidraw-skill-pack/render
```

## Usage

### Library

```typescript
import { renderToPng } from "@excalidraw-skill-pack/render";
import { readFile, writeFile } from "node:fs/promises";

const json = await readFile("diagram.excalidraw", "utf-8");
const png = await renderToPng(json, { theme: "default-sketchy", scale: 2, width: 1200 });
await writeFile("diagram.png", png);
```

### Batch (reuse one browser)

Launching Chromium is the dominant cost of a render; reuse it across diagrams.

```typescript
import { renderMany, Renderer } from "@excalidraw-skill-pack/render";

// One-shot batch — launches one browser, renders all, closes it:
const [a, b] = await renderMany([
  { json: jsonA, opts: { theme: "dark", scale: 2 } },
  { json: jsonB, opts: { theme: "notion" } },
]);

// Or drive the browser yourself for long-lived processes / servers:
const renderer = new Renderer();
try {
  const png = await renderer.render(json, { scale: 2, width: 1200 });
} finally {
  await renderer.close();
}
```

`renderToPng` is a convenience wrapper that launches and closes a browser for a
single render — output is identical to `Renderer.render`.

### CLI

```bash
# Single file
excalidraw-render diagram.excalidraw --theme default-sketchy --output diagram.png --scale 2 --width 1200

# Many files — one browser session, output directory via -o
excalidraw-render a.excalidraw b.excalidraw c.excalidraw --theme dark -o ./out
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--theme` | `default-sketchy` | Theme name |
| `--output` / `-o` | `<input>.png` | Output path (single input) or output directory (multiple inputs) |
| `--scale` | `2` | Device pixel ratio |
| `--width` | `1200` | Max viewport width in px |
