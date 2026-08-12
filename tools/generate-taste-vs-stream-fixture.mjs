#!/usr/bin/env node
/**
 * Competitive fixture: streaming boxes without taste vs typed layout + evidence.
 * Writes packages/shared/fixtures/competitive/taste-vs-stream.{excalidraw,png}
 * and web/images/competitive/taste-vs-stream.png
 *
 * The right panel is the product claim in one picture. Every label must clear
 * every edge — a collision on the "good" side is a self-own.
 */
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { join } from "node:path";
import { stabilize } from "./stabilize-excalidraw.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT_DIR = join(ROOT, "packages", "shared", "fixtures", "competitive");
const WEB_DIR = join(ROOT, "web", "images", "competitive");

const INK = "#1e3a5f";
const MUTED = "#64748b";
const ACCENT = "#c2410c";
const FILL = "#dbeafe";
const PAPER = "#ffffff";
const WARN = "#b91c1c";
const STORE = "#fef3c7";
const GRID = "#cbd5e1";

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

function zone(id, x, y, w, h) {
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

// Near edge of the target — far-edge returns are what make arrows overshoot.
function entryAnchor(box, other) {
  const c = center(box);
  const o = center(other);
  const dx = o.x - c.x;
  const dy = o.y - c.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { x: box.x + box.w, y: c.y } : { x: box.x, y: c.y };
  }
  return dy > 0 ? { x: c.x, y: box.y + box.h } : { x: c.x, y: box.y };
}

function arrow(id, from, to, opts = {}) {
  const start = exitAnchor(from, to);
  const end = entryAnchor(to, from);
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const standoff = Math.min(opts.standoff ?? 8, len / 3);
  return {
    type: "arrow",
    id,
    x: start.x,
    y: start.y,
    points: [
      [0, 0],
      [dx - (dx / len) * standoff, dy - (dy / len) * standoff],
    ],
    strokeColor: opts.stroke ?? INK,
    strokeWidth: 2,
    roughness: 0,
    start: { id: from.id },
    end: { id: to.id },
  };
}

// ── Geometry ──────────────────────────────────────────────────────────────
// Gaps between boxes are sized for the longest edge label at Cascadia metrics
// (~7.5px/char at 14px). "POST /orders" ≈ 90px → gap ≥ 120px, label above.

const client = { id: "r_client", x: 540, y: 300, w: 124, h: 56 };
const api = { id: "r_api", x: 784, y: 300, w: 130, h: 56 };
const db = { id: "r_db", x: 1034, y: 300, w: 140, h: 56 };
const proof = { id: "r_proof", x: 784, y: 420, w: 210, h: 56 };

// VPC wraps API + Postgres only. Client stays outside so the dashed boundary
// excludes something — otherwise it is decoration, not structure.
const vpc = { x: 744, y: 236, w: 460, h: 156 };

const lUser = { id: "l_user", x: 64, y: 250, w: 96, h: 48 };
const lApi = { id: "l_api", x: 200, y: 250, w: 96, h: 48 };
const lDb = { id: "l_db", x: 336, y: 250, w: 96, h: 48 };
const lMisc1 = { id: "l_misc1", x: 132, y: 340, w: 96, h: 48 };
const lMisc2 = { id: "l_misc2", x: 272, y: 340, w: 96, h: 48 };

const skeleton = {
  type: "excalidraw-skeleton",
  elements: [
    txt("title", 48, 28, "Taste beats streaming boxes", { fontSize: 34 }),
    txt(
      "subtitle",
      48,
      78,
      "Same subject (user → API → DB). Left: live canvas without a method. Right: typed layout + evidence.",
      { fontSize: 15, color: MUTED }
    ),

    // ── Left: deliberately bad ──────────────────────────────────────────
    txt("left_eyebrow", 48, 148, "STREAM WITHOUT TASTE", { fontSize: 12, color: MUTED }),
    txt("left_title", 48, 172, "Boxes appear. Argument doesn't.", { fontSize: 20 }),

    rect(lUser.id, lUser.x, lUser.y, lUser.w, lUser.h, "Box", {
      stroke: MUTED,
      fill: PAPER,
      labelSize: 16,
    }),
    rect(lApi.id, lApi.x, lApi.y, lApi.w, lApi.h, "Box", {
      stroke: MUTED,
      fill: PAPER,
      labelSize: 16,
    }),
    rect(lDb.id, lDb.x, lDb.y, lDb.w, lDb.h, "Box", {
      stroke: MUTED,
      fill: PAPER,
      labelSize: 16,
    }),
    rect(lMisc1.id, lMisc1.x, lMisc1.y, lMisc1.w, lMisc1.h, "Box", {
      stroke: MUTED,
      fill: PAPER,
      labelSize: 16,
    }),
    rect(lMisc2.id, lMisc2.x, lMisc2.y, lMisc2.w, lMisc2.h, "Box", {
      stroke: MUTED,
      fill: PAPER,
      labelSize: 16,
    }),
    arrow("la1", lUser, lApi, { stroke: WARN }),
    arrow("la2", lApi, lDb, { stroke: WARN }),
    arrow("la3", lUser, lMisc1, { stroke: WARN }),
    arrow("la4", lApi, lMisc2, { stroke: WARN }),
    arrow("la5", lMisc1, lDb, { stroke: WARN }),
    txt("left_note", 48, 520, "Equal boxes. Crossing arrows. No hierarchy.", {
      fontSize: 14,
      color: WARN,
    }),

    {
      type: "line",
      id: "divider",
      x: 488,
      y: 148,
      points: [
        [0, 0],
        [0, 340],
      ],
      strokeColor: GRID,
      strokeWidth: 1,
      roughness: 0,
    },

    // ── Right: the claim, drawn clean ───────────────────────────────────
    txt("right_eyebrow", 540, 148, "TYPED + TASTE GATE", { fontSize: 12, color: MUTED }),
    txt("right_title", 540, 172, "Shape is the meaning.", { fontSize: 20, color: ACCENT }),

    zone("vpc", vpc.x, vpc.y, vpc.w, vpc.h),
    // Free text at the top-left edge — never a container label, which
    // Excalidraw centres over whatever the zone contains.
    txt("vpc_label", vpc.x + 16, vpc.y + 12, "Production VPC", {
      fontSize: 13,
      color: MUTED,
    }),

    rect(client.id, client.x, client.y, client.w, client.h, "Client"),
    rect(api.id, api.x, api.y, api.w, api.h, "API"),
    rect(db.id, db.x, db.y, db.w, db.h, "Postgres", {
      fill: STORE,
      stroke: ACCENT,
    }),

    arrow("ra1", client, api),
    arrow("ra2", api, db),

    // Labels sit in the vertical band ABOVE the shaft and INSIDE the
    // horizontal gap. Coordinates are absolute so Cascadia width cannot
    // shove them into a neighbouring box.
    txt("ra1_l", 668, 268, "POST /orders", { fontSize: 14, color: MUTED }),
    txt("ra2_l", 948, 268, "INSERT", { fontSize: 14, color: MUTED }),

    rect(proof.id, proof.x, proof.y, proof.w, proof.h, '{ "p99_ms": 142 }', {
      fill: PAPER,
      stroke: MUTED,
      labelSize: 15,
    }),
    txt("proof_src", proof.x, proof.y + proof.h + 10, "load test · 2026-02-14", {
      fontSize: 12,
      color: MUTED,
    }),

    txt("right_note", 540, 520, "One accent. Orthogonal flow. Proof beside claim.", {
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
  const parsed = stabilize("taste-vs-stream", JSON.parse(full));
  const jsonPath = join(OUT_DIR, "taste-vs-stream.excalidraw");
  await writeFile(jsonPath, JSON.stringify(parsed, null, 2) + "\n");

  const png = await renderToPng(JSON.stringify(parsed), { theme: "default-sketchy", scale: 2, width: 1360 });
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
