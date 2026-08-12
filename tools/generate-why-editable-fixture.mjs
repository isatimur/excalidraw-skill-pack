#!/usr/bin/env node
/**
 * Competitive fixture: static HTML+SVG export vs editable render-inspect loop.
 * Writes packages/shared/fixtures/competitive/why-editable-beats-static.{excalidraw,png}
 * and web/images/competitive/why-editable-beats-static.png
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
const OK = "#15803d";
const OK_FILL = "#dcfce7";
const GRID = "#cbd5e1";
const PURPLE = "#6d28d9";

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
    label: label ? { text: label, fontSize: opts.labelSize } : undefined,
  };
}

function ellipse(id, x, y, w, h, label, opts = {}) {
  return {
    type: "ellipse",
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
    label: label ? { text: label, fontSize: opts.labelSize } : undefined,
  };
}

function line(id, x, y, points, opts = {}) {
  return {
    type: "line",
    id,
    x,
    y,
    points,
    strokeColor: opts.stroke ?? MUTED,
    strokeWidth: opts.strokeWidth ?? 2,
    strokeStyle: opts.dashed ? "dashed" : "solid",
    roughness: 0,
  };
}

function path(id, x, y, points, opts = {}) {
  return {
    type: "arrow",
    id,
    x,
    y,
    points,
    strokeColor: opts.stroke ?? INK,
    strokeWidth: 2,
    strokeStyle: opts.dashed ? "dashed" : "solid",
    roughness: 0,
  };
}

function elbow(id, absolutePoints, opts = {}) {
  const [ox, oy] = absolutePoints[0];
  return path(
    id,
    ox,
    oy,
    absolutePoints.map(([x, y]) => [x - ox, y - oy]),
    opts
  );
}

const html = { id: "html", x: 80, y: 250, w: 340, h: 64 };
const dead = { id: "dead", x: 80, y: 390, w: 340, h: 64 };

const theme = { id: "theme", x: 560, y: 250, w: 140, h: 56 };
const typeRef = { id: "type", x: 760, y: 250, w: 140, h: 56 };
const skeleton = { id: "skel", x: 960, y: 250, w: 140, h: 56 };
const hub = { id: "hub", x: 720, y: 390, w: 280, h: 88 };
const outFile = { id: "out_file", x: 560, y: 560, w: 168, h: 56 };
const outPng = { id: "out_png", x: 780, y: 560, w: 120, h: 56 };
const outMcp = { id: "out_mcp", x: 960, y: 560, w: 120, h: 56 };

const skeleton_doc = {
  type: "excalidraw-skeleton",
  elements: [
    txt("title", 64, 28, "Why editable beats static", { fontSize: 36 }),
    txt(
      "subtitle",
      64,
      78,
      "Same editorial ambition. Different artifact. The loop is the product.",
      { fontSize: 16, color: MUTED }
    ),

    // ── Left: dead end ──────────────────────────────────────────────────
    txt("left_eyebrow", 64, 140, "STATIC HTML + SVG", { fontSize: 12, color: MUTED }),
    txt("left_title", 64, 164, "Ship a screenshot", { fontSize: 22 }),

    rect(html.id, html.x, html.y, html.w, html.h, "example-architecture.html", {
      fill: PAPER,
      stroke: MUTED,
      labelSize: 15,
    }),
    path("left_a1", html.x + html.w / 2, html.y + html.h, [[0, 0], [0, dead.y - (html.y + html.h) - 8]], {
      stroke: WARN,
    }),
    txt("left_a1_l", html.x + html.w / 2 + 14, html.y + html.h + 18, "export", {
      fontSize: 14,
      color: WARN,
    }),
    rect(dead.id, dead.x, dead.y, dead.w, dead.h, "PNG snapshot", {
      fill: "#fecaca",
      stroke: WARN,
    }),

    line("left_rule", 64, 490, [[0, 0], [360, 0]], { strokeWidth: 1, stroke: GRID }),
    txt("pain1", 64, 510, "Tokens live in one guide (typical)", { fontSize: 14, color: MUTED }),
    txt("pain2", 64, 538, "Tweaks often mean HTML surgery", { fontSize: 14, color: MUTED }),
    txt("pain3", 64, 566, "Artifact is HTML, not .excalidraw", { fontSize: 14, color: MUTED }),
    txt("pain4", 64, 594, "Export ends the inspect loop", { fontSize: 14, color: MUTED }),

    line("divider", 480, 140, [[0, 0], [0, 480]], { strokeWidth: 1, stroke: GRID }),

    // ── Right: living loop ──────────────────────────────────────────────
    txt("right_eyebrow", 540, 140, "EXCALIDRAW SKILL PACK", { fontSize: 12, color: MUTED }),
    txt("right_title", 540, 164, "Ship a living argument", { fontSize: 22 }),

    ellipse(theme.id, theme.x, theme.y, theme.w, theme.h, "Theme gate", {
      fill: "#fed7aa",
      stroke: ACCENT,
      labelSize: 15,
    }),
    rect(typeRef.id, typeRef.x, typeRef.y, typeRef.w, typeRef.h, "Type ref"),
    rect(skeleton.id, skeleton.x, skeleton.y, skeleton.w, skeleton.h, "Skeleton"),

    path(
      "r_a1",
      theme.x + theme.w,
      theme.y + theme.h / 2,
      [[0, 0], [typeRef.x - (theme.x + theme.w) - 8, 0]]
    ),
    path(
      "r_a2",
      typeRef.x + typeRef.w,
      typeRef.y + typeRef.h / 2,
      [[0, 0], [skeleton.x - (typeRef.x + typeRef.w) - 8, 0]]
    ),

    rect(hub.id, hub.x, hub.y, hub.w, hub.h, "Render → Inspect → Fix", { labelSize: 16 }),

    elbow("r_a3", [
      [skeleton.x + skeleton.w / 2, skeleton.y + skeleton.h + 8],
      [skeleton.x + skeleton.w / 2, hub.y - 40],
      [hub.x + hub.w / 2, hub.y - 40],
      [hub.x + hub.w / 2, hub.y - 8],
    ]),

    // Loop back: out the left, up, into the top — the product is the return.
    elbow(
      "r_loop",
      [
        [hub.x, hub.y + hub.h / 2],
        [hub.x - 48, hub.y + hub.h / 2],
        [hub.x - 48, hub.y - 20],
        [hub.x + 24, hub.y - 20],
        [hub.x + 24, hub.y - 8],
      ],
      { dashed: true, stroke: INK }
    ),
    txt("again", hub.x - 100, hub.y + hub.h / 2 - 10, "again", {
      fontSize: 14,
      color: MUTED,
    }),

    ellipse(outFile.id, outFile.x, outFile.y, outFile.w, outFile.h, ".excalidraw", {
      fill: OK_FILL,
      stroke: OK,
      labelSize: 15,
    }),
    ellipse(outPng.id, outPng.x, outPng.y, outPng.w, outPng.h, "PNG", {
      fill: OK_FILL,
      stroke: OK,
      labelSize: 15,
    }),
    ellipse(outMcp.id, outMcp.x, outMcp.y, outMcp.w, outMcp.h, "MCP", {
      fill: "#ede9fe",
      stroke: PURPLE,
      labelSize: 15,
    }),

    elbow("r_a4", [
      [hub.x + 60, hub.y + hub.h + 8],
      [hub.x + 60, hub.y + hub.h + 36],
      [outFile.x + outFile.w / 2, hub.y + hub.h + 36],
      [outFile.x + outFile.w / 2, outFile.y - 8],
    ]),
    elbow("r_a5", [
      [hub.x + hub.w / 2, hub.y + hub.h + 8],
      [hub.x + hub.w / 2, outPng.y - 8],
    ]),
    elbow(
      "r_a6",
      [
        [hub.x + hub.w - 60, hub.y + hub.h + 8],
        [hub.x + hub.w - 60, hub.y + hub.h + 36],
        [outMcp.x + outMcp.w / 2, hub.y + hub.h + 36],
        [outMcp.x + outMcp.w / 2, outMcp.y - 8],
      ],
      { dashed: true, stroke: PURPLE }
    ),

    // Evidence band
    rect("evidence", 64, 680, 1040, 140, "", { fill: INK, stroke: INK }),
    txt("ev_title", 88, 700, "EVIDENCE — what ships after the loop", {
      fontSize: 14,
      color: "#94a3b8",
    }),
    txt(
      "ev1",
      88,
      732,
      "diagram.excalidraw  →  hydrate  →  diagram.full.excalidraw",
      { fontSize: 15, color: PAPER }
    ),
    txt(
      "ev2",
      88,
      760,
      "audit_diagram  →  taste warnings (budget · container ratio · uniform boxes)",
      { fontSize: 15, color: PAPER }
    ),
    txt(
      "ev3",
      88,
      788,
      "theme packages @excalidraw-skill-pack/theme-*  ·  Node + Python pixel-parity PNG",
      { fontSize: 15, color: PAPER }
    ),

    txt(
      "footer",
      64,
      850,
      "29 types · brand onboarding · taste gate · evidence artifacts · dual renderer · multi-agent install",
      { fontSize: 14, color: MUTED }
    ),
  ],
};

async function main() {
  const { hydrateSkeleton, renderToPng } = await import(
    join(ROOT, "packages", "renderer-node", "dist", "index.js")
  );

  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(WEB_DIR, { recursive: true });

  const full = await hydrateSkeleton(JSON.stringify(skeleton_doc));
  const jsonPath = join(OUT_DIR, "why-editable-beats-static.excalidraw");
  await writeFile(jsonPath, JSON.stringify(JSON.parse(full), null, 2) + "\n");

  const png = await renderToPng(full, { theme: "default-sketchy", scale: 2, width: 1280 });
  const pngPath = join(OUT_DIR, "why-editable-beats-static.png");
  const webPath = join(WEB_DIR, "why-editable-beats-static.png");
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
