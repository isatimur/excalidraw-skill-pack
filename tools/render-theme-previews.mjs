import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const CORE_THEMES = join(ROOT, "packages", "core", "themes");
const PUB_THEMES = join(ROOT, "packages", "themes");
const FIXTURES = join(ROOT, "packages", "shared", "fixtures");
const OUT = join(ROOT, "docs", "site", "images", "themes");

const { renderMany } = await import(join(ROOT, "packages", "renderer-node", "dist", "index.js"));

const PREVIEWS = [
  { theme: "default-sketchy", fixture: "03-concept-card.excalidraw", dir: CORE_THEMES },
  { theme: "stripe-press", fixture: "03-concept-card.excalidraw", dir: PUB_THEMES },
  { theme: "notion", fixture: "03-concept-card.excalidraw", dir: PUB_THEMES },
  { theme: "whiteboard", fixture: "04-relationship-map.excalidraw", dir: PUB_THEMES },
  { theme: "dark", fixture: "02-layered-stack.excalidraw", dir: PUB_THEMES },
];

async function readPalette(themesDir, themeName) {
  return JSON.parse(await readFile(join(themesDir, themeName, "palette.json"), "utf-8"));
}

const sourcePalette = await readPalette(CORE_THEMES, "default-sketchy");

async function reskin(json, themesDir, targetName) {
  const target = await readPalette(themesDir, targetName);
  const mapping = {};
  for (const [role, srcColor] of Object.entries(sourcePalette)) {
    if (typeof srcColor !== "string") continue;
    const tgt = target[role];
    if (typeof tgt === "string") mapping[srcColor] = tgt;
  }
  const payload = JSON.parse(json);
  const swap = (c) => (typeof c === "string" && mapping[c] ? mapping[c] : c);
  payload.elements = payload.elements.map((el) => ({
    ...el,
    strokeColor: swap(el.strokeColor),
    backgroundColor: swap(el.backgroundColor),
  }));
  if (payload.appState) {
    payload.appState.viewBackgroundColor = target.paper ?? payload.appState.viewBackgroundColor;
  } else {
    payload.appState = { viewBackgroundColor: target.paper ?? "#ffffff" };
  }
  return JSON.stringify(payload);
}

const items = [];
for (const { theme, fixture, dir } of PREVIEWS) {
  const src = await readFile(join(FIXTURES, fixture), "utf-8");
  const reskinned = await reskin(src, dir, theme);
  items.push({ theme, json: reskinned, opts: { theme, scale: 2, width: 1200 } });
}

const pngs = await renderMany(items.map(({ json, opts }) => ({ json, opts })));
for (let i = 0; i < items.length; i++) {
  const out = join(OUT, `${items[i].theme}.png`);
  await writeFile(out, pngs[i]);
  console.log(`wrote ${out} (${pngs[i].length} bytes)`);
}
