# excalidraw-render

Node.js renderer for Excalidraw JSON → PNG, using Playwright + Chromium.

## Install

```bash
npm install @excalidraw-skill-pack/render
```

## Usage

### Library

```typescript
import { renderToPng } from "excalidraw-render";
import { readFile, writeFile } from "node:fs/promises";

const json = await readFile("diagram.excalidraw", "utf-8");
const png = await renderToPng(json, { theme: "default-sketchy", scale: 2, width: 1200 });
await writeFile("diagram.png", png);
```

### CLI

```bash
excalidraw-render diagram.excalidraw --theme default-sketchy --output diagram.png --scale 2 --width 1200
```

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `--theme` | `default-sketchy` | Theme name |
| `--output` / `-o` | `<input>.png` | Output path |
| `--scale` | `2` | Device pixel ratio |
| `--width` | `1200` | Max viewport width in px |
