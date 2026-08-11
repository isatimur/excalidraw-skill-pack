#!/usr/bin/env node
/**
 * Competitive fixture: streaming boxes without taste vs typed layout + evidence.
 * Writes packages/shared/fixtures/competitive/taste-vs-stream.{excalidraw,png}
 * and web/images/competitive/taste-vs-stream.png
 */
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT_DIR = join(ROOT, "packages", "shared", "fixtures", "competitive");
const WEB_DIR = join(ROOT, "web", "images", "competitive");

const INK = "#1e3a5f";
const MUTED = "#64748b";
const ACCENT = "#c2410c";
const FILL = "#dbeafe";
const PAPER = "#ffffff";
const WARN = "#b91c1c";

function txt(id, x, y, text, opts = {}) {
  return {
    type: "text",
    id,
    x,
    y,
    text,
    fontSize: opts.fontSize ?? 16,
    strokeColor: opts.color ?? INK,
    fontFamily: 3,
  };
}

function rect(id, x, y, w, h, label, opts = {}) {
  return {
    type: "rectangle",
    id,
    x,
    y,
    width: w,
    height: h,
    strokeColor: opts.stroke ?? INK,
    backgroundColor: opts.fill ?? FILL,
    fillStyle: "solid",
    strokeWidth: 2,
    roughness: 0,
    label: label ? { text: label } : undefined,
  };
}

function center(box) {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

function exitAnchor(box, other) {
  const c = center(box);
  const o = center(other);
  const dx = o.x - c.x;
  const dy = o.y - c.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { x: box.x + box.w, y: c.y } : { x: box.x, y: c.y };
  }
  return dy > 0 ? { x: c.x, y: box.y + box.h } : { x: c.x, y: box.y };
}

function entryAnchor(box, other) {
  const c = center(box);
  const o = center(other);
  const dx = o.x - c.x;
  const dy = o.y - c.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { x: box.x, y: c.y } : { x: box.x + box.w, y: c.y };
  }
  return dy > 0 ? { x: c.x, y: box.y } : { x: c.x, y: box.y + box.h };
}

function arrow(id, from, to, label, opts = {}) {
  const start = exitAnchor(from, to);
  const end = entryAnchor(to, from);
  return {
    type: "arrow",
    id,
    x: start.x,
    y: start.y,
    width: end.x - start.x,
    height: end.y - start.y,
    strokeColor: opts.stroke ?? INK,
    strokeWidth: 2,
    roughness: 0,
    start: { id: from.id },
    end: { id: to.id },
    label: label ? { text: label } : undefined,
  };
}

function zone(id, x, y, w, h, label) {
  return {
    type: "rectangle",
    id,
    x,
    y,
    width: w,
    height: h,
    strokeColor: MUTED,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    strokeStyle: "dashed",
    roughness: 0,
    label: label ? { text: label } : undefined,
  };
}

const skeleton = {
  type: "excalidraw-skeleton",
  elements: [
    txt("title", 64, 36, "Taste beats streaming boxes", { fontSize: 36 }),
    txt(
      "subtitle",
      64,
      88,
      "Same subject (user → API → DB). Left: live canvas without a method. Right: typed layout + evidence + hierarchy.",
      { fontSize: 16, color: MUTED }
    ),

    txt("left_eyebrow", 64, 160, "STREAM WITHOUT TASTE", { fontSize: 13, color: MUTED }),
    txt("left_title", 64, 186, "Boxes appear. Argument doesn't.", { fontSize: 22 }),

    rect("l_user", 80, 250, 100, 48, "Box", { stroke: MUTED, fill: PAPER }),
    rect("l_api", 220, 250, 100, 48, "Box", { stroke: MUTED, fill: PAPER }),
    rect("l_db", 360, 250, 100, 48, "Box", { stroke: MUTED, fill: PAPER }),
    rect("l_misc1", 150, 340, 100, 48, "Box", { stroke: MUTED, fill: PAPER }),
    rect("l_misc2", 290, 340, 100, 48, "Box", { stroke: MUTED, fill: PAPER }),
    arrow(
      "la1",
      { id: "l_user", x: 80, y: 250, w: 100, h: 48 },
      { id: "l_api", x: 220, y: 250, w: 100, h: 48 },
      "",
      { stroke: WARN }
    ),
    arrow(
      "la2",
      { id: "l_api", x: 220, y: 250, w: 100, h: 48 },
      { id: "l_db", x: 360, y: 250, w: 100, h: 48 },
      "",
      { stroke: WARN }
    ),
    arrow(
      "la3",
      { id: "l_user", x: 80, y: 250, w: 100, h: 48 },
      { id: "l_misc1", x: 150, y: 340, w: 100, h: 48 },
      "",
      { stroke: WARN }
    ),
    arrow(
      "la4",
      { id: "l_api", x: 220, y: 250, w: 100, h: 48 },
      { id: "l_misc2", x: 290, y: 340, w: 100, h: 48 },
      "",
      { stroke: WARN }
    ),
    arrow(
      "la5",
      { id: "l_misc1", x: 150, y: 340, w: 100, h: 48 },
      { id: "l_db", x: 360, y: 250, w: 100, h: 48 },
      "",
      { stroke: WARN }
    ),
    txt("left_note", 80, 420, "Equal boxes. Crossing arrows. No hierarchy.", {
      fontSize: 14,
      color: WARN,
    }),

    txt("right_eyebrow", 560, 160, "TYPED + TASTE GATE", { fontSize: 13, color: MUTED }),
    txt("right_title", 560, 186, "Shape is the meaning.", { fontSize: 22, color: ACCENT }),

    zone("vpc", 560, 230, 520, 200, "Production VPC"),
    rect("r_user", 590, 270, 110, 56, "Client"),
    rect("r_api", 760, 270, 120, 56, "API"),
    rect("r_db", 940, 270, 110, 56, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
    arrow(
      "ra1",
      { id: "r_user", x: 590, y: 270, w: 110, h: 56 },
      { id: "r_api", x: 760, y: 270, w: 120, h: 56 },
      "POST /orders"
    ),
    arrow(
      "ra2",
      { id: "r_api", x: 760, y: 270, w: 120, h: 56 },
      { id: "r_db", x: 940, y: 270, w: 110, h: 56 },
      "INSERT"
    ),
    rect(
      "evidence",
      760,
      360,
      220,
      56,
      '{ "p99_ms": 142 }',
      { fill: PAPER, stroke: MUTED }
    ),
    txt("right_note", 560, 450, "One accent. Orthogonal flow. Proof beside claim.", {
      fontSize: 14,
      color: ACCENT,
    }),
  ],
};

async function main() {
  const { hydrateSkeleton, renderToPng } = await import(
    join(ROOT, "packages", "renderer-node", "dist", "index.js")
  );

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(WEB_DIR, { recursive: true });

  const full = await hydrateSkeleton(JSON.stringify(skeleton));
  const parsed = JSON.parse(full);
  const jsonPath = join(OUT_DIR, "taste-vs-stream.excalidraw");
  await writeFile(jsonPath, JSON.stringify(parsed, null, 2) + "\n");

  const png = await renderToPng(full, { theme: "default-sketchy", scale: 2, width: 1200 });
  const pngPath = join(OUT_DIR, "taste-vs-stream.png");
  const webPath = join(WEB_DIR, "taste-vs-stream.png");
  await writeFile(pngPath, png);
  await copyFile(pngPath, webPath);

  console.log(`wrote ${jsonPath}`);
  console.log(`wrote ${pngPath} (${png.length} bytes)`);
  console.log(`wrote ${webPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
