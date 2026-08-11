#!/usr/bin/env node
// Renders the type specimen plate (README + social) and injects the live specimen
// section into the gallery page. Re-run after editing tools/type-specimen.mjs.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { FAMILIES, TYPES, glyph, GLYPH_CSS, FIXTURE_URL } from "./type-specimen.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const PLATE_PNG = join(ROOT, "web", "images", "types", "specimen.png");
const GALLERY = join(ROOT, "web", "gallery", "index.html");
const README = join(ROOT, "README.md");

const COLUMNS = Math.max(...FAMILIES.map((f) => f.types.length));

// Families with two forms sit side by side so the plate does not trail off into
// empty columns; wider families keep a row to themselves at the same glyph scale.
const PLATE_ROWS = FAMILIES.reduce((rows, family) => {
  const last = rows.at(-1);
  const pairable = family.types.length <= 2;
  if (last && pairable && last.length === 1 && last[0].types.length <= 2) last.push(family);
  else rows.push([family]);
  return rows;
}, []);

const platePage = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@1,6..72,400&family=IBM+Plex+Mono:wght@400;500&family=Source+Serif+4:ital,opsz,wght@1,8..60,400&display=swap" rel="stylesheet" />
<style>
:root {
  --ink: #2A2622; --paper: #F4EDE0; --paper-deep: #EBE3D4;
  --accent: #B8472A; --muted: #6E6356; --line: rgba(42,38,34,.14);
}
* { box-sizing: border-box; margin: 0; }
body { background: #fff; }
.plate {
  width: 1600px;
  padding: 50px 56px 40px;
  background: linear-gradient(180deg, var(--paper), var(--paper-deep));
  color: var(--ink);
  font-family: "IBM Plex Mono", monospace;
  position: relative;
}
.tick { position: absolute; width: 16px; height: 16px; border: 1px solid rgba(42,38,34,.28); }
.tick.tl { top: 18px; left: 18px; border-right: 0; border-bottom: 0; }
.tick.tr { top: 18px; right: 18px; border-left: 0; border-bottom: 0; }
.tick.bl { bottom: 18px; left: 18px; border-right: 0; border-top: 0; }
.tick.br { bottom: 18px; right: 18px; border-left: 0; border-top: 0; }

.masthead { display: grid; grid-template-columns: 800px 1fr; gap: 40px; align-items: end; }
.eyebrow { font-size: 17px; letter-spacing: .22em; text-transform: uppercase; color: var(--muted); }
.title {
  font-family: "Newsreader", serif; font-style: italic; font-weight: 400;
  font-size: 62px; line-height: 1.04; letter-spacing: -.025em; margin: 14px 0 0;
}
.thesis {
  font-family: "Source Serif 4", serif; font-style: italic; font-size: 25px; line-height: 1.45;
  color: var(--muted); padding-bottom: 8px;
}
.rule { height: 1px; background: var(--line); margin: 30px 0 0; }

.row { display: grid; grid-template-columns: 1fr; }
.row.paired { grid-template-columns: 1fr 1fr; gap: 48px; }
.band { display: grid; grid-template-columns: 310px 1fr; gap: 32px; padding: 22px 0 20px; border-bottom: 1px solid var(--line); }
.row:last-of-type .band { border-bottom: 0; }
.rail-name { font-size: 19px; letter-spacing: .2em; text-transform: uppercase; }
.rail-count { color: var(--accent); }
.rail-q { font-family: "Source Serif 4", serif; font-style: italic; font-size: 20px; color: var(--muted); margin-top: 6px; max-width: 24ch; }
.cells { display: grid; grid-template-columns: repeat(${COLUMNS}, 150px); gap: 16px; }
.row.paired .cells { grid-template-columns: repeat(2, 150px); }
.cell { display: grid; gap: 9px; align-content: start; }
.glyph { color: var(--ink); }
${GLYPH_CSS}
.cell-name { font-size: 19px; line-height: 1.25; letter-spacing: .03em; color: var(--ink); }

.foot { display: flex; justify-content: space-between; gap: 20px; margin-top: 26px; padding-top: 16px; border-top: 1px solid var(--line); font-size: 17px; color: var(--muted); }
</style></head>
<body><div class="plate">
<span class="tick tl"></span><span class="tick tr"></span><span class="tick bl"></span><span class="tick br"></span>
<div class="masthead">
  <div>
    <p class="eyebrow">excalidraw-skill-pack &middot; specimen sheet</p>
    <h1 class="title">Twenty-nine forms,<br />one grammar each</h1>
  </div>
  <p class="thesis">Delete every label and the structure still tells you which diagram it is. That is the test each type has to pass.</p>
</div>
<div class="rule"></div>
${PLATE_ROWS.map(
  (row) => `<div class="row${row.length > 1 ? " paired" : ""}">
${row
  .map(
    (family) => `  <section class="band">
    <div class="rail">
      <p class="rail-name">${family.id} <span class="rail-count">${String(family.types.length).padStart(2, "0")}</span></p>
      <p class="rail-q">${family.question}</p>
    </div>
    <div class="cells">
${family.types
  .map(
    ([slug, name, , plateName]) =>
      `      <figure class="cell"><span class="glyph">${glyph(slug)}</span><figcaption class="cell-name">${plateName ?? name}</figcaption></figure>`,
  )
  .join("\n")}
    </div>
  </section>`,
  )
  .join("\n")}
</div>`,
).join("\n")}
<div class="foot"><span>${TYPES.length} types &middot; editable .excalidraw + rendered PNG for each</span><span>excalidraw-skill-pack.vercel.app/gallery</span></div>
</div></body></html>`;

const gallerySection = () => `  <section class="specimen" aria-label="29 diagram types">
    <div class="specimen-head">
      <p class="eyebrow" data-reveal>specimen sheet</p>
      <div>
        <h2 data-reveal>Twenty-nine forms, one grammar each</h2>
        <p class="note" data-reveal>Delete every label and the structure still tells you which diagram it is. That is the test each type has to pass. Every glyph links to its editable <code>.excalidraw</code> fixture; re-theme any of them with <code>--theme</code>.</p>
      </div>
    </div>
${PLATE_ROWS.map(
  (row, rowIndex) => `    <div class="row${row.length > 1 ? " paired" : ""}${rowIndex === PLATE_ROWS.length - 1 ? " last" : ""}">
${row
  .map(
    (family) => `      <section class="family" data-reveal-group>
        <div class="family-rail" data-reveal-item>
          <h3>${family.id} <span>${String(family.types.length).padStart(2, "0")}</span></h3>
          <p>${family.question}</p>
        </div>
        <div class="cells">
${family.types
  .map(
    ([slug, name, grammar]) => `          <a class="cell" data-reveal-item href="${FIXTURE_URL(slug)}">
            <span class="glyph">${glyph(slug)}</span>
            <span class="cell-name">${name}</span>
            <span class="cell-meta"><span class="grammar">${grammar}</span><span class="open">open source →</span></span>
          </a>`,
  )
  .join("\n")}
        </div>
      </section>`,
  )
  .join("\n")}
    </div>`,
).join("\n")}
  </section>`;

const galleryCss = () => `/* The specimen is the widest element on the page: it reads as a plate, not a paragraph. */
.specimen {
  --plate: min(1400px, calc(100vw - 3rem));
  width: var(--plate);
  margin: 0 0 4.5rem calc((100% - var(--plate)) / 2);
}
.specimen-head { display: grid; grid-template-columns: 190px 1fr; gap: 1.75rem; margin: 0 0 0.5rem; }
.eyebrow {
  font-family: var(--mono);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0.5rem 0 0;
}
.specimen h2 { max-width: 34ch; }
.specimen .note { max-width: 44rem; margin-bottom: 0; }
.row { display: grid; }
.row.paired { grid-template-columns: 1fr 1fr; gap: 2.5rem; }
.family {
  display: grid;
  grid-template-columns: 190px 1fr;
  gap: 1.75rem;
  padding: 1.6rem 0;
  border-top: 1px solid var(--line);
}
.row.last .family { border-bottom: 1px solid var(--line); }
.family-rail h3 {
  font-family: var(--mono);
  font-weight: 500;
  font-size: 0.76rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  margin: 0.15rem 0 0.4rem;
}
.family-rail h3 span { color: var(--accent); }
.family-rail p {
  font-style: italic;
  color: var(--muted);
  font-size: 0.95rem;
  margin: 0;
  max-width: 18ch;
}
/* Fixed cell width keeps every glyph at one scale, so forms stay comparable across families. */
.family .cells {
  display: grid;
  grid-template-columns: repeat(auto-fill, 150px);
  gap: 0.9rem;
}
.cell {
  display: grid;
  gap: 0.55rem;
  align-content: start;
  padding: 0.7rem 0.6rem 0.75rem;
  border: 1px solid transparent;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.25s ease, background-color 0.25s ease, transform 0.25s ease;
}
.cell:hover, .cell:focus-visible { border-color: var(--accent); background: #fff; transform: translateY(-2px); }
.cell:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.glyph { color: var(--ink); }
${GLYPH_CSS}
.cell-name { font-family: var(--mono); font-size: 0.78rem; letter-spacing: 0.02em; }
.cell-meta { display: grid; }
.cell-meta > span {
  grid-area: 1 / 1;
  font-family: var(--mono);
  font-size: 0.67rem;
  line-height: 1.35;
  color: var(--muted);
  transition: opacity 0.2s ease;
}
.cell-meta .open { color: var(--accent); opacity: 0; }
.cell:hover .grammar, .cell:focus-visible .grammar { opacity: 0; }
.cell:hover .open, .cell:focus-visible .open { opacity: 1; }
@media (prefers-reduced-motion: reduce) {
  .cell, .cell-meta > span { transition: none; }
  .cell:hover, .cell:focus-visible { transform: none; }
}
@media (max-width: 900px) {
  .specimen-head { grid-template-columns: 1fr; gap: 0.35rem; }
  .eyebrow { margin: 0; }
  .row.paired { grid-template-columns: 1fr; gap: 0; }
  .family { grid-template-columns: 1fr; gap: 1rem; }
  .family-rail p { max-width: none; }
}`;

const readmeBlock = () => `<p align="center">
  <img src="web/images/types/specimen.png" alt="Specimen sheet: 29 diagram type glyphs grouped into seven families" width="1000" />
</p>

Delete every label and the structure still tells you which diagram it is. That is the test each type has to pass. Every type ships an **editable** \`.excalidraw\` source plus a rendered PNG.

| Family | Answers | Types |
|---|---|---|
${FAMILIES.map(
  (family) =>
    `| **${family.id[0].toUpperCase()}${family.id.slice(1)}** | ${family.question} | ${family.types.map(([, name]) => name).join(" · ")} |`,
).join("\n")}

Fixtures live in [\`packages/shared/fixtures/types/\`](packages/shared/fixtures/types/). [Browse the rendered gallery →](https://excalidraw-skill-pack.vercel.app/gallery/)`;

function splice(source, marker, body, file, css = false) {
  const start = css ? `/* ${marker}:START */` : `<!-- ${marker}:START -->`;
  const end = css ? `/* ${marker}:END */` : `<!-- ${marker}:END -->`;
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from === -1 || to === -1) throw new Error(`missing ${marker} markers in ${file}`);
  return `${source.slice(0, from + start.length)}\n${body}\n${source.slice(to)}`;
}

const require = createRequire(join(ROOT, "packages", "renderer-node", "package.json"));
const playwright = await import(pathToFileURL(require.resolve("playwright")).href);
const chromium = playwright.chromium ?? playwright.default.chromium;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 2 });
await page.setContent(platePage(), { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await mkdir(join(ROOT, "web", "images", "types"), { recursive: true });
await page.locator(".plate").screenshot({ path: PLATE_PNG });
const box = await page.locator(".plate").boundingBox();
await browser.close();

let gallery = await readFile(GALLERY, "utf-8");
gallery = splice(gallery, "SPECIMEN-CSS", galleryCss(), GALLERY, true);
gallery = splice(gallery, "SPECIMEN", gallerySection(), GALLERY);
await writeFile(GALLERY, gallery);

const readme = await readFile(README, "utf-8");
await writeFile(README, splice(readme, "SPECIMEN", readmeBlock(), README));

console.log(`plate ${PLATE_PNG} (${box.width}x${Math.round(box.height)} css px)`);
console.log(`injected specimen into ${GALLERY} and ${README}`);
