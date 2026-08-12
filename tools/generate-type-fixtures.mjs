#!/usr/bin/env node
/**
 * Generate canonical hydrated excalidraw fixtures for each diagram type.
 * Output: packages/shared/fixtures/types/<type>/example.excalidraw
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stabilize } from "./stabilize-excalidraw.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const OUT = join(ROOT, "packages", "shared", "fixtures", "types");

const INK = "#1e3a5f";
const MUTED = "#64748b";
const ACCENT = "#c2410c";
const GRID = "#cbd5e1";
const FILL = "#dbeafe";
const PAPER = "#ffffff";

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
    ...opts.extra,
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

function diamond(id, x, y, w, h, label, opts = {}) {
  return {
    type: "diamond",
    id,
    x,
    y,
    width: w,
    height: h,
    strokeColor: ACCENT,
    backgroundColor: "#fed7aa",
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
    strokeWidth: opts.strokeWidth ?? 2,
    strokeStyle: opts.dashed ? "dashed" : "solid",
    roughness: 0,
    label: label ? { text: label } : undefined,
  };
}

function center(box) {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

// The point on `box`'s edge that faces `toward` — the side an arrow between the
// two should leave from or land on, never the far side of the shape.
function edgeAnchor(box, toward) {
  const c = center(box);
  const o = center(toward);
  const dx = o.x - c.x;
  const dy = o.y - c.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? { x: box.x + box.w, y: c.y } : { x: box.x, y: c.y };
  }
  return dy > 0 ? { x: c.x, y: box.y + box.h } : { x: c.x, y: box.y };
}

const SIDE = {
  top: (b) => ({ x: b.x + b.w / 2, y: b.y }),
  bottom: (b) => ({ x: b.x + b.w / 2, y: b.y + b.h }),
  left: (b) => ({ x: b.x, y: b.y + b.h / 2 }),
  right: (b) => ({ x: b.x + b.w, y: b.y + b.h / 2 }),
};

// `from`/`to` opts pin an edge when the shortest route reads wrong — a parent
// hands down to a child from its underside, however the boxes happen to sit.
function arrow(id, from, to, label, opts = {}) {
  const start = opts.from ? SIDE[opts.from](from) : edgeAnchor(from, to);
  const end = opts.to ? SIDE[opts.to](to) : edgeAnchor(to, from);
  // Stop short of the shape so the arrowhead reads as pointing at the box
  // rather than as a notch cut into its border.
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const len = Math.hypot(dx, dy) || 1;
  const standoff = Math.min(opts.standoff ?? 7, len / 3);
  return {
    type: "arrow",
    id,
    x: start.x,
    y: start.y,
    // A bound arrow with no points of its own gets a route invented for it,
    // which lands off the anchors and skews the edge. Stating the points keeps
    // the geometry while the bindings still follow the shapes when edited.
    points: [
      [0, 0],
      [dx - (dx / len) * standoff, dy - (dy / len) * standoff],
    ],
    strokeColor: INK,
    strokeWidth: 2,
    roughness: 0,
    start: { id: from.id },
    end: { id: to.id },
    ...(opts.endArrowhead !== undefined ? { endArrowhead: opts.endArrowhead } : {}),
    ...(opts.startArrowhead !== undefined ? { startArrowhead: opts.startArrowhead } : {}),
    // Edge labels are annotations on the relationship, not titles: at body size
    // they swallow the line they sit on.
    label: label ? { text: label, fontSize: opts.labelSize ?? 15 } : undefined,
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

function line(id, x, y, points, opts = {}) {
  return {
    type: "line",
    id,
    x,
    y,
    points,
    strokeColor: opts.stroke ?? MUTED,
    backgroundColor: opts.fill ?? "transparent",
    fillStyle: "solid",
    strokeWidth: opts.strokeWidth ?? 2,
    strokeStyle: opts.dashed ? "dashed" : "solid",
    roughness: 0,
  };
}

// A run of absolute points. Closed by default, since Excalidraw only fills a
// line whose last point returns to its first; pass `open` for a polyline.
function poly(id, pts, opts = {}) {
  const [ox, oy] = pts[0];
  const run = opts.open ? pts : [...pts, pts[0]];
  return line(
    id,
    ox,
    oy,
    run.map(([x, y]) => [x - ox, y - oy]),
    opts
  );
}

function dot(id, cx, cy, r, opts = {}) {
  return ellipse(id, cx - r, cy - r, r * 2, r * 2, "", {
    fill: opts.fill ?? INK,
    stroke: opts.stroke ?? INK,
  });
}

// Free-standing arrow for edges that connect coordinates rather than shapes
// (sequence messages, elbow returns), where shape binding would re-route them.
// Points are offsets from the element origin, not steps from the previous point.
function path(id, x, y, points, label, opts = {}) {
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
    label: label ? { text: label, fontSize: opts.labelSize ?? 14 } : undefined,
  };
}

// Absolute waypoints → free arrow. Use for orthogonal elbows so a handoff never
// draws a diagonal through empty space.
function elbow(id, absolutePoints, opts = {}) {
  const [ox, oy] = absolutePoints[0];
  return path(
    id,
    ox,
    oy,
    absolutePoints.map(([x, y]) => [x - ox, y - oy]),
    opts.label,
    opts
  );
}

function doc(title, elements) {
  return {
    type: "excalidraw-skeleton",
    elements: [
      txt("title", 48, 28, title, { fontSize: 28, color: INK }),
      ...elements,
    ],
  };
}

const BUILDERS = {
  architecture: () => {
    // Both dependencies fan out from the API on separate rows. Elbows keep the
    // fan orthogonal — edgeAnchor would draw diagonals into Postgres/Queue.
    // Client sits outside the VPC — a boundary that contains everything is just a frame.
    // Worker closes the publish story: a queue with no consumer is wallpaper.
    const client = { id: "client", x: 40, y: 200, w: 120, h: 48 };
    const api = { id: "api", x: 260, y: 196, w: 140, h: 56 };
    const db = { id: "db", x: 520, y: 120, w: 160, h: 56 };
    const queue = { id: "queue", x: 520, y: 248, w: 160, h: 48 };
    const worker = { id: "worker", x: 520, y: 330, w: 160, h: 48 };
    const apiRight = api.x + api.w;
    const apiCy = api.y + api.h / 2;
    return doc("Architecture — components + boundaries", [
      zone("zone", 220, 88, 520, 340, ""),
      txt("zone-label", 236, 96, "Production VPC", { fontSize: 14, color: MUTED }),
      rect(client.id, client.x, client.y, client.w, client.h, "Client", { fill: PAPER, stroke: MUTED }),
      rect(api.id, api.x, api.y, api.w, api.h, "API"),
      rect(db.id, db.x, db.y, db.w, db.h, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
      rect(queue.id, queue.x, queue.y, queue.w, queue.h, "Queue"),
      rect(worker.id, worker.x, worker.y, worker.w, worker.h, "Worker", {
        fill: "#e2e8f0",
        labelSize: 15,
      }),
      arrow("a0", client, api, "", { from: "right", to: "left" }),
      elbow("a1", [
        [apiRight + 8, apiCy],
        [apiRight + 48, apiCy],
        [apiRight + 48, db.y + db.h / 2],
        [db.x - 8, db.y + db.h / 2],
      ]),
      elbow("a2", [
        [apiRight + 8, apiCy],
        [apiRight + 48, apiCy],
        [apiRight + 48, queue.y + queue.h / 2],
        [queue.x - 8, queue.y + queue.h / 2],
      ]),
      arrow("a3", queue, worker, "", { from: "bottom", to: "top" }),
      txt("a0-l", 148, 178, "POST /orders", { fontSize: 13, color: MUTED }),
      txt("a1-l", 430, 140, "read/write", { fontSize: 13, color: MUTED }),
      txt("a2-l", 438, 252, "publish", { fontSize: 13, color: MUTED }),
      txt("a3-l", 690, 300, "consume", { fontSize: 13, color: MUTED }),
      // Worker persists outcomes — consume without a writeback is a dead letter.
      elbow("a4", [
        [worker.x - 8, worker.y + worker.h / 2],
        [apiRight + 72, worker.y + worker.h / 2],
        [apiRight + 72, db.y + db.h + 8],
        [db.x + db.w / 2, db.y + db.h + 8],
        [db.x + db.w / 2, db.y + db.h + 4],
      ]),
      txt("a4-l", 430, 360, "ack → UPDATE", { fontSize: 12, color: MUTED }),
      txt("note", 40, 280, "edge stays out", { fontSize: 12, color: MUTED }),
      txt("trust", 40, 304, "TLS terminates at API", { fontSize: 12, color: MUTED }),
      txt("cdn", 40, 328, "CDN not in VPC · metrics from API", { fontSize: 12, color: MUTED }),
      txt("az", 40, 352, "API AZ-a · Postgres AZ-b · Worker AZ-a", { fontSize: 12, color: MUTED }),
      // Data pocket callout sits right of Postgres — not on its bound label.
      txt("data-l", 690, 128, "data subnet", { fontSize: 12, color: MUTED }),
      txt("slo-a", 40, 376, "SLO: API p99 < 80ms · Worker lag < 30s", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("qdepth", 690, 300, "depth < 100", { fontSize: 11, color: MUTED }),
      txt("repl", 690, 152, "replica lag < 2s", { fontSize: 11, color: MUTED }),
      txt("cg", 690, 348, "cg: orders-v2", { fontSize: 11, color: MUTED }),
      txt("fail", 260, 168, "failover: API multi-AZ", { fontSize: 11, color: MUTED }),
      txt("hc", 260, 264, "healthz /ready", { fontSize: 11, color: MUTED }),
      txt("wal", 690, 176, "WAL shipping", { fontSize: 11, color: MUTED }),
      txt("pub-n", 690, 248, "topic: orders.v2", { fontSize: 11, color: MUTED }),
      txt("worker-n", 690, 372, "concurrency 8", { fontSize: 11, color: MUTED }),
      txt("api-n", 280, 264, "3 replicas", { fontSize: 11, color: MUTED }),
      txt("client-ver", 40, 180, "iOS + Web", { fontSize: 11, color: MUTED }),
      txt("pg-ver", 690, 100, "Postgres 16", { fontSize: 11, color: MUTED }),
      // CDN lives at the edge — naming it in a caption without a box is wallpaper.
      rect("cdn-box", 40, 88, 120, 36, "CDN", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 14,
      }),
      txt("cdn-ttl", 40, 64, "TTL 60s · edge", { fontSize: 11, color: MUTED }),
      elbow(
        "cdn-api",
        [
          [160, 106],
          [220, 106],
          [220, apiCy],
          [api.x - 8, apiCy],
        ],
        { stroke: MUTED, dashed: true }
      ),
      txt("cdn-l", 168, 84, "cache miss → API", { fontSize: 11, color: MUTED }),
      // Queue depth bar — depth < 100 is a fill, not only a caption.
      line("qbar", 690, 280, [[0, 0], [80, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("qfill", 690, 280, [[0, 0], [24, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("qbar-l", 690, 288, "depth 30/100", { fontSize: 11, color: MUTED }),
      // Replica lag bar beside Postgres — <2s is a fill.
      line("repl-bar", 690, 200, [[0, 0], [80, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("repl-fill", 690, 200, [[0, 0], [16, 0]], { stroke: "#15803d", strokeWidth: 6 }),
      txt("repl-bar-l", 690, 212, "lag 0.4s / 2s", { fontSize: 11, color: "#15803d" }),
      // Worker concurrency fill — 8 of capacity.
      line("conc-bar", 690, 390, [[0, 0], [80, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("conc-fill", 690, 390, [[0, 0], [64, 0]], { stroke: MUTED, strokeWidth: 6 }),
      txt("conc-bar-l", 690, 402, "conc 8", { fontSize: 11, color: MUTED }),
      // API replicas fill — 3.
      line("rep-bar", 260, 280, [[0, 0], [100, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("rep-fill", 260, 280, [[0, 0], [100, 0]], { stroke: MUTED, strokeWidth: 6 }),
      txt("rep-bar-l", 260, 292, "3 API replicas", { fontSize: 11, color: MUTED }),
      // Healthz chip.
      rect("hz-chip", 40, 400, 120, 28, "healthz /ready", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // CDN TTL chip at the edge.
      rect("cdn-chip", 40, 440, 120, 28, "CDN TTL 60s", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Topic chip beside Queue.
      rect("topic-chip", 690, 420, 120, 28, "orders.v2", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Multi-AZ chip.
      rect("az-chip", 400, 320, 120, 28, "multi-AZ", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Postgres version chip.
      rect("pg16", 690, 60, 120, 28, "Postgres 16", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Client surface stamp.
      rect("ios-web", 40, 480, 100, 28, "iOS + Web", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  // Shapes are declared before any arrow that binds to them: Excalidraw resolves
  // bindings during conversion, and an arrow that names a later element gets skewed.
  flowchart: () => {
    // Exit the diamond on the sides, then drop — never a diagonal through air.
    const start = { id: "start", x: 310, y: 90, w: 120, h: 48 };
    const decide = { id: "decide", x: 290, y: 180, w: 160, h: 80 };
    const yes = { id: "yes", x: 100, y: 360, w: 160, h: 64 };
    const no = { id: "no", x: 500, y: 360, w: 160, h: 64 };
    const dCy = decide.y + decide.h / 2;
    return doc("Flowchart — branching decisions", [
      ellipse(start.id, start.x, start.y, start.w, start.h, "PR opened"),
      diamond(decide.id, decide.x, decide.y, decide.w, decide.h, "audit\npass?"),
      rect(yes.id, yes.x, yes.y, yes.w, yes.h, "Merge\n+ deploy"),
      rect(no.id, no.x, no.y, no.w, no.h, "Fix labels\nre-render", {
        fill: "#fed7aa",
        stroke: ACCENT,
      }),
      arrow("a0", start, decide, "", { from: "bottom", to: "top" }),
      elbow("a1", [
        [decide.x, dCy],
        [yes.x + yes.w / 2, dCy],
        [yes.x + yes.w / 2, yes.y - 8],
      ]),
      txt("a1-l", yes.x + yes.w / 2 - 14, dCy - 22, "yes", { fontSize: 14, color: MUTED }),
      elbow("a2", [
        [decide.x + decide.w, dCy],
        [no.x + no.w / 2, dCy],
        [no.x + no.w / 2, no.y - 8],
      ]),
      txt("a2-l", no.x + no.w / 2 - 10, dCy - 22, "no", { fontSize: 14, color: ACCENT }),
      // Fix → re-audit: the taste gate is a loop, not a dead-end reject.
      elbow(
        "retry",
        [
          [no.x + no.w + 8, no.y + no.h / 2],
          [720, no.y + no.h / 2],
          [720, dCy],
          [decide.x + decide.w + 8, dCy],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("retry-l", 680, 300, "again", { fontSize: 13, color: ACCENT }),
      // Merge lands in Deploy — yes without a destination is a dead end.
      rect("deploy", 100, 450, 160, 44, "Deploy prod", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 14,
      }),
      arrow("a3", yes, { id: "deploy", x: 100, y: 450, w: 160, h: 44 }, "", {
        from: "bottom",
        to: "top",
      }),
      txt("a3-l", 270, 460, "green checks", { fontSize: 11, color: "#15803d" }),
      txt("deploy-n", 270, 484, "canary 10%", { fontSize: 11, color: MUTED }),
      txt("rule", 100, 520, "taste gate blocks merge until the PNG reads clean", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("ci", 100, 544, "CI: check-type-labels · types-regression", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("owner", 100, 568, "taste gate owner: Design lead on-call", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("pr", 100, 72, "PR #4821 · feat/beat-official-excalidraw-mcp", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("sha", 500, 72, "SHA abc12ef · required checks", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("retry-n", 680, 340, "retries this week: 3", { fontSize: 11, color: ACCENT }),
      txt("yes-ms", 100, 340, "merge path ~4 min", { fontSize: 11, color: MUTED }),
      txt("no-ms", 500, 340, "fix path ~12 min", { fontSize: 11, color: ACCENT }),
      txt("audit-tool", 100, 592, "tool: check-type-labels", { fontSize: 11, color: MUTED }),
      // Retry stamp — 3 retries this week is a chip on the no path.
      rect("retry-chip", 680, 380, 120, 36, "retries ×3", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 13,
      }),
      // Canary chip under Deploy.
      rect("canary", 100, 510, 120, 28, "canary 10%", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Required checks chip.
      rect("req-chip", 500, 100, 140, 28, "required checks", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Fix-path duration chip on the no branch.
      rect("fix-chip", 500, 440, 140, 28, "fix ~12 min", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Merge-path duration chip on the yes branch.
      rect("merge-chip", 280, 600, 140, 28, "merge ~4 min", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Canary percent already stamped — add SHA chip.
      rect("sha-chip", 500, 140, 140, 28, "SHA abc12ef", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // PR number chip.
      rect("pr-chip", 280, 640, 120, 28, "PR #4821", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Taste-gate tool stamp.
      rect("tool-chip", 280, 680, 160, 28, "labels gate", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  sequence: () => {
    // Lifelines hang from box centres. Message labels sit ABOVE the shaft as
    // free text — bound labels land on the line and, at Cascadia width, collide.
    // Cache miss is the argument: the write still hits DB.
    const cx = { client: 120, api: 320, cache: 520, db: 720 };
    const lifeline = (id, x) => line(id, x, 168, [[0, 0], [0, 330]], { dashed: true });
    return doc("Sequence — messages over time", [
      rect("client", cx.client - 60, 110, 120, 48, "Client"),
      rect("api", cx.api - 60, 110, 120, 48, "API"),
      rect("cache", cx.cache - 60, 110, 120, 48, "Cache", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      rect("db", cx.db - 60, 110, 120, 48, "DB"),
      lifeline("ll1", cx.client),
      lifeline("ll2", cx.api),
      lifeline("ll3", cx.cache),
      lifeline("ll4", cx.db),
      path("m1", cx.client, 200, [[0, 0], [cx.api - cx.client - 8, 0]], ""),
      txt("m1-l", cx.client + 28, 178, "POST /orders", { fontSize: 13, color: MUTED }),
      path("m2", cx.api, 250, [[0, 0], [cx.cache - cx.api - 8, 0]], ""),
      txt("m2-l", cx.api + 48, 228, "GET order?", { fontSize: 13, color: MUTED }),
      path("m3", cx.cache, 300, [[0, 0], [cx.api - cx.cache + 8, 0]], "", {
        dashed: true,
        stroke: ACCENT,
      }),
      txt("m3-l", cx.api + 56, 278, "miss", { fontSize: 13, color: ACCENT }),
      path("m4", cx.api, 350, [[0, 0], [cx.db - cx.api - 8, 0]], ""),
      txt("m4-l", cx.api + 140, 328, "INSERT", { fontSize: 13, color: MUTED }),
      path("m5", cx.db, 400, [[0, 0], [cx.api - cx.db + 8, 0]], "", { dashed: true, stroke: MUTED }),
      txt("m5-l", cx.api + 140, 378, "1 row", { fontSize: 13, color: MUTED }),
      path("m5b", cx.api, 430, [[0, 0], [cx.cache - cx.api - 8, 0]], ""),
      txt("m5b-l", cx.api + 48, 408, "SET order", { fontSize: 13, color: MUTED }),
      path("m6", cx.api, 470, [[0, 0], [cx.client - cx.api + 8, 0]], "", {
        dashed: true,
        stroke: MUTED,
      }),
      txt("m6-l", cx.client + 28, 448, "201 Created", { fontSize: 13, color: MUTED }),
      txt("budget", 100, 510, "cache miss forces the write · then warm the cache", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("timeout", 100, 534, "budget: < 250ms end-to-end on miss path", {
        fontSize: 12,
        color: MUTED,
      }),
      // Time axis: a sequence without ticks is just stacked arrows.
      txt("t0", 40, 194, "t0", { fontSize: 11, color: MUTED }),
      txt("t1", 40, 244, "t1", { fontSize: 11, color: MUTED }),
      txt("t2", 40, 294, "t2", { fontSize: 11, color: MUTED }),
      txt("t3", 40, 344, "t3", { fontSize: 11, color: MUTED }),
      txt("t4", 40, 424, "t4", { fontSize: 11, color: MUTED }),
      txt("t5", 40, 464, "t5", { fontSize: 11, color: MUTED }),
      txt("warm", 520, 510, "warm hit skips INSERT · < 40ms", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("hit-path", 520, 534, "warm: GET → hit → 200 (no DB)", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("auth", 100, 558, "auth: Bearer · idempotency-key on POST", {
        fontSize: 12,
        color: MUTED,
      }),
      // Per-hop budgets: ticks alone don't prove the 250ms claim.
      txt("ms1", 760, 194, "12ms", { fontSize: 11, color: MUTED }),
      txt("ms2", 760, 244, "6ms", { fontSize: 11, color: MUTED }),
      txt("ms3", 760, 294, "4ms miss", { fontSize: 11, color: ACCENT }),
      txt("ms4", 760, 344, "110ms", { fontSize: 11, color: MUTED }),
      txt("ms5", 760, 424, "8ms SET", { fontSize: 11, color: MUTED }),
      txt("sum-ms", 760, 510, "≈140ms miss path", { fontSize: 11, color: ACCENT }),
      // Activation bar on API during the miss path — time spent, not just arrows.
      rect("act", cx.api - 8, 240, 16, 200, "", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 1,
      }),
      txt("act-l", cx.api + 12, 330, "API busy", { fontSize: 11, color: MUTED }),
      txt("db-busy", cx.db + 12, 360, "DB 110ms", { fontSize: 11, color: MUTED }),
      txt("cache-ms", cx.cache + 12, 268, "GET 6ms", { fontSize: 11, color: MUTED }),
      txt("idemp", 100, 582, "idempotency-key TTL 24h", { fontSize: 11, color: MUTED }),
      txt("miss-pct", 520, 558, "miss rate 7%", { fontSize: 11, color: ACCENT }),
      txt("post-n", cx.client + 28, 158, "idempotent", { fontSize: 11, color: MUTED }),
      // Deadline tick: the 250ms budget is a mark on the time axis, not only a caption.
      line("deadline", 40, 490, [[0, 0], [700, 0]], {
        stroke: ACCENT,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("deadline-l", 40, 496, "250ms budget", { fontSize: 11, color: ACCENT }),
      txt("headroom", 760, 480, "≈110ms headroom", { fontSize: 11, color: "#15803d" }),
      // Warm-hit skip badge — the alternate path that avoids INSERT.
      rect("warm-badge", 520, 180, 100, 32, "warm hit", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      txt("warm-badge-l", 520, 160, "<40ms · no DB", { fontSize: 11, color: "#15803d" }),
      // Miss rate bar — 7% is a fill beside the miss path.
      line("miss-bar", 760, 520, [[0, 0], [100, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("miss-fill", 760, 520, [[0, 0], [7, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("miss-bar-l", 760, 532, "miss 7%", { fontSize: 11, color: ACCENT }),
      // Idempotency TTL chip.
      rect("ttl-chip", 100, 600, 140, 28, "idem TTL 24h", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // DB busy chip on INSERT hop.
      rect("db-chip", 720, 380, 100, 28, "DB 110ms", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Headroom chip — budget leftover after miss path.
      rect("head-chip", 520, 600, 140, 28, "110ms headroom", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Miss-path sum chip.
      rect("miss-sum", 720, 560, 140, 28, "miss ≈140ms", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Budget chip.
      rect("bud-chip", 100, 640, 140, 28, "budget 250ms", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // 201 Created chip.
      rect("created", 100, 680, 120, 28, "201 Created", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Cache GET latency stamp.
      rect("get6", 520, 640, 100, 28, "GET 6ms", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Idempotent POST stamp.
      rect("idem", 100, 720, 120, 28, "idempotent", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  state: () => {
    const draft = { id: "draft", x: 100, y: 160, w: 140, h: 56 };
    const review = { id: "review", x: 380, y: 160, w: 140, h: 56 };
    const live = { id: "live", x: 660, y: 160, w: 140, h: 56 };
    const archived = { id: "archived", x: 660, y: 300, w: 140, h: 48 };
    return doc("State machine — allowed transitions", [
      ellipse("entry", 40, 172, 28, 28, "", { fill: INK, stroke: INK }),
      arrow("t0", { id: "entry", x: 40, y: 172, w: 28, h: 28 }, draft, "", {
        from: "right",
        to: "left",
      }),
      rect(draft.id, draft.x, draft.y, draft.w, draft.h, "Draft · 3"),
      rect(review.id, review.x, review.y, review.w, review.h, "Review · 1"),
      rect(live.id, live.x, live.y, live.w, live.h, "Live · 12", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
      rect(archived.id, archived.x, archived.y, archived.w, archived.h, "Archived · 48", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 14,
      }),
      arrow("t1", draft, review, ""),
      arrow("t2", review, live, ""),
      arrow("t4", live, archived, "", { from: "bottom", to: "top" }),
      txt("t1-l", 268, 138, "submit", { fontSize: 14, color: MUTED }),
      txt("t2-l", 548, 138, "approve", { fontSize: 14, color: MUTED }),
      txt("t4-l", 710, 248, "retire", { fontSize: 13, color: MUTED }),
      // Rejection is the edge that makes it a machine, not a pipeline.
      elbow(
        "t3",
        [
          [review.x + review.w / 2, review.y + review.h + 8],
          [review.x + review.w / 2, 300],
          [draft.x + draft.w / 2, 300],
          [draft.x + draft.w / 2, draft.y + draft.h + 8],
        ],
        { stroke: ACCENT }
      ),
      txt("t3-l", 220, 312, "reject", { fontSize: 14, color: ACCENT }),
      // Re-entry count: reject isn't free — two strikes force a redesign.
      txt("strikes", 100, 340, "reject ×2 → redesign ticket", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("rule", 100, 380, "no Draft → Live: every ship passes Review", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("term", 100, 404, "Archived is terminal — no path back to Live", {
        fontSize: 12,
        color: MUTED,
      }),
      // Sit under Live/Archived so it never collides with the terminal rule.
      txt("sla-rev", 520, 380, "Review SLA: < 1 business day", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("owner", 520, 404, "approver = Design lead", {
        fontSize: 12,
        color: MUTED,
      }),
      // Soft withdraw: Live can return to Draft only via change ticket.
      elbow(
        "t5",
        [
          [live.x + live.w + 8, live.y + live.h / 2],
          [820, live.y + live.h / 2],
          [820, 380],
          [draft.x + draft.w / 2, 380],
          [draft.x + draft.w / 2, draft.y + draft.h + 8],
        ],
        { stroke: MUTED, dashed: true }
      ),
      txt("t5-l", 740, 360, "change ticket", { fontSize: 12, color: MUTED }),
      txt("inflight", 100, 428, "in flight: 3 Draft · 1 Review · 12 Live", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("median", 380, 138, "median 4h in Review", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("rate", 100, 452, "submit rate ≈ 4 / week · approve rate 92%", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("queue-d", 240, 220, "queue depth 1", { fontSize: 11, color: MUTED }),
      txt("live-age", 810, 168, "oldest Live 14d", { fontSize: 11, color: MUTED }),
      txt("arch-n", 810, 320, "Archived +48 lifetime", { fontSize: 11, color: MUTED }),
      txt("draft-age", 100, 138, "oldest Draft 2d", { fontSize: 11, color: MUTED }),
      txt("reject-n", 220, 340, "rejects this wk: 2", { fontSize: 11, color: ACCENT }),
      txt("archive-n", 660, 360, "+4 this month", { fontSize: 11, color: MUTED }),
      // redesign is a real state — caption-only "→ redesign ticket" is wallpaper.
      rect("redesign", 380, 480, 140, 44, "Redesign", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 14,
      }),
      elbow(
        "t6",
        [
          [draft.x + draft.w / 2, draft.y + draft.h + 8],
          [draft.x + draft.w / 2, 460],
          [450, 460],
          [450, 472],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("t6-l", 260, 448, "×2 reject →", { fontSize: 11, color: ACCENT }),
      txt("redesign-n", 530, 492, "open: 1 ticket", { fontSize: 11, color: ACCENT }),
      // Approve rate bar — 92% is a fill under the machine.
      line("apr-bar", 660, 420, [[0, 0], [140, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("apr-fill", 660, 420, [[0, 0], [129, 0]], { stroke: "#15803d", strokeWidth: 6 }),
      txt("apr-bar-l", 660, 432, "approve 92%", { fontSize: 11, color: "#15803d" }),
      // In-flight stack — Draft/Review/Live counts as stacked fills.
      line("inf-d", 100, 500, [[0, 0], [60, 0]], { stroke: MUTED, strokeWidth: 8 }),
      line("inf-r", 170, 500, [[0, 0], [20, 0]], { stroke: ACCENT, strokeWidth: 8 }),
      line("inf-l", 200, 500, [[0, 0], [120, 0]], { stroke: "#15803d", strokeWidth: 8 }),
      txt("inf-bar-l", 100, 512, "in flight 3·1·12", { fontSize: 11, color: MUTED }),
      // Oldest Live age chip.
      rect("old-live", 810, 200, 110, 28, "oldest 14d", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Terminal stamp on Archived — no path back.
      rect("term-chip", 810, 400, 110, 28, "terminal", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Redesign open chip.
      rect("rd-chip", 680, 520, 120, 28, "redesign ×1", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Approve SLA chip.
      rect("sla-chip", 520, 440, 140, 28, "Review < 1d", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Live count chip.
      rect("live-n", 660, 100, 100, 28, "Live · 12", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Draft count chip.
      rect("draft-n", 100, 100, 100, 28, "Draft · 3", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Review count chip.
      rect("rev-n", 380, 100, 110, 28, "Review · 1", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Approve rate stamp.
      rect("apr92", 660, 460, 120, 28, "approve 92%", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
    ]);
  },
  er: () => {
    const user = { id: "user", x: 80, y: 140, w: 170, h: 120 };
    const order = { id: "order", x: 370, y: 140, w: 170, h: 120 };
    const item = { id: "item", x: 660, y: 140, w: 170, h: 120 };
    const product = { id: "product", x: 660, y: 300, w: 170, h: 88 };
    // Pure lines for the shaft — hydrated arrows still grow a tip even when
    // endArrowhead is null, which paints over the crow's foot.
    const shaft = (id, from, to) => {
      const y = from.y + from.h / 2;
      return line(id, from.x + from.w + 4, y, [[0, 0], [to.x - 20 - (from.x + from.w + 4), 0]], {
        stroke: INK,
        strokeWidth: 2,
      });
    };
    const foot = (id, edgeX, cy) => [
      line(`${id}-a`, edgeX - 18, cy - 12, [[0, 0], [18, 12]], { stroke: INK, strokeWidth: 2 }),
      line(`${id}-b`, edgeX - 18, cy, [[0, 0], [18, 0]], { stroke: INK, strokeWidth: 2 }),
      line(`${id}-c`, edgeX - 18, cy + 12, [[0, 0], [18, -12]], { stroke: INK, strokeWidth: 2 }),
      // Mandatory one-side bar just before the fork.
      line(`${id}-bar`, edgeX - 22, cy - 10, [[0, 0], [0, 20]], { stroke: INK, strokeWidth: 2 }),
    ];
    return doc("ER — entities + cardinality", [
      rect(user.id, user.x, user.y, user.w, user.h, "User\nid PK\nemail"),
      rect(order.id, order.x, order.y, order.w, order.h, "Order\nid PK\nuser_id FK\nstatus\ncreated_at"),
      rect(item.id, item.x, item.y, item.w, item.h, "LineItem\nid PK\norder_id FK\nqty\nsku", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      rect(product.id, product.x, product.y, product.w, product.h, "Product\nid PK\nsku UNIQUE", {
        fill: "#e2e8f0",
        labelSize: 15,
      }),
      shaft("r1", user, order),
      shaft("r2", order, item),
      ...foot("f1", order.x, order.y + order.h / 2),
      ...foot("f2", item.x, item.y + item.h / 2),
      elbow(
        "r3",
        [
          [item.x + item.w / 2, item.y + item.h + 8],
          [item.x + item.w / 2, product.y - 8],
        ],
        { stroke: INK }
      ),
      txt("r1-l", 278, 118, "1:N", { fontSize: 14, color: MUTED }),
      txt("r2-l", 568, 118, "1:N", { fontSize: 14, color: MUTED }),
      txt("r3-l", 580, 268, "N:1 sku", { fontSize: 13, color: MUTED }),
      txt("one1", 248, 168, "1", { fontSize: 12, color: MUTED }),
      txt("one2", 538, 168, "1", { fontSize: 12, color: MUTED }),
      txt("note", 80, 420, "one user → many orders → many line items → one Product", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("idx", 80, 444, "indexes: order(user_id), line_item(order_id), product(sku)", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("uniq", 80, 468, "email UNIQUE · status ∈ {open, paid, void}", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("casc", 80, 492, "ON DELETE CASCADE line_item ← order", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("vol", 80, 516, "scale: ~50k users · ~2M orders/yr · avg 3.2 lines/order", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("sku-note", 660, 400, "sku resolves via Product", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("rows", 370, 280, "~2M Order rows", { fontSize: 11, color: MUTED }),
      txt("fk-chk", 80, 540, "FK check: line_item.sku → product.sku enforced", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("pk-n", 80, 280, "4 PKs · 3 FKs", { fontSize: 11, color: MUTED }),
      txt("status-enum", 370, 300, "status enum", { fontSize: 11, color: MUTED }),
      // Status enum as a chip — open/paid/void is a closed set, not only a caption.
      rect("enum", 80, 320, 160, 56, "open · paid · void", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 13,
      }),
      txt("enum-l", 80, 384, "Order.status", { fontSize: 11, color: MUTED }),
      // Cascade rule chip — delete path is enforceable.
      rect("casc-chip", 370, 420, 160, 28, "CASCADE lines", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Scale chip — ~2M orders/yr.
      rect("vol-chip", 560, 420, 140, 28, "~2M orders/yr", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // PK/FK count chip.
      rect("pk-chip", 80, 400, 120, 28, "4 PK · 3 FK", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Avg lines chip.
      rect("avg-chip", 370, 460, 140, 28, "avg 3.2 lines", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Users scale chip.
      rect("user-n", 80, 440, 120, 28, "~50k users", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // UNIQUE email chip.
      rect("email-u", 560, 500, 140, 28, "email UNIQUE", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Product sku chip.
      rect("sku-chip", 660, 440, 140, 28, "sku UNIQUE", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Product PK stamp.
      rect("prod-pk", 660, 480, 120, 28, "Product PK", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  timeline: () => {
    const axisY = 260;
    const events = [
      { id: "e1", x: 200, label: "MVP", sub: "v0 ship", accent: false },
      { id: "e2", x: 360, label: "Themes", sub: "brand packs", accent: false },
      { id: "e3", x: 520, label: "MCP app", sub: "live now", accent: true },
      { id: "e4", x: 680, label: "Audit", sub: "taste gate", accent: false },
    ];
    const tick = (id, x) => line(id, x, axisY - 6, [[0, 0], [0, 12]], { strokeWidth: 1, stroke: MUTED });
    // Phase brackets under the axis: the timeline's claim is duration, not just dots.
    const bracket = (id, x0, x1, label, y = axisY + 56) => [
      line(`${id}-l`, x0, y - 8, [[0, 0], [0, 8]], { strokeWidth: 1, stroke: MUTED }),
      line(`${id}-r`, x1, y - 8, [[0, 0], [0, 8]], { strokeWidth: 1, stroke: MUTED }),
      line(`${id}-h`, x0, y, [[0, 0], [x1 - x0, 0]], { strokeWidth: 1, stroke: MUTED }),
      txt(`${id}-t`, (x0 + x1) / 2 - label.length * 3.2, y + 8, label, {
        fontSize: 12,
        color: MUTED,
      }),
    ];
    return doc("Timeline — events on an axis", [
      line("axis", 120, axisY, [[0, 0], [660, 0]], { stroke: INK }),
      ...[200, 280, 360, 440, 520, 600, 680, 760].map((x, i) => tick(`tk${i}`, x)),
      ...events.flatMap((e) => [
        dot(e.id, e.x, axisY, e.accent ? 7 : 6, e.accent ? { fill: ACCENT, stroke: ACCENT } : {}),
        line(`${e.id}-stem`, e.x, axisY - 28, [[0, 0], [0, 22]], {
          strokeWidth: 1,
          stroke: e.accent ? ACCENT : MUTED,
        }),
        txt(`${e.id}-l`, e.x - e.label.length * 4, axisY - 52, e.label, {
          fontSize: 15,
          color: e.accent ? ACCENT : INK,
        }),
        txt(`${e.id}-s`, e.x - e.sub.length * 3.2, axisY + 18, e.sub, {
          fontSize: 12,
          color: MUTED,
        }),
      ]),
      txt("t0", 112, axisY + 40, "2024", { fontSize: 13, color: MUTED }),
      txt("t1", 710, axisY + 40, "2026", { fontSize: 13, color: MUTED }),
      line("now", 520, axisY + 48, [[0, 0], [0, 28]], { stroke: ACCENT, strokeWidth: 1 }),
      txt("now-l", 500, axisY + 78, "now", { fontSize: 12, color: ACCENT }),
      ...bracket("ph1", 200, 360, "build packs · 6mo"),
      ...bracket("ph2", 360, 520, "productize · 9mo", axisY + 88),
      ...bracket("ph3", 520, 680, "harden · 4mo", axisY + 56),
      // Future stub past Audit: the axis claims a destination, not an open end.
      line("next", 760, axisY - 6, [[0, 0], [0, 12]], { strokeWidth: 1, stroke: MUTED }),
      // Destination diamond replaces the old "v2?" caption.
      txt("story", 120, 120, "from shippable MVP to a taste gate that blocks bad diagrams", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("risk", 120, 144, "risk: Audit slips if MCP app stays the forever now", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("gate", 120, 168, "Audit = check-type-labels · types-regression must stay green", {
        fontSize: 12,
        color: MUTED,
      }),
      // Slip bar on Audit: risk isn't only a caption — it owns a span.
      line("slip-h", 520, axisY - 70, [[0, 0], [160, 0]], { stroke: ACCENT, dashed: true, strokeWidth: 1 }),
      txt("slip-l", 540, axisY - 88, "±6wk slip risk", { fontSize: 12, color: ACCENT }),
      txt("owner-tl", 120, 192, "owner: PMM · Audit owner: Design lead", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("mvp-d", 170, axisY - 72, "Mar '24", { fontSize: 11, color: MUTED }),
      txt("thm-d", 340, axisY - 72, "Sep '24", { fontSize: 11, color: MUTED }),
      txt("mcp-d", 500, axisY - 72, "Jun '25", { fontSize: 11, color: ACCENT }),
      txt("aud-d", 660, axisY - 72, "TBD", { fontSize: 11, color: MUTED }),
      // Freeze before Audit: taste gate needs a quiet window, not a forever now.
      line("frz", 600, axisY + 18, [[0, 0], [80, 0]], { stroke: ACCENT, dashed: true, strokeWidth: 1 }),
      txt("frz-l", 608, axisY + 28, "freeze", { fontSize: 11, color: ACCENT }),
      txt("span", 120, axisY + 118, "axis span ≈ 22mo · harden must close before freeze ends", {
        fontSize: 12,
        color: MUTED,
      }),
      // Decision gate: Audit doesn't start until MCP green for 2 releases.
      diamond("gate-d", 580, 100, 48, 40, ""),
      txt("gate-d-l", 568, 92, "go?", { fontSize: 11, color: ACCENT }),
      txt("gate-rule", 120, axisY + 142, "Audit starts only after 2 green MCP releases", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("ph-sum", 120, axisY + 166, "phases: 6 + 9 + 4 = 19mo active · 3mo freeze buffer", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("green-n", 500, 144, "2 green releases", { fontSize: 11, color: "#15803d" }),
      txt("mcp-live", 500, axisY + 40, "MCP live", { fontSize: 11, color: ACCENT }),
      txt("mvp-ship", 170, axisY + 40, "shipped", { fontSize: 11, color: MUTED }),
      txt("audit-tbd", 660, axisY + 40, "gate open", { fontSize: 11, color: MUTED }),
      // Two green MCP release ticks before the go gate — the rule is countable.
      ellipse("g1", 500, 100, 18, 18, "", { fill: "#dcfce7", stroke: "#15803d" }),
      ellipse("g2", 530, 100, 18, 18, "", { fill: "#dcfce7", stroke: "#15803d" }),
      txt("g1-l", 498, 84, "R1", { fontSize: 10, color: "#15803d" }),
      txt("g2-l", 528, 84, "R2", { fontSize: 10, color: "#15803d" }),
      line("g-rail", 548, 109, [[0, 0], [32, 0]], { stroke: "#15803d", strokeWidth: 1 }),
      // v2 stub past Audit — destination is a diamond, not only "v2?" text.
      diamond("v2", 740, 220, 40, 36, ""),
      txt("v2-l", 780, 228, "v2 pack", { fontSize: 11, color: MUTED }),
      // Active months fill — 19 of 22 is a bar under the axis story.
      line("act-bar", 120, axisY + 190, [[0, 0], [220, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("act-fill", 120, axisY + 190, [[0, 0], [190, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("act-bar-l", 120, axisY + 202, "19mo active / 22mo span", { fontSize: 11, color: ACCENT }),
      // Freeze buffer fill — 3mo of 22.
      line("frz-bar", 400, axisY + 190, [[0, 0], [160, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("frz-fill", 400, axisY + 190, [[0, 0], [22, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("frz-bar-l", 400, axisY + 202, "freeze 3mo buffer", { fontSize: 11, color: ACCENT }),
      // MCP live stamp at now.
      rect("mcp-live-chip", 640, 100, 100, 28, "MCP live", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Slip-risk chip on Audit — ±6wk is a stamp.
      rect("slip-chip", 700, 140, 110, 28, "±6wk slip", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Gate-pending chip until 2 green MCP releases.
      rect("gate-chip", 440, 60, 120, 28, "gate pending", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Harden phase chip.
      rect("hard-ph", 700, 440, 120, 28, "harden 4mo", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Build packs phase chip.
      rect("build-ph", 200, 480, 120, 28, "build 6mo", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Productize phase chip.
      rect("prod-ph", 360, 480, 140, 28, "productize 9mo", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // PMM owner chip — clear of v2 pack free text.
      rect("pmm", 40, 220, 100, 28, "PMM owns", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Audit taste-gate stamp.
      rect("audit-gate", 700, 480, 120, 28, "Audit gate", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  gantt: () => {
    const week = (id, x, label) => [
      line(id, x, 140, [[0, 0], [0, 200]], { dashed: true, strokeWidth: 1 }),
      txt(`${id}-l`, x - 12, 118, label, { fontSize: 13, color: MUTED }),
    ];
    return doc("Gantt — phases on a timeline", [
      ...week("w1", 220, "W1"),
      ...week("w2", 290, "W2"),
      ...week("w3", 360, "W3"),
      ...week("w4", 430, "W4"),
      ...week("w5", 500, "W5"),
      ...week("w6", 570, "W6"),
      ...week("w7", 640, "W7"),
      txt("own1", 60, 168, "Design · Sam", { fontSize: 13, color: MUTED }),
      txt("own2", 60, 228, "Build · Eng", { fontSize: 13, color: MUTED }),
      txt("own3", 60, 288, "Ship · Ops", { fontSize: 13, color: MUTED }),
      rect("p1", 160, 160, 200, 34, "wireframes → tokens"),
      // Build runs past Ship's start — the slip is the argument, so the bars must overlap.
      rect("p2", 290, 220, 300, 34, "renderer + fixtures", { fill: "#fef3c7" }),
      rect("p3", 470, 280, 200, 34, "docs + cutover", { fill: "#dcfce7", stroke: "#15803d" }),
      // Progress ticks sit above the row so they never land on the bar fill.
      txt("pct1", 370, 140, "100%", { fontSize: 11, color: MUTED }),
      txt("pct2", 600, 200, "62%", { fontSize: 11, color: ACCENT }),
      txt("pct3", 680, 248, "0% Ship", { fontSize: 11, color: MUTED }),
      // Without a now-line a Gantt only says what the plan is, never whether it holds.
      line("today", 420, 132, [[0, 0], [0, 216]], { stroke: ACCENT, strokeWidth: 2 }),
      txt("today-l", 392, 112, "today", { fontSize: 13, color: ACCENT }),
      txt("slip", 600, 248, "Build still open\nwhen Ship starts", { fontSize: 13, color: MUTED }),
      elbow(
        "dep",
        [
          [360, 194],
          [360, 212],
        ],
        { stroke: MUTED }
      ),
      txt("crit", 160, 140, "critical path", { fontSize: 12, color: MUTED }),
      txt("block", 680, 228, "blocked\non Build", { fontSize: 12, color: ACCENT }),
      txt("ms", 750, 300, "go-live W8", { fontSize: 13, color: "#15803d" }),
      txt("conf", 640, 364, "confidence: low until Build closes", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("buf", 160, 364, "buffer: W8–W9 soft launch · hard cut W10", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("risk-g", 160, 388, "risk: Build slip ≥ 1wk → cut docs scope", {
        fontSize: 12,
        color: ACCENT,
      }),
      // Milestone pin at go-live: a date without a tick is just caption wallpaper.
      line("ms-tick", 710, 280, [[0, 0], [0, 12]], { stroke: "#15803d", strokeWidth: 2 }),
      txt("done-d", 160, 412, "Design closed W3", { fontSize: 11, color: MUTED }),
      txt("burn", 290, 412, "Build burn 38d of 60", { fontSize: 11, color: ACCENT }),
      txt("w8", 750, 320, "W8 go-live", { fontSize: 11, color: "#15803d" }),
      txt("overlap-g", 420, 200, "overlap W4–W5", { fontSize: 11, color: ACCENT }),
      txt("ftes", 60, 340, "FTEs: Sam 1 · Eng 3 · Ops 1", { fontSize: 11, color: MUTED }),
      txt("dep-n", 360, 180, "FS: Design → Build", { fontSize: 11, color: MUTED }),
      txt("ship-own", 470, 320, "Ops owns cutover", { fontSize: 11, color: MUTED }),
      txt("des-done", 160, 148, "Sam done", { fontSize: 11, color: MUTED }),
      // Soft-launch buffer is a bar under Ship — W8–W9 without a span is wallpaper.
      rect("buf-bar", 640, 340, 100, 14, "", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 1,
      }),
      txt("buf-bar-l", 750, 336, "soft launch", { fontSize: 11, color: "#15803d" }),
      // Hard cut tick at W10.
      line("hard-cut", 780, 140, [[0, 0], [0, 200]], {
        stroke: ACCENT,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("hard-cut-l", 760, 112, "W10 hard", { fontSize: 11, color: ACCENT }),
      // Build→Ship dependency elbow — FS isn't only "blocked on Build" text.
      elbow(
        "ship-dep",
        [
          [590, 254],
          [590, 270],
          [470, 270],
          [470, 280],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("ship-dep-l", 500, 258, "FS", { fontSize: 11, color: ACCENT }),
      // FTE chips under owners — capacity is countable seats.
      rect("fte-d", 60, 360, 70, 28, "Sam 1", { fill: PAPER, stroke: MUTED, labelSize: 12 }),
      rect("fte-e", 60, 396, 70, 28, "Eng 3", { fill: "#fef3c7", stroke: ACCENT, labelSize: 12 }),
      rect("fte-o", 60, 432, 70, 28, "Ops 1", { fill: PAPER, stroke: MUTED, labelSize: 12 }),
      // Build burn bar — 38/60 days.
      line("burn-bar", 290, 440, [[0, 0], [180, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("burn-fill", 290, 440, [[0, 0], [114, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("burn-bar-l", 290, 452, "burn 38/60d", { fontSize: 11, color: ACCENT }),
      // Confidence chip — low until Build closes.
      rect("conf-chip", 640, 420, 140, 28, "confidence: low", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Hard-cut chip at W10.
      rect("hard-chip", 740, 380, 110, 28, "W10 hard cut", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Soft-launch chip under buffer bar.
      rect("soft-chip", 640, 460, 120, 28, "soft W8–W9", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Today marker chip.
      rect("today-chip", 420, 480, 100, 28, "today W5", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // FS dependency chip.
      rect("fs-chip", 500, 220, 80, 28, "FS link", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Overlap weeks chip.
      rect("ov-w", 700, 160, 120, 28, "overlap W4–5", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Eng FTE already — stamp Build owner.
      rect("build-own", 290, 480, 120, 28, "Build · Eng", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Design owner stamp.
      rect("sam-own", 60, 480, 100, 28, "Design Sam", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  swimlane: () => {
    // Orthogonal elbows only — a diagonal handoff through empty lane space
    // reads as a routing bug, not a cross-functional story.
    // Test sits in Eng so the return to Product is a review, not a leap.
    const brief = { id: "brief", x: 200, y: 140, w: 120, h: 48 };
    const spec = { id: "spec", x: 360, y: 140, w: 130, h: 48 };
    const impl = { id: "impl", x: 360, y: 270, w: 130, h: 48 };
    const test = { id: "test", x: 530, y: 270, w: 120, h: 48 };
    const signoff = { id: "signoff", x: 700, y: 140, w: 140, h: 48 };
    return doc("Swimlane — cross-functional handoffs", [
      zone("lane1", 180, 110, 700, 100, ""),
      zone("lane2", 180, 240, 700, 100, ""),
      txt("lane1-l", 60, 150, "Product", { fontSize: 14, color: MUTED }),
      txt("lane2-l", 48, 280, "Engineering", { fontSize: 14, color: MUTED }),
      rect(brief.id, brief.x, brief.y, brief.w, brief.h, "Brief"),
      rect(spec.id, spec.x, spec.y, spec.w, spec.h, "Spec"),
      rect(impl.id, impl.x, impl.y, impl.w, impl.h, "Implement"),
      rect(test.id, test.x, test.y, test.w, test.h, "Test", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      rect(signoff.id, signoff.x, signoff.y, signoff.w, signoff.h, "Sign-off", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
      arrow("s0", brief, spec, "", { from: "right", to: "left" }),
      txt("s0-l", 312, 118, "scope", { fontSize: 13, color: MUTED }),
      elbow(
        "h1",
        [
          [spec.x + spec.w / 2, spec.y + spec.h],
          [spec.x + spec.w / 2, impl.y - 8],
        ],
        {}
      ),
      txt("h1-l", spec.x + spec.w / 2 + 12, 220, "handoff", { fontSize: 13, color: MUTED }),
      arrow("s1", impl, test, "", { from: "right", to: "left" }),
      txt("s1-l", 470, 248, "unit + e2e", { fontSize: 12, color: MUTED }),
      elbow(
        "h2",
        [
          [test.x + test.w / 2, test.y - 8],
          [test.x + test.w / 2, 220],
          [signoff.x + signoff.w / 2, 220],
          [signoff.x + signoff.w / 2, signoff.y + signoff.h + 8],
        ],
        {}
      ),
      txt("h2-l", 620, 200, "PR review", { fontSize: 13, color: MUTED }),
      // Fail → re-implement: Test is a gate, not a one-way handoff.
      elbow(
        "fail",
        [
          [test.x + test.w / 2, test.y + test.h + 8],
          [test.x + test.w / 2, 360],
          [impl.x + impl.w / 2, 360],
          [impl.x + impl.w / 2, impl.y + impl.h + 8],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("fail-l", 420, 372, "red → fix", { fontSize: 12, color: ACCENT }),
      txt("sla", 680, 320, "≤ 2 days in Eng", { fontSize: 12, color: MUTED }),
      txt("wip", 360, 248, "WIP limit: 1 Spec in Eng", { fontSize: 11, color: MUTED }),
      txt("age-s", 700, 118, "Spec age: 6h", { fontSize: 11, color: MUTED }),
      txt("goal", 200, 400, "goal: Sign-off same day as green tests", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("owner", 200, 424, "Sign-off owner = PM on-call", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("mins", 200, 448, "stage mins: Brief 30 · Spec 90 · Impl 240 · Test 60", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("retry", 530, 320, "retry ≤2 then page", { fontSize: 11, color: ACCENT }),
      txt("brief-age", 200, 118, "Brief age: 2h", { fontSize: 11, color: MUTED }),
      txt("red-n", 420, 400, "reds this week: 1", { fontSize: 11, color: ACCENT }),
      txt("green", 700, 188, "last green: 09:14", { fontSize: 11, color: "#15803d" }),
      txt("handoff-ms", 360, 200, "handoff < 15m", { fontSize: 11, color: MUTED }),
      txt("scope-n", 312, 100, "scope locked", { fontSize: 11, color: MUTED }),
      txt("test-n", 530, 248, "e2e suite", { fontSize: 11, color: MUTED }),
      txt("impl-n", 360, 320, "PR #4821", { fontSize: 11, color: MUTED }),
      txt("sign-n", 700, 100, "PM sign-off", { fontSize: 11, color: "#15803d" }),
      txt("brief-n", 200, 100, "Brief #91", { fontSize: 11, color: MUTED }),
      txt("test-owner", 530, 340, "QA on-call", { fontSize: 11, color: MUTED }),
      // Page after 2 reds — escalation is a box, not only "retry ≤2 then page".
      rect("page", 700, 360, 120, 40, "Page PM", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 14,
      }),
      elbow(
        "page-e",
        [
          [test.x + test.w + 8, test.y + test.h / 2],
          [760, test.y + test.h / 2],
          [760, 360],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("page-l", 680, 300, "×2 red →", { fontSize: 11, color: ACCENT }),
      txt("page-n", 700, 408, "pages this wk: 0", { fontSize: 11, color: MUTED }),
      // Stage minutes as a mini bar under Eng — Impl 240 dominates.
      line("mins-bar", 360, 380, [[0, 0], [240, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("mins-fill", 360, 380, [[0, 0], [137, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("mins-bar-l", 360, 392, "Impl 240 of 420 stage-min", { fontSize: 11, color: ACCENT }),
      // Handoff SLA chip — <15m.
      rect("ho-sla", 520, 440, 120, 32, "handoff <15m", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Red count chip.
      rect("red-chip", 420, 420, 100, 28, "reds ×1", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Pages this week — 0 is a green stamp.
      rect("page0-chip", 700, 440, 120, 28, "pages wk: 0", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // WIP limit chip — 1 Spec in Eng.
      rect("wip-chip", 200, 440, 140, 28, "WIP Spec: 1", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Same-day sign-off goal chip.
      rect("goal-sw", 360, 480, 160, 28, "same-day sign-off", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Brief age chip.
      rect("brief-chip", 200, 480, 100, 28, "Brief 2h", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Spec age chip.
      rect("spec-age", 360, 520, 100, 28, "Spec 6h", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // QA ownership stamp on Test lane.
      rect("qa-on", 530, 480, 100, 28, "QA on-call", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Eng SLA stamp.
      rect("eng2d", 700, 480, 100, 28, "Eng ≤2d", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  quadrant: () => {
    return doc("Quadrant — two-axis positioning", [
      line("y-axis", 380, 120, [[0, 0], [0, 280]], { stroke: INK }),
      line("x-axis", 140, 260, [[0, 0], [480, 0]], { stroke: INK }),
      txt("y-label", 344, 92, "Impact", { fontSize: 15, color: MUTED }),
      txt("x-label", 634, 250, "Effort", { fontSize: 15, color: MUTED }),
      txt("q-tl", 152, 130, "do now", { fontSize: 14, color: MUTED }),
      txt("q-tr", 528, 130, "plan for", { fontSize: 14, color: MUTED }),
      txt("q-bl", 152, 376, "fill-in", { fontSize: 14, color: MUTED }),
      txt("q-br", 566, 376, "drop", { fontSize: 14, color: MUTED }),
      txt("hi", 388, 124, "high", { fontSize: 11, color: MUTED }),
      txt("lo", 388, 368, "low", { fontSize: 11, color: MUTED }),
      txt("lo-e", 152, 248, "low", { fontSize: 11, color: MUTED }),
      txt("hi-e", 600, 248, "high", { fontSize: 11, color: MUTED }),
      dot("p1", 258, 186, 7),
      txt("p1-l", 274, 176, "Themes", { fontSize: 15 }),
      txt("p1-e", 274, 196, "3d", { fontSize: 11, color: MUTED }),
      dot("p2", 470, 158, 7, { fill: ACCENT, stroke: ACCENT }),
      txt("p2-l", 486, 148, "MCP app", { fontSize: 15, color: ACCENT }),
      txt("p2-e", 486, 168, "45d", { fontSize: 11, color: ACCENT }),
      dot("p3", 244, 320, 7),
      txt("p3-l", 260, 310, "Docs polish", { fontSize: 15 }),
      txt("p3-e", 260, 330, "2d", { fontSize: 11, color: MUTED }),
      // The empty quadrant is the one worth filling: naming what to drop is the
      // decision a positioning chart exists to force.
      dot("p4", 470, 330, 7, { fill: MUTED, stroke: MUTED }),
      txt("p4-l", 486, 320, "Slide export", { fontSize: 15, color: MUTED }),
      txt("p4-e", 486, 340, "20d", { fontSize: 11, color: MUTED }),
      dot("p5", 300, 170, 7),
      txt("p5-l", 316, 160, "Parity tests", { fontSize: 14 }),
      txt("p5-e", 316, 180, "5d", { fontSize: 11, color: MUTED }),
      // Sprint pull: Themes moves deeper into do-now — motion is the decision.
      elbow(
        "pull",
        [
          [258, 186],
          [220, 186],
          [220, 160],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("pull-l", 152, 152, "this sprint", { fontSize: 11, color: ACCENT }),
      txt("claim", 140, 420, "Themes ship this sprint; MCP app is a quarter bet", {
        fontSize: 13,
        color: ACCENT,
      }),
      txt("drop", 140, 444, "Slide export stays in drop until a buyer asks", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("cap", 140, 468, "capacity this sprint: 8 eng-days · Themes + Parity fit", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("mcp-plan", 486, 188, "Q3 start", { fontSize: 11, color: ACCENT }),
      txt("days", 140, 492, "effort days labeled under each point", {
        fontSize: 11,
        color: MUTED,
      }),
      // Residual after Themes+Parity: the chart should leave a day, not pack 8/8.
      txt("spare", 140, 516, "spare after pull: 0d · next fill-in waits", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("sum", 528, 420, "pulled: 3+5=8d", { fontSize: 11, color: MUTED }),
      // Effort ticks: days on the axis, not only under each point.
      ...[200, 300, 400, 500].map((x, i) =>
        line(`et${i}`, x, 260, [[0, 0], [0, 6]], { strokeWidth: 1, stroke: MUTED })
      ),
      txt("et0", 188, 268, "5d", { fontSize: 10, color: MUTED }),
      txt("et1", 288, 268, "15d", { fontSize: 10, color: MUTED }),
      txt("et2", 388, 268, "30d", { fontSize: 10, color: MUTED }),
      txt("et3", 488, 268, "45d", { fontSize: 10, color: MUTED }),
      // Impact ticks on Y — effort alone is half the matrix.
      ...[160, 200, 240].map((y, i) =>
        line(`it${i}`, 374, y, [[0, 0], [12, 0]], { strokeWidth: 1, stroke: MUTED })
      ),
      txt("it0", 392, 154, "hi", { fontSize: 10, color: MUTED }),
      txt("it1", 392, 232, "mid", { fontSize: 10, color: MUTED }),
      // Buyer-ask gate: Slide export stays dropped until demand is named.
      txt("ask", 486, 360, "no buyer ask", { fontSize: 11, color: MUTED }),
      txt("score-q", 528, 444, "do-now score: Themes 9/10", { fontSize: 11, color: ACCENT }),
      txt("mcp-roi", 486, 208, "ROI lag 2q", { fontSize: 11, color: MUTED }),
      txt("parity-why", 316, 200, "blocks bad PNG", { fontSize: 11, color: MUTED }),
      txt("drop-why", 560, 360, "no PM request", { fontSize: 11, color: MUTED }),
      txt("fill-why", 260, 360, "backlog only", { fontSize: 11, color: MUTED }),
      txt("plan-q", 470, 140, "plan Q3", { fontSize: 11, color: ACCENT }),
      txt("themes-why", 274, 210, "tokens ready", { fontSize: 11, color: MUTED }),
      txt("docs-why", 260, 350, "nice-to-have", { fontSize: 11, color: MUTED }),
      // Capacity bucket — spare 0d is a filled bar, not only a caption.
      rect("cap-box", 640, 160, 110, 64, "sprint 8d\nused 8 · spare 0", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Drop X on Slide export — the decision is a mark.
      line("drop-x1", 460, 320, [[0, 0], [20, 20]], { stroke: MUTED, strokeWidth: 2 }),
      line("drop-x2", 480, 320, [[0, 0], [-20, 20]], { stroke: MUTED, strokeWidth: 2 }),
      // Do-now score bar — Themes 9/10 is a fill.
      line("score-bar", 640, 240, [[0, 0], [100, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("score-fill", 640, 240, [[0, 0], [90, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("score-bar-l", 640, 252, "Themes 9/10", { fontSize: 11, color: ACCENT }),
      // Spare capacity chip — 0d left.
      rect("spare-chip", 640, 280, 100, 32, "spare 0d", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 13,
      }),
      // MCP quarter bet chip.
      rect("mcp-chip", 470, 100, 100, 28, "MCP Q3", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Drop decision chip.
      rect("drop-chip", 640, 400, 120, 28, "drop · no ask", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Themes do-now chip.
      rect("themes-chip", 140, 100, 120, 28, "Themes 9/10", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Fill-in backlog chip.
      rect("fill-chip", 140, 400, 120, 28, "fill-in only", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Sprint capacity chip.
      rect("spr-chip", 640, 320, 110, 28, "sprint 8d", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Effort scale chip.
      rect("eff-chip", 640, 360, 110, 28, "effort days", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Impact axis chip.
      rect("imp-chip", 80, 100, 100, 28, "Impact ↑", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Do-now quadrant stamp — clear of plan-Q3 captions.
      rect("do-now", 80, 60, 100, 28, "Do now", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Parity effort stamp — clear of score caption.
      rect("par-chip", 80, 400, 110, 28, "Parity 5d", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Themes effort stamp.
      rect("thm3", 200, 60, 110, 28, "Themes 3d", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  // Stations on a rectangle so every edge is pure H or V — a diamond with
  // corner-to-corner diagonals is a flywheel drawn as a star, not a loop.
  loop: () => {
    const capture = { id: "capture", x: 200, y: 110, w: 148, h: 48 };
    const synth = { id: "synth", x: 520, y: 110, w: 148, h: 48 };
    const publish = { id: "publish", x: 520, y: 310, w: 148, h: 48 };
    const review = { id: "review", x: 200, y: 310, w: 148, h: 48 };
    // Rectangle centre of the four equal stations — equal widths keep the hub optical.
    const hub = { id: "hub", x: 360, y: 206, w: 148, h: 56 };
    return doc("Loop — flywheel around a hub", [
      rect(capture.id, capture.x, capture.y, capture.w, capture.h, "Capture"),
      rect(synth.id, synth.x, synth.y, synth.w, synth.h, "Synthesize"),
      rect(publish.id, publish.x, publish.y, publish.w, publish.h, "Publish"),
      rect(review.id, review.x, review.y, review.w, review.h, "Review"),
      rect(hub.id, hub.x, hub.y, hub.w, hub.h, "Memory", { fill: "#fef3c7", stroke: ACCENT }),
      arrow("l1", capture, synth, "", { from: "right", to: "left" }),
      arrow("l2", synth, publish, "", { from: "bottom", to: "top" }),
      arrow("l3", publish, review, "", { from: "left", to: "right" }),
      arrow("l4", review, capture, "", { from: "top", to: "bottom" }),
      txt("l1-l", 360, 90, "notes", { fontSize: 12, color: MUTED }),
      txt("l2-l", 678, 200, "draft", { fontSize: 12, color: MUTED }),
      txt("l3-l", 360, 340, "ship", { fontSize: 12, color: MUTED }),
      txt("l4-l", 120, 200, "feedback", { fontSize: 12, color: MUTED }),
      // Spokes land on every station — a hub that only touches half the loop is a lie.
      elbow(
        "spoke-cap",
        [
          [hub.x + hub.w / 2, hub.y - 4],
          [hub.x + hub.w / 2, capture.y + capture.h + 8],
          [capture.x + capture.w + 8, capture.y + capture.h + 8],
          [capture.x + capture.w + 8, capture.y + capture.h / 2],
          [capture.x + capture.w + 4, capture.y + capture.h / 2],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      elbow(
        "spoke-syn",
        [
          [hub.x + hub.w + 4, hub.y + hub.h / 2],
          [synth.x - 8, hub.y + hub.h / 2],
          [synth.x - 8, synth.y + synth.h + 4],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      elbow(
        "spoke-pub",
        [
          [hub.x + hub.w / 2, hub.y + hub.h + 4],
          [hub.x + hub.w / 2, publish.y - 8],
          [publish.x - 8, publish.y - 8],
          [publish.x - 8, publish.y + publish.h / 2],
          [publish.x - 4, publish.y + publish.h / 2],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      elbow(
        "spoke-rev",
        [
          [hub.x - 4, hub.y + hub.h / 2],
          [review.x + review.w + 8, hub.y + hub.h / 2],
          [review.x + review.w + 8, review.y - 4],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("write-l", 300, 168, "write", { fontSize: 12, color: ACCENT }),
      txt("read-l", 430, 168, "read", { fontSize: 12, color: ACCENT }),
      txt("pub-l", 430, 280, "seed", { fontSize: 12, color: ACCENT }),
      txt("rev-l", 250, 280, "log", { fontSize: 12, color: ACCENT }),
      txt("hub-note", 80, 460, "hub accumulates; the loop never starts from empty", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("cadence", 80, 484, "cadence: weekly Review → Capture", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("kpi", 80, 508, "KPI: Memory writes/week trending up", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("kill", 80, 532, "skip Review twice → freeze Publish until catch-up", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("cycle", 80, 556, "median cycle: Capture→Publish 5 days", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("mem-size", 380, 188, "~1.2k notes", { fontSize: 11, color: ACCENT }),
      txt("write-rate", 300, 248, "+18%/wk", { fontSize: 11, color: ACCENT }),
      txt("thru-c", 200, 80, "~40 notes/wk", { fontSize: 11, color: MUTED }),
      txt("thru-p", 520, 80, "~12 drafts/wk", { fontSize: 11, color: MUTED }),
      txt("thru-s", 520, 370, "~9 ships/wk", { fontSize: 11, color: MUTED }),
      // Freeze mark on Publish when Review is skipped — the kill rule is visual.
      line("frz-p", 520, 300, [[0, 0], [148, 0]], { stroke: ACCENT, dashed: true, strokeWidth: 1 }),
      txt("frz-p-l", 560, 288, "freeze if skip×2", { fontSize: 11, color: ACCENT }),
      txt("rev-n", 200, 370, "~6 reviews/wk", { fontSize: 11, color: MUTED }),
      txt("hub-age", 380, 268, "oldest note 11mo", { fontSize: 11, color: MUTED }),
      txt("cap-src", 200, 168, "Slack + Notion", { fontSize: 11, color: MUTED }),
      txt("syn-tool", 678, 120, "LLM draft", { fontSize: 11, color: MUTED }),
      // Skip counter feeds the freeze — skip×2 without a counter is wallpaper.
      rect("skip", 80, 110, 100, 40, "skips: 0", {
        fill: PAPER,
        stroke: ACCENT,
        labelSize: 14,
      }),
      txt("skip-l", 80, 88, "Review skips", { fontSize: 11, color: ACCENT }),
      // Memory fill bar under hub — ~1.2k notes is a level, not only a caption.
      line("mem-bar", 360, 270, [[0, 0], [148, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("mem-fill", 360, 270, [[0, 0], [110, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("mem-pct", 360, 280, "Memory 74% full", { fontSize: 11, color: ACCENT }),
      // Cycle time bar — median 5 days is a span under the loop.
      rect("cycle-bar", 420, 400, 200, 16, "", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 1,
      }),
      txt("cycle-bar-l", 420, 424, "cycle 5d median", { fontSize: 11, color: MUTED }),
      // Write-rate trend chip — +18%/wk.
      rect("wr-chip", 300, 440, 110, 32, "+18%/wk", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 13,
      }),
      // Capture throughput chip.
      rect("cap-chip", 520, 440, 120, 28, "~40 notes/wk", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Freeze Publish chip when skip×2.
      rect("frz-chip", 680, 300, 120, 28, "Publish freeze", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Skip counter chip.
      rect("skip-chip", 680, 340, 120, 28, "skip ×2", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Hub notes chip.
      rect("hub-n", 200, 200, 120, 28, "~1.2k notes", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Median cycle chip.
      rect("med-chip", 80, 440, 120, 28, "median 5d", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Memory fill already — stamp notes count near hub.
      rect("hub-fill", 520, 200, 100, 28, "Memory 74%", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Capture station rate already — stamp Review rate.
      rect("rev-rate", 80, 340, 120, 28, "Review OK", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Draft hop stamp on Synthesize→Publish edge.
      rect("draft-hop", 680, 380, 100, 28, "draft hop", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  process: () => {
    // Each stage owns a concrete artifact; the middle is accented because that
    // is where the role's judgment lives, not where boxes get names.
    const s1 = { id: "s1", x: 60, y: 150, w: 180, h: 88 };
    const s2 = { id: "s2", x: 320, y: 150, w: 180, h: 88 };
    const s3 = { id: "s3", x: 580, y: 150, w: 180, h: 88 };
    const fail = { id: "fail", x: 320, y: 310, w: 180, h: 48 };
    return doc("Process — multi-step workflow", [
      txt("role", 60, 118, "Role: data engineer · nightly", { fontSize: 13, color: MUTED }),
      rect(s1.id, s1.x, s1.y, s1.w, s1.h, "Ingest\nS3 → staging"),
      rect(s2.id, s2.x, s2.y, s2.w, s2.h, "Transform\ndbt models", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      rect(s3.id, s3.x, s3.y, s3.w, s3.h, "Deliver\nmart + SLA"),
      arrow("p1", s1, s2, ""),
      arrow("p2", s2, s3, ""),
      txt("p1-l", 258, 128, "schema check", { fontSize: 13, color: MUTED }),
      txt("p2-l", 518, 128, "publish", { fontSize: 13, color: MUTED }),
      txt("d1", 120, 250, "~8 min", { fontSize: 11, color: MUTED }),
      txt("d2", 380, 250, "~22 min", { fontSize: 11, color: ACCENT }),
      txt("d3", 640, 250, "~6 min", { fontSize: 11, color: MUTED }),
      rect(fail.id, fail.x, fail.y, fail.w, fail.h, "quarantine", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 15,
      }),
      elbow(
        "p-fail",
        [
          [s2.x + s2.w / 2, s2.y + s2.h + 6],
          [s2.x + s2.w / 2, fail.y - 8],
        ],
        { stroke: ACCENT }
      ),
      txt("fail-l", 420, 280, "row fails DQ", { fontSize: 13, color: ACCENT }),
      // Quarantine is temporary: fix and re-enter Transform — not a dead-end dump.
      elbow(
        "p-retry",
        [
          [fail.x + fail.w + 8, fail.y + fail.h / 2],
          [540, fail.y + fail.h / 2],
          [540, s2.y + s2.h / 2],
          [s2.x + s2.w + 8, s2.y + s2.h / 2],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("retry-l", 500, 300, "fix → retry", { fontSize: 12, color: ACCENT }),
      txt("sla", 580, 260, "P95 < 40 min", { fontSize: 13, color: MUTED }),
      txt("window", 580, 340, "window: 01:00–05:00 UTC", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("vol", 60, 280, "~12M rows/night · quarantine < 0.1%", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("own-q", 60, 380, "quarantine owner: on-call data eng", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("alert", 60, 404, "page if quarantine > 1% for 2 consecutive nights", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("last", 580, 380, "last run: green · 31 min", {
        fontSize: 12,
        color: "#15803d",
      }),
      txt("q-count", 320, 370, "~1.1k rows quarantined last night", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("dbt-n", 380, 118, "142 models · 3 failing tests", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("sum-p", 60, 428, "stage sum ≈ 36 min · under P95 40", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("s3-path", 60, 452, "s3://raw/events/", { fontSize: 11, color: MUTED }),
      txt("dbt-ver", 380, 100, "dbt 1.8", { fontSize: 11, color: MUTED }),
      // Night window as a bar — 01:00–05:00 without a span is wallpaper.
      rect("win-bar", 580, 400, 180, 20, "01:00–05:00", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      txt("win-bar-l", 580, 428, "night window", { fontSize: 11, color: MUTED }),
      // Quarantine pile count as a box under the fail path.
      rect("q-pile", 100, 310, 140, 40, "quarantine 1.1k", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 13,
      }),
      txt("q-pile-l", 100, 356, "last night rows", { fontSize: 11, color: ACCENT }),
      // DQ fail rate bar — 0.1% ceiling.
      line("dq-bar", 320, 400, [[0, 0], [160, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("dq-fill", 320, 400, [[0, 0], [8, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("dq-bar-l", 320, 412, "DQ 0.08% / 0.1%", { fontSize: 11, color: ACCENT }),
      // P95 SLA chip.
      rect("p95-chip", 780, 340, 120, 28, "P95 < 40 min", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Quarantine page threshold chip.
      rect("page-q", 580, 460, 160, 28, "page if >1% ×2n", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Rows/night chip.
      rect("rows-n", 320, 440, 140, 28, "~12M rows/n", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // dbt models chip.
      rect("dbt", 700, 100, 120, 28, "dbt models", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // dbt version stamp.
      rect("dbt-ver", 700, 140, 100, 28, "dbt 1.8", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  // Equal widths, because tapering them says "pyramid". The one-way arrow is the
  // claim a layer diagram exists to make: dependencies point down, never up.
  // Examples ride in the bound label so free-text collision checks stay clean.
  layers: () => {
    return doc("Layers — stacked abstractions", [
      rect("l3", 140, 110, 480, 72, "Presentation\nNext.js · REST handlers"),
      rect("l2", 140, 198, 480, 72, "Domain\norders · pricing · entitlements", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      rect("l1", 140, 286, 480, 72, "Infrastructure\nPostgres · Redis · S3"),
      path("dep", 668, 120, [[0, 0], [0, 230]], "", { stroke: MUTED }),
      txt("dep-l", 688, 210, "depends on", { fontSize: 14, color: MUTED }),
      path("forbid", 80, 350, [[0, 0], [0, -230]], "", { stroke: ACCENT, dashed: true }),
      txt("forbid-l", 24, 200, "✗ upward", { fontSize: 13, color: ACCENT }),
      txt("rule", 140, 380, "Infrastructure never imports Domain", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("ex", 140, 404, "bad: postgres.ts imports pricing.ts", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("lint", 140, 428, "enforced by eslint-plugin-boundaries", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("pin", 140, 452, "Infra packages never import Domain — CI fails the PR", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("pkgs", 140, 476, "pkgs: app/ · domain/ · infra/ mirror the three bands", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("import", 688, 120, "Next.js → Domain OK", { fontSize: 11, color: MUTED }),
      txt("import2", 24, 320, "infra ✗ Domain", { fontSize: 11, color: ACCENT }),
      txt("mod-n", 640, 140, "12 handlers", { fontSize: 11, color: MUTED }),
      txt("mod-d", 640, 228, "9 domain pkgs", { fontSize: 11, color: ACCENT }),
      txt("mod-i", 640, 316, "6 infra adapters", { fontSize: 11, color: MUTED }),
      txt("bound", 140, 500, "boundary lint fails PR #4821 on upward import", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("domain-n", 640, 250, "orders · pricing", { fontSize: 11, color: ACCENT }),
      // Bad upward import drawn as a dashed arrow — the forbid path needs a shaft.
      elbow(
        "bad",
        [
          [120, 322],
          [100, 322],
          [100, 234],
          [140, 234],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("bad-l", 24, 250, "bad import", { fontSize: 11, color: ACCENT }),
      // CI fail chip — boundary lint is a gate.
      rect("ci-fail", 700, 360, 120, 40, "CI FAIL", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 14,
      }),
      txt("ci-fail-l", 700, 408, "PR #4821", { fontSize: 11, color: ACCENT }),
      // Domain accent chip — 9 pkgs under discussion.
      rect("dom-chip", 700, 440, 120, 28, "9 domain pkgs", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Infra adapter chip.
      rect("infra-chip", 700, 480, 120, 28, "6 adapters", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Handler count chip.
      rect("h12", 700, 520, 120, 28, "12 handlers", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Boundary lint stamp.
      rect("lint", 700, 560, 120, 28, "boundary lint", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  // Boundary labels sit at the top-left edge: a centred container label lands on
  // whatever the boundary contains.
  nested: () => {
    // Gateway is the edge of Platform; Service A nests API+Cache. Client stays out
    // so the Platform boundary excludes something — same rule as architecture VPC.
    // Align Gateway and API on one row so the route stays a pure horizontal.
    const client = { id: "client", x: 40, y: 200, w: 120, h: 44 };
    const gateway = { id: "gateway", x: 220, y: 200, w: 140, h: 44 };
    const api = { id: "api", x: 460, y: 200, w: 200, h: 44 };
    const cache = { id: "cache", x: 460, y: 280, w: 200, h: 36 };
    const worker = { id: "worker", x: 220, y: 290, w: 140, h: 36 };
    return doc("Nested — hierarchy by containment", [
      zone("outer", 190, 110, 520, 250, ""),
      txt("outer-l", 206, 120, "Platform", { fontSize: 14, color: MUTED }),
      zone("inner", 420, 150, 270, 190, ""),
      txt("inner-l", 436, 160, "Service A", { fontSize: 14, color: MUTED }),
      rect(client.id, client.x, client.y, client.w, client.h, "Client", {
        fill: PAPER,
        stroke: MUTED,
      }),
      rect(gateway.id, gateway.x, gateway.y, gateway.w, gateway.h, "Gateway"),
      rect(worker.id, worker.x, worker.y, worker.w, worker.h, "Worker", {
        fill: "#e2e8f0",
        labelSize: 15,
      }),
      rect(api.id, api.x, api.y, api.w, api.h, "API"),
      rect(cache.id, cache.x, cache.y, cache.w, cache.h, "Cache", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 15,
      }),
      arrow("n0", client, gateway, "", { from: "right", to: "left" }),
      arrow("n1", gateway, api, "", { from: "right", to: "left" }),
      arrow("n2", api, cache, "", { from: "bottom", to: "top" }),
      arrow("n3", gateway, worker, "", { from: "bottom", to: "top" }),
      txt("n0-l", 150, 176, "HTTPS", { fontSize: 13, color: MUTED }),
      txt("n1-l", 370, 176, "route", { fontSize: 13, color: MUTED }),
      txt("n2-l", 670, 248, "hit", { fontSize: 13, color: ACCENT }),
      txt("n3-l", 250, 268, "enqueue", { fontSize: 12, color: MUTED }),
      // Worker warms Cache via Platform rail — Service A isn't a dead end.
      elbow(
        "n4",
        [
          [worker.x + worker.w + 8, worker.y + worker.h / 2],
          [cache.x - 8, worker.y + worker.h / 2],
          [cache.x - 8, cache.y + cache.h / 2],
        ],
        { stroke: MUTED, dashed: true }
      ),
      txt("n4-l", 360, 312, "warm SET", { fontSize: 12, color: MUTED }),
      txt("note", 40, 360, "Client stays outside Platform", { fontSize: 12, color: MUTED }),
      txt("excl", 40, 384, "Service B lives elsewhere — not in this nest", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("sla", 40, 408, "p99 route < 40ms · cache hit rate > 90%", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("own", 40, 432, "owner: platform · page on hit-rate drop", {
        fontSize: 12,
        color: MUTED,
      }),
      // Service B is drawn outside so exclusion is visual, not only captioned.
      rect("svc-b", 40, 110, 120, 36, "Service B", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 14,
      }),
      txt("svc-b-l", 40, 90, "out of nest", { fontSize: 11, color: MUTED }),
      txt("gw-ver", 220, 176, "v2 gateway", { fontSize: 11, color: MUTED }),
      txt("ttl", 670, 288, "TTL 5m", { fontSize: 11, color: ACCENT }),
      txt("rps", 220, 248, "~2.4k RPS", { fontSize: 11, color: MUTED }),
      txt("hit", 670, 176, "hit 93%", { fontSize: 11, color: ACCENT }),
      txt("q-n", 220, 340, "queue depth < 40", { fontSize: 11, color: MUTED }),
      txt("warm-pct", 360, 340, "warm fills 7% of SETs", { fontSize: 11, color: MUTED }),
      txt("az-n", 520, 128, "Service A · AZ-a", { fontSize: 11, color: MUTED }),
      txt("path", 150, 152, "edge → Gateway → API", { fontSize: 11, color: MUTED }),
      txt("svc-a-n", 436, 188, "2 pods", { fontSize: 11, color: MUTED }),
      txt("client-n", 40, 248, "mobile + web", { fontSize: 11, color: MUTED }),
      txt("gw-rps", 220, 152, "p50 18ms", { fontSize: 11, color: MUTED }),
      txt("api-ver", 460, 248, "API v3", { fontSize: 11, color: MUTED }),
      txt("cache-sz", 670, 340, "~2GB", { fontSize: 11, color: MUTED }),
      txt("warm-age", 360, 360, "warm every 5m", { fontSize: 11, color: MUTED }),
      txt("client-tls", 40, 176, "mTLS off", { fontSize: 11, color: MUTED }),
      // Miss path exits Service A — "miss → origin" as caption alone is wallpaper.
      rect("origin", 720, 280, 100, 36, "Origin", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 14,
      }),
      elbow(
        "n5",
        [
          [cache.x + cache.w + 8, cache.y + cache.h / 2],
          [712, cache.y + cache.h / 2],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("n5-l", 690, 260, "miss", { fontSize: 11, color: ACCENT }),
      txt("origin-n", 720, 324, "DB read", { fontSize: 11, color: MUTED }),
      // Hit-rate bar under Cache — 93% is a fill level, not only a caption.
      line("hit-bar", 460, 360, [[0, 0], [200, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("hit-fill", 460, 360, [[0, 0], [186, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("hit-bar-l", 460, 372, "hit rate 93%", { fontSize: 11, color: ACCENT }),
      // RPS bar under Gateway — ~2.4k is a load mark.
      line("rps-bar", 220, 360, [[0, 0], [140, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("rps-fill", 220, 360, [[0, 0], [96, 0]], { stroke: MUTED, strokeWidth: 6 }),
      txt("rps-bar-l", 220, 372, "~2.4k RPS", { fontSize: 11, color: MUTED }),
      // Warm share of SETs — 7% is a small fill under Worker.
      line("warm-bar", 360, 380, [[0, 0], [140, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("warm-fill", 360, 380, [[0, 0], [10, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("warm-bar-l", 360, 392, "warm 7% SETs", { fontSize: 11, color: ACCENT }),
      // Cache size fill — ~2GB.
      line("sz-bar", 670, 360, [[0, 0], [100, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("sz-fill", 670, 360, [[0, 0], [70, 0]], { stroke: MUTED, strokeWidth: 6 }),
      txt("sz-bar-l", 670, 372, "~2GB cache", { fontSize: 11, color: MUTED }),
      // Gateway p50 chip.
      rect("p50-chip", 220, 400, 100, 28, "p50 18ms", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Service A pod count chip.
      rect("pods", 720, 200, 80, 28, "2 pods", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Origin DB-read chip.
      rect("orig-chip", 720, 340, 100, 28, "DB read", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Miss share chip — 7% of traffic leaves the nest.
      rect("miss-chip", 720, 380, 100, 28, "miss 7%", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Page-on-drop chip — hit-rate alert ownership.
      rect("page-chip", 40, 460, 140, 28, "page on hit↓", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // TTL chip beside Cache.
      rect("ttl-chip", 670, 400, 100, 28, "TTL 5m", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // p99 route chip.
      rect("p99-nest", 40, 500, 120, 28, "p99 < 40ms", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Queue depth chip under Worker.
      rect("q-nest", 220, 440, 120, 28, "queue < 40", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // mTLS chip on Client.
      rect("mtls", 40, 540, 100, 28, "mTLS off", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // AZ-a chip.
      rect("aza", 700, 100, 80, 28, "AZ-a", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Redis engine stamp under Cache.
      rect("redis", 670, 440, 100, 28, "Redis 7", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Warm SET share stamp.
      rect("warm-sets", 220, 480, 120, 28, "warm SETs", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  medallion: () => {
    // Wide gaps + free edge labels: "aggregate" is wider than a tight shaft can hold.
    // Under each tier: the concrete contract a reader can audit, not just a name.
    const bronze = { id: "bronze", x: 60, y: 140, w: 180, h: 112 };
    const silver = { id: "silver", x: 330, y: 140, w: 180, h: 112 };
    const gold = { id: "gold", x: 600, y: 140, w: 180, h: 112 };
    return doc("Medallion — bronze / silver / gold tiers", [
      rect(bronze.id, bronze.x, bronze.y, bronze.w, bronze.h, "Bronze · raw\nevents_raw\n~12M/day"),
      rect(silver.id, silver.x, silver.y, silver.w, silver.h, "Silver · conformed\ndim_user\n~2M keys", {
        fill: "#e2e8f0",
      }),
      rect(gold.id, gold.x, gold.y, gold.w, gold.h, "Gold · mart\nmrt_revenue\n~400 metrics", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      arrow("m1", bronze, silver, ""),
      arrow("m2", silver, gold, ""),
      txt("m1-l", 258, 118, "dedupe + types", { fontSize: 13, color: MUTED }),
      txt("m2-l", 518, 118, "aggregate", { fontSize: 13, color: MUTED }),
      txt("b-own", 60, 268, "owned by ingest · ~12M rows/day", { fontSize: 12, color: MUTED }),
      txt("s-own", 330, 268, "owned by analytics eng · typed", { fontSize: 12, color: MUTED }),
      txt("g-own", 600, 268, "owned by BI · mart-ready", { fontSize: 12, color: ACCENT }),
      txt("tier-note", 60, 306, "each tier is a contract: raw → conformed → mart", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("gate", 60, 334, "Gold is the only tier Looker may query", {
        fontSize: 13,
        color: ACCENT,
      }),
      txt("sample", 60, 358, "sample: select * from mrt_revenue where day = current_date", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("fresh", 60, 382, "freshness: Gold ≤ T+1 day · Silver ≤ T+6h", {
        fontSize: 12,
        color: MUTED,
      }),
      // Reject path: bad Silver rows never become Gold.
      elbow(
        "m-rej",
        [
          [silver.x + silver.w / 2, silver.y + silver.h + 8],
          [silver.x + silver.w / 2, 420],
          [bronze.x + bronze.w / 2, 420],
          [bronze.x + bronze.w / 2, bronze.y + bronze.h + 8],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("m-rej-l", 200, 432, "DQ fail → Bronze re-ingest", { fontSize: 12, color: ACCENT }),
      txt("looker", 600, 432, "Looker workspace: BI only", { fontSize: 12, color: MUTED }),
      txt("dq-rate", 330, 390, "DQ fail ≈ 0.08%", { fontSize: 11, color: ACCENT }),
      txt("gold-n", 600, 390, "400 metrics · 12 marts", { fontSize: 11, color: MUTED }),
      txt("bronze-lag", 60, 456, "ingest lag p95 3m", { fontSize: 11, color: MUTED }),
      txt("silver-keys", 330, 300, "dim_user keys", { fontSize: 11, color: MUTED }),
      // Looker sits outside Gold — only marts may be queried.
      rect("looker-box", 800, 160, 120, 48, "Looker", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 14,
      }),
      elbow(
        "looker-e",
        [
          [gold.x + gold.w + 8, gold.y + gold.h / 2],
          [792, gold.y + gold.h / 2],
        ],
        { stroke: ACCENT }
      ),
      txt("looker-e-l", 720, 120, "BI query", { fontSize: 11, color: ACCENT }),
      txt("looker-deny", 800, 220, "no Silver access", { fontSize: 11, color: ACCENT }),
      // Gold-only query gate chip.
      rect("gold-only", 800, 260, 120, 28, "Gold only", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // DQ fail rate chip on the reject loop.
      rect("dq-chip", 330, 460, 120, 28, "DQ 0.08%", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Freshness bar — Gold ≤ T+1.
      line("fresh-bar", 600, 460, [[0, 0], [160, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("fresh-fill", 600, 460, [[0, 0], [120, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("fresh-bar-l", 600, 472, "Gold ≤ T+1", { fontSize: 11, color: ACCENT }),
      // Bronze ingest lag chip.
      rect("ing-lag", 60, 500, 120, 28, "lag p95 3m", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  // Depth is the grammar: a two-level fork is an org chart without the routing.
  // Orthogonal rails keep every edge pure H/V. Three mid nodes + leaf forks.
  tree: () => {
    const root = { id: "root", x: 334, y: 90, w: 132, h: 48 };
    const left = { id: "left", x: 80, y: 210, w: 132, h: 48 };
    const mid = { id: "mid", x: 334, y: 210, w: 132, h: 48 };
    const right = { id: "right", x: 588, y: 210, w: 132, h: 48 };
    const a1 = { id: "a1", x: 40, y: 340, w: 120, h: 44 };
    const a2 = { id: "a2", x: 170, y: 340, w: 120, h: 44 };
    const b1 = { id: "b1", x: 334, y: 340, w: 132, h: 44 };
    const c1 = { id: "c1", x: 528, y: 340, w: 120, h: 44 };
    const c2 = { id: "c2", x: 660, y: 340, w: 120, h: 44 };
    const railY = 174;
    const leafRailY = 304;
    return doc("Tree — parent → children", [
      rect(root.id, root.x, root.y, root.w, root.h, "packages/"),
      rect(left.id, left.x, left.y, left.w, left.h, "core/"),
      rect(mid.id, mid.x, mid.y, mid.w, mid.h, "render/"),
      rect(right.id, right.x, right.y, right.w, right.h, "themes/"),
      rect(a1.id, a1.x, a1.y, a1.w, a1.h, "SKILL.md", { labelSize: 15 }),
      rect(a2.id, a2.x, a2.y, a2.w, a2.h, "loader.ts", { labelSize: 15 }),
      rect(b1.id, b1.x, b1.y, b1.w, b1.h, "cli.ts", { labelSize: 15 }),
      rect("b2", 334, 400, 132, 40, "template.html", { labelSize: 14 }),
      rect(c1.id, c1.x, c1.y, c1.w, c1.h, "dark/", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 15,
      }),
      rect(c2.id, c2.x, c2.y, c2.w, c2.h, "notion/", { labelSize: 15 }),
      rect("c3", 792, 340, 100, 44, "stripe/", { labelSize: 14 }),
      txt("d0", 480, 102, "L0", { fontSize: 11, color: MUTED }),
      txt("d1", 740, 222, "L1", { fontSize: 11, color: MUTED }),
      txt("d2", 900, 352, "L2", { fontSize: 11, color: MUTED }),
      line("trunk", root.x + root.w / 2, root.y + root.h, [[0, 0], [0, railY - (root.y + root.h)]], {
        stroke: INK,
      }),
      line(
        "rail",
        left.x + left.w / 2,
        railY,
        [[0, 0], [right.x + right.w / 2 - (left.x + left.w / 2), 0]],
        { stroke: INK }
      ),
      elbow("t1", [
        [left.x + left.w / 2, railY],
        [left.x + left.w / 2, left.y - 8],
      ]),
      elbow("t1b", [
        [mid.x + mid.w / 2, railY],
        [mid.x + mid.w / 2, mid.y - 8],
      ]),
      elbow("t2", [
        [right.x + right.w / 2, railY],
        [right.x + right.w / 2, right.y - 8],
      ]),
      line("trunk-a", left.x + left.w / 2, left.y + left.h, [[0, 0], [0, leafRailY - (left.y + left.h)]], {
        stroke: INK,
      }),
      line(
        "rail-a",
        a1.x + a1.w / 2,
        leafRailY,
        [[0, 0], [a2.x + a2.w / 2 - (a1.x + a1.w / 2), 0]],
        { stroke: INK }
      ),
      elbow("t3", [
        [a1.x + a1.w / 2, leafRailY],
        [a1.x + a1.w / 2, a1.y - 8],
      ]),
      elbow("t4", [
        [a2.x + a2.w / 2, leafRailY],
        [a2.x + a2.w / 2, a2.y - 8],
      ]),
      arrow("t5", mid, b1, "", { from: "bottom", to: "top" }),
      arrow("t5b", b1, { id: "b2", x: 334, y: 400, w: 132, h: 40 }, "", {
        from: "bottom",
        to: "top",
      }),
      line(
        "trunk-c",
        right.x + right.w / 2,
        right.y + right.h,
        [[0, 0], [0, leafRailY - (right.y + right.h)]],
        { stroke: INK }
      ),
      line(
        "rail-c",
        c1.x + c1.w / 2,
        leafRailY,
        [[0, 0], [792 + 50 - (c1.x + c1.w / 2), 0]],
        { stroke: INK }
      ),
      elbow("t6", [
        [c1.x + c1.w / 2, leafRailY],
        [c1.x + c1.w / 2, c1.y - 8],
      ]),
      elbow("t7", [
        [c2.x + c2.w / 2, leafRailY],
        [c2.x + c2.w / 2, c2.y - 8],
      ]),
      elbow("t8", [
        [792 + 50, leafRailY],
        [792 + 50, 340 - 8],
      ]),
      txt("note", 80, 410, "depth is the grammar: three packages, one accent leaf", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("count", 80, 434, "11 nodes · dark/ is the curated accent", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("omit", 80, 458, "mcp-server/ omitted — not a published theme pack", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("parity", 80, 482, "render/template.html is the Node↔Python parity pin", {
        fontSize: 12,
        color: MUTED,
      }),
      // Accent stripe is curated; notion/stripe are published siblings.
      txt("pub", 528, 410, "published themes", { fontSize: 11, color: MUTED }),
      txt("loc", 80, 100, "~4.2k LOC across L1", { fontSize: 11, color: MUTED }),
      txt("leaf-n", 40, 392, "2 core leaves", { fontSize: 11, color: MUTED }),
      txt("theme-n", 660, 392, "3 theme packs", { fontSize: 11, color: ACCENT }),
      txt("cli-n", 480, 440, "CLI entry → cli.ts", { fontSize: 11, color: MUTED }),
      txt("skill-n", 40, 456, "SKILL.md = agent prompt", { fontSize: 11, color: MUTED }),
      txt("load-n", 170, 392, "theme loader", { fontSize: 11, color: MUTED }),
      txt("dark-why", 528, 392, "accent = curated", { fontSize: 11, color: ACCENT }),
      txt("html-n", 334, 440, "shared template", { fontSize: 11, color: MUTED }),
      // Omitted package drawn dashed — exclusion is structural, not only captioned.
      rect("mcp", 900, 210, 120, 44, "mcp-server/", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 13,
      }),
      txt("mcp-l", 900, 190, "omitted L1", { fontSize: 11, color: MUTED }),
      line("omit-rail", 720, 234, [[0, 0], [172, 0]], {
        stroke: MUTED,
        dashed: true,
      }),
      // install/ also omitted — meta-installer is not a theme pack.
      rect("install", 900, 280, 120, 40, "install/", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 13,
      }),
      txt("install-l", 900, 328, "meta · omitted", { fontSize: 11, color: MUTED }),
      // LOC bar across L1 — ~4.2k is a fill.
      line("loc-bar", 80, 70, [[0, 0], [200, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("loc-fill", 80, 70, [[0, 0], [168, 0]], { stroke: MUTED, strokeWidth: 6 }),
      txt("loc-bar-l", 80, 82, "~4.2k LOC L1", { fontSize: 11, color: MUTED }),
      // Curated accent stamp on dark/.
      rect("curated", 528, 470, 120, 28, "curated accent", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Parity pin chip on template.html.
      rect("parity-chip", 334, 480, 132, 28, "parity pin", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Omitted packs count — mcp-server + install stay off-tree.
      rect("omit-chip", 780, 500, 120, 28, "omit ×2 packs", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // whiteboard/ also off-list — third exclusion.
      rect("wb-box", 900, 380, 120, 36, "whiteboard/", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 13,
      }),
      txt("wb-box-l", 900, 424, "not listed", { fontSize: 11, color: MUTED }),
      // Theme pack count chip.
      rect("theme-n-chip", 660, 500, 120, 28, "3 theme packs", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Core leaves chip.
      rect("core-chip", 40, 500, 120, 28, "2 core leaves", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // L0 depth chip.
      rect("l0-chip", 480, 60, 80, 28, "L0 root", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Dark leaf chip.
      rect("dark-chip", 528, 500, 100, 28, "dark/ leaf", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Notion sibling chip.
      rect("notion-chip", 660, 440, 100, 28, "notion/", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Stripe sibling chip.
      rect("stripe-chip", 792, 400, 100, 28, "stripe/", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Off-tree pack stamp beside whiteboard exclusion.
      rect("off-tree", 900, 460, 120, 28, "off-tree", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  // Solid lines are the reporting tree; the dashed one is the routing the title
  // promises — who Product actually asks, which the tree alone never shows.
  "org-chart": () => {
    const ceo = { id: "ceo", x: 334, y: 90, w: 132, h: 48 };
    const eng = { id: "eng", x: 140, y: 210, w: 156, h: 48 };
    const prod = { id: "prod", x: 504, y: 210, w: 156, h: 48 };
    const platform = { id: "platform", x: 140, y: 340, w: 156, h: 48 };
    const design = { id: "design", x: 504, y: 340, w: 156, h: 48 };
    const railY = 174;
    return doc("Org chart — ownership + routing", [
      rect(ceo.id, ceo.x, ceo.y, ceo.w, ceo.h, "CEO"),
      rect(eng.id, eng.x, eng.y, eng.w, eng.h, "Engineering\n12 people"),
      rect(prod.id, prod.x, prod.y, prod.w, prod.h, "Product\n4 people"),
      rect(platform.id, platform.x, platform.y, platform.w, platform.h, "Platform\n3 people", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      rect(design.id, design.x, design.y, design.w, design.h, "Design\n2 people", {
        fill: "#e2e8f0",
        labelSize: 15,
      }),
      line("trunk", ceo.x + ceo.w / 2, ceo.y + ceo.h, [[0, 0], [0, railY - (ceo.y + ceo.h)]], {
        stroke: INK,
      }),
      line(
        "rail",
        eng.x + eng.w / 2,
        railY,
        [[0, 0], [prod.x + prod.w / 2 - (eng.x + eng.w / 2), 0]],
        { stroke: INK }
      ),
      elbow("o1", [
        [eng.x + eng.w / 2, railY],
        [eng.x + eng.w / 2, eng.y - 8],
      ]),
      elbow("o2", [
        [prod.x + prod.w / 2, railY],
        [prod.x + prod.w / 2, prod.y - 8],
      ]),
      arrow("o3", eng, platform, "", { from: "bottom", to: "top" }),
      arrow("o4", prod, design, "", { from: "bottom", to: "top" }),
      elbow(
        "route",
        [
          [design.x - 8, design.y + design.h / 2],
          [platform.x + platform.w + 8, design.y + design.h / 2],
        ],
        { dashed: true, stroke: MUTED }
      ),
      txt("route-l", 320, design.y + design.h / 2 - 18, "asks for capacity", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("note", 140, 460, "solid = reports to · dashed = who they actually ask", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("head", 140, 484, "21 people under CEO · Platform is the scarce resource", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("hire", 140, 508, "next hire: Platform SRE · not another Product IC", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("reqs", 140, 532, "Platform open reqs: 2 · Eng open reqs: 0", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("vacant", 300, 360, "vacant lead", { fontSize: 11, color: ACCENT }),
      txt("span", 140, 556, "span of control: CEO 2 · Eng 1 · Product 1", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("ratio", 140, 580, "IC:manager ≈ 6:1 Eng · 4:1 Product", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("sre-pin", 140, 320, "SRE req #1", { fontSize: 11, color: ACCENT }),
      txt("design-ask", 680, 360, "Design → Platform weekly", { fontSize: 11, color: MUTED }),
      txt("ceo-span", 480, 100, "span=2", { fontSize: 11, color: MUTED }),
      txt("eng-mgr", 40, 220, "1 Eng manager", { fontSize: 11, color: MUTED }),
      txt("prod-mgr", 680, 220, "1 PM", { fontSize: 11, color: MUTED }),
      // Vacant lead is a seat, not a caption — dashed empty box under Platform.
      rect("vacant-box", 140, 400, 156, 36, "(vacant lead)", {
        fill: PAPER,
        stroke: ACCENT,
        labelSize: 13,
      }),
      line("vacant-link", 218, 388, [[0, 0], [0, 12]], {
        stroke: ACCENT,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("vacant-age", 480, 408, "open 47d", { fontSize: 11, color: ACCENT }),
      txt("plat-ic", 140, 444, "3 ICs · seat empty", { fontSize: 11, color: ACCENT }),
      // SRE req #1 as a hiring card — next hire is a ticket, not only a caption.
      rect("sre-card", 320, 400, 140, 40, "SRE req #1", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 13,
      }),
      txt("sre-card-l", 320, 448, "priority hire", { fontSize: 11, color: ACCENT }),
      // Headcount mix bar — 21 under CEO.
      line("hc-bar", 504, 280, [[0, 0], [156, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("hc-fill", 504, 280, [[0, 0], [156, 0]], { stroke: MUTED, strokeWidth: 6 }),
      txt("hc-bar-l", 504, 292, "21 headcount", { fontSize: 11, color: MUTED }),
      // Scarce Platform chip.
      rect("scarce", 140, 480, 156, 32, "scarce: Platform", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Open reqs chip.
      rect("reqs-chip", 320, 480, 140, 28, "open reqs: 2", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Design→Platform ask chip.
      rect("ask-chip", 680, 400, 140, 28, "asks weekly", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Vacant age chip — open 47d is a stamp.
      rect("vac-age", 500, 480, 100, 28, "open 47d", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Span-of-control chip under CEO.
      rect("span-chip", 480, 60, 100, 28, "span = 2", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // IC:manager ratio chip.
      rect("ratio-chip", 620, 480, 140, 28, "IC:mgr 6:1", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Priority hire chip beside SRE card.
      rect("hire-chip", 320, 520, 140, 28, "priority hire", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Eng headcount chip.
      rect("eng-hc", 40, 280, 100, 28, "Eng 12", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Product headcount chip.
      rect("prod-hc", 680, 280, 100, 28, "Prod 4", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // CEO title span already — stamp headcount total.
      rect("hc21", 504, 320, 100, 28, "HC 21", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Design headcount chip.
      rect("des-hc", 680, 320, 100, 28, "Design 4", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Platform headcount chip.
      rect("plat-hc", 140, 360, 120, 28, "Platform 3", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Design→Platform weekly ask stamp.
      rect("weekly", 680, 440, 140, 28, "Design weekly", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Routing style stamp — dashed = ask path.
      rect("dash-ask", 680, 480, 140, 28, "dashed = ask", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Vacant seat age fill bar under Platform.
      line("vac-bar", 140, 520, [[0, 0], [156, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("vac-fill", 140, 520, [[0, 0], [117, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("vac-bar-l", 140, 532, "vacant 47d / 60d SLA", { fontSize: 11, color: ACCENT }),
    ]);
  },
  venn: () => {
    // Accent fill on a third ellipse in the lens — labels stay in the exclusive
    // lobes so the overlap never has to carry text it cannot fit. Exclusive
    // callouts sit outside the circles (collision gate treats ellipses as shapes).
    return doc("Venn — set overlap", [
      ellipse("a", 200, 130, 240, 240, "", { fill: FILL }),
      ellipse("b", 360, 130, 240, 240, "", { fill: FILL }),
      ellipse("lens", 340, 200, 120, 100, "", { fill: "#fed7aa", stroke: ACCENT }),
      txt("a-l", 230, 230, "Speed", { fontSize: 16 }),
      txt("b-l", 490, 230, "Quality", { fontSize: 16 }),
      txt("a-ex", 60, 220, "fast &\nwrong", { fontSize: 13, color: MUTED }),
      txt("b-ex", 640, 220, "perfect &\nlate", { fontSize: 13, color: MUTED }),
      line("leader", 400, 360, [[0, 0], [0, 28]], { stroke: ACCENT, strokeWidth: 1 }),
      txt("overlap", 320, 394, "ship it twice · n=12", { fontSize: 14, color: ACCENT }),
      txt("claim", 200, 440, "overlap is the product; exclusives are the tax", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("rule", 200, 464, "never ship Speed-only or Quality-only builds", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("decider", 200, 488, "ship gate: Design lead + Eng lead both say yes", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("sizes", 200, 512, "|Speed|≈40 · |Quality|≈35 · |overlap|≈12 this quarter", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("tax", 640, 280, "tax paid in exclusives", { fontSize: 11, color: MUTED }),
      txt("dual", 60, 280, "dual-owned ships only", { fontSize: 11, color: MUTED }),
      txt("excl-a", 60, 320, "exclusive ≈ 28", { fontSize: 11, color: MUTED }),
      txt("excl-b", 640, 320, "exclusive ≈ 23", { fontSize: 11, color: MUTED }),
      txt("tax-pct", 200, 536, "tax ≈ 51 exclusive / 12 overlap ≈ 4.3×", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("lens-n", 520, 394, "= product set", { fontSize: 11, color: ACCENT }),
      txt("speed-n", 60, 250, "|S|=40", { fontSize: 11, color: MUTED }),
      txt("qual-n", 640, 250, "|Q|=35", { fontSize: 11, color: MUTED }),
      // Killed exclusives are a pile — the tax isn't only a ratio caption.
      rect("killed", 60, 360, 120, 48, "killed ×9", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 14,
      }),
      txt("killed-l", 60, 416, "Speed-only this Q", { fontSize: 11, color: ACCENT }),
      rect("held", 640, 360, 120, 48, "held ×6", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 14,
      }),
      txt("held-l", 640, 416, "Quality-only parked", { fontSize: 11, color: MUTED }),
      // Overlap count stamp on the lens — n=12 is a chip, not only a caption.
      rect("ov-n", 360, 220, 80, 36, "n=12", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 14,
      }),
      // Tax ratio bar — 4.3× exclusives vs overlap.
      line("tax-bar", 200, 560, [[0, 0], [200, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("tax-fill", 200, 560, [[0, 0], [172, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("tax-bar-l", 200, 572, "tax 4.3× exclusives", { fontSize: 11, color: ACCENT }),
      // Ship-gate dual-owner chip.
      rect("dual-chip", 320, 440, 160, 28, "dual-owned ships", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Exclusive tax chip — Speed-only + Quality-only.
      rect("tax-chip", 520, 560, 140, 28, "tax ×15 killed", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Product-set chip under lens.
      rect("prod-chip", 360, 480, 120, 28, "product n=12", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Speed set size chip.
      rect("s-chip", 60, 500, 100, 28, "|S|=40", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Quality set size chip.
      rect("q-chip", 640, 500, 100, 28, "|Q|=35", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Held pile age chip.
      rect("held-age", 780, 440, 120, 28, "held this Q", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Killed this Q chip.
      rect("kill-q", 60, 540, 120, 28, "killed Q", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Ship twice chip.
      rect("ship2", 360, 520, 120, 28, "ship ×2", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Jaccard stamp — overlap / union.
      rect("jacc", 780, 500, 120, 28, "J≈0.19", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Union size stamp.
      rect("union", 780, 540, 120, 28, "|S∪Q|≈63", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Intersection count stamp — clear of held-age chip.
      rect("inter", 640, 540, 100, 28, "|∩|=12", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  // Tiers are trapezoids, not stacked bars: the widening is what says the base
  // carries everything above it. Side callouts pin each band to a concrete ask.
  pyramid: () => {
    const apex = 360;
    const tier = (id, yTop, yBottom, halfTop, halfBottom, opts) =>
      poly(
        id,
        [
          [apex - halfTop, yTop],
          [apex + halfTop, yTop],
          [apex + halfBottom, yBottom],
          [apex - halfBottom, yBottom],
        ],
        opts
      );
    return doc("Pyramid — ranked hierarchy", [
      tier("t3", 110, 186, 4, 78, { stroke: ACCENT, fill: "#fef3c7" }),
      tier("t2", 194, 270, 84, 164, { stroke: INK, fill: FILL }),
      tier("t1", 278, 354, 170, 250, { stroke: INK, fill: "#eef2f7" }),
      txt("t3-l", 320, 138, "Strategy", { fontSize: 15, color: ACCENT }),
      txt("t3-n", 318, 158, "3 bets", { fontSize: 11, color: ACCENT }),
      txt("t2-l", 300, 222, "Capabilities", { fontSize: 15 }),
      txt("t2-n", 298, 242, "12 squads", { fontSize: 11, color: MUTED }),
      txt("t1-l", 290, 306, "Infrastructure", { fontSize: 15 }),
      txt("t1-n", 288, 326, "60 eng", { fontSize: 11, color: MUTED }),
      // Leaders pin each callout to its band — floating copy isn't a pin.
      line("ld3", apex + 78, 148, [[0, 0], [40, 0]], { stroke: ACCENT, strokeWidth: 1 }),
      txt("t3-ex", apex + 126, 140, "which bets we fund", { fontSize: 13, color: ACCENT }),
      line("ld2", apex + 164, 232, [[0, 0], [40, 0]], { stroke: MUTED, strokeWidth: 1 }),
      txt("t2-ex", apex + 212, 224, "what we can ship", { fontSize: 13, color: MUTED }),
      line("ld1", apex + 250, 316, [[0, 0], [40, 0]], { stroke: MUTED, strokeWidth: 1 }),
      txt("t1-ex", apex + 298, 308, "what everything sits on", { fontSize: 13, color: MUTED }),
      txt("owners", 80, 370, "owners: exec / product / platform", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("invert", 80, 394, "invert it and strategy floats with nothing under it", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("spend", 80, 418, "budget weight: 10% / 30% / 60% headcount", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("review-py", 80, 442, "quarterly review: invert check before funding new bets", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("fund", 80, 466, "this quarter fund: Taste + Reach only", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("cut", 80, 490, "cut: Depth bet deferred to next quarter", {
        fontSize: 12,
        color: MUTED,
      }),
      // Width cue: Strategy apex is a point — the band count is the argument.
      txt("width", 520, 370, "base : apex ≈ 60×", { fontSize: 11, color: MUTED }),
      txt("bets", 440, 148, "Taste · Reach", { fontSize: 11, color: ACCENT }),
      txt("defer", 440, 168, "Depth deferred", { fontSize: 11, color: MUTED }),
      txt("infra-n", 290, 340, "60 eng under", { fontSize: 11, color: MUTED }),
      // Deferred Depth sits off-pyramid — cut is structural, not only captioned.
      rect("depth-cut", 80, 120, 120, 40, "Depth bet", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 14,
      }),
      txt("depth-cut-l", 80, 168, "deferred → next Q", { fontSize: 11, color: MUTED }),
      line("depth-x", 80, 140, [[0, 0], [120, 0]], {
        stroke: ACCENT,
        dashed: true,
        strokeWidth: 1,
      }),
      // Funded chips under Strategy — Taste + Reach are on the pyramid.
      rect("chip-t", 200, 100, 70, 28, "Taste", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      rect("chip-r", 280, 100, 70, 28, "Reach", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Budget weight bars beside each tier — 10/30/60 is visual weight.
      line("bw3", 520, 148, [[0, 0], [40, 0]], { stroke: ACCENT, strokeWidth: 8 }),
      line("bw2", 520, 232, [[0, 0], [90, 0]], { stroke: MUTED, strokeWidth: 8 }),
      line("bw1", 520, 316, [[0, 0], [150, 0]], { stroke: MUTED, strokeWidth: 8 }),
      txt("bw3-l", 568, 140, "10%", { fontSize: 11, color: ACCENT }),
      txt("bw2-l", 618, 224, "30%", { fontSize: 11, color: MUTED }),
      txt("bw1-l", 678, 308, "60%", { fontSize: 11, color: MUTED }),
      // Funded count chip — Taste+Reach only is a stamp.
      rect("fund-n", 200, 60, 150, 32, "fund 2 of 3", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 13,
      }),
      // Infra eng capacity bar — 60 eng.
      line("eng-bar", 290, 360, [[0, 0], [180, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("eng-fill", 290, 360, [[0, 0], [180, 0]], { stroke: MUTED, strokeWidth: 6 }),
      txt("eng-bar-l", 290, 372, "60 eng base", { fontSize: 11, color: MUTED }),
      // Deferred Depth stamp (already have cut box — add count).
      rect("defer-n", 80, 200, 120, 28, "1 bet deferred", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Invert-check gate before funding — the pyramid's safety rule.
      rect("inv-chip", 640, 400, 140, 28, "invert-check", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Capex weight chip — Strategy is 10%.
      rect("capex", 640, 440, 120, 28, "strat 10%", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Squad count chip.
      rect("squad-chip", 640, 480, 120, 28, "12 squads", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Taste share chip.
      rect("taste-share", 360, 40, 100, 28, "Taste on", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Reach chip twin.
      rect("reach-on", 470, 40, 100, 28, "Reach on", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Depth deferred already boxed — stamp next-Q.
      rect("next-q", 80, 240, 120, 28, "next Q Depth", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Exec owner chip.
      rect("exec-own", 80, 280, 120, 28, "exec owns", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Infra budget weight stamp.
      rect("infra60", 640, 520, 120, 28, "infra 60%", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  evidence: () => {
    // Claim + source + numbers + pass mark: a single JSON blob alone is a prop.
    // Same midline → pure horizontal proves arrow (ortho gate).
    const proof = { id: "proof", x: 460, y: 130, w: 320, h: 160 };
    const claim = { id: "claim", x: 60, y: 160, w: 240, h: 100 };
    const midY = proof.y + proof.h / 2;
    claim.y = midY - claim.h / 2;
    return doc("Evidence — proof artifact beside claim", [
      rect(claim.id, claim.x, claim.y, claim.w, claim.h, "Claim\nP99 < 200ms\nat 2k RPS"),
      rect(
        proof.id,
        proof.x,
        proof.y,
        proof.w,
        proof.h,
        '{\n  "suite": "checkout-load",\n  "p99_ms": 142,\n  "rps": 2000,\n  "pass": true\n}',
        {
          fill: PAPER,
          stroke: MUTED,
          labelSize: 14,
        }
      ),
      txt("proof-src", proof.x, proof.y - 24, "k6 · staging · 2026-02-14", {
        fontSize: 13,
        color: MUTED,
      }),
      arrow("e1", proof, claim, "", { from: "left", to: "right" }),
      txt("e1-l", 350, midY - 22, "proves", { fontSize: 14, color: MUTED }),
      txt("gate", 60, 310, "gate: merge blocked if p99 ≥ 200", {
        fontSize: 13,
        color: ACCENT,
      }),
      txt("n", 460, 310, "n = 12 runs · same build SHA", { fontSize: 12, color: MUTED }),
      txt("ci", 460, 334, "CI job: load-checkout · required check", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("owner", 60, 334, "owner: platform · on-call page if red", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("flake", 60, 358, "flake budget: ≤ 1 / 12 runs or check is yellow", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("link", 460, 358, "artifact: s3://load/checkout/2026-02-14/", {
        fontSize: 12,
        color: MUTED,
      }),
      // Mini history of the last four p99s — the claim is a trend, not one JSON blob.
      ...[118, 156, 149, 142].map((ms, i) =>
        dot(`hist${i}`, 460 + i * 28, 400 - (ms - 100) * 0.4, 4, {
          fill: i === 3 ? ACCENT : MUTED,
          stroke: i === 3 ? ACCENT : MUTED,
        })
      ),
      txt("hist-l", 460, 420, "last 4 runs p99", { fontSize: 11, color: MUTED }),
      txt("budget-e", 60, 382, "budget: fail the PR if any run ≥ 200", {
        fontSize: 12,
        color: ACCENT,
      }),
      // Fail-budget bar: remaining headroom vs the 200ms gate.
      line("fb", 460, 448, [[0, 0], [116, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("fb-used", 460, 448, [[0, 0], [82, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("fb-l", 460, 460, "fail budget used 71% this week", { fontSize: 11, color: MUTED }),
      txt("headroom", 460, 484, "headroom 58ms to gate", { fontSize: 11, color: "#15803d" }),
      txt("suite-n", 460, 100, "checkout-load", { fontSize: 11, color: MUTED }),
      // PASS chip beside proof — the gate result is a stamp, not only JSON pass:true.
      rect("pass", 800, 180, 80, 40, "PASS", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 16,
      }),
      txt("pass-l", 800, 228, "required check", { fontSize: 11, color: "#15803d" }),
      // Gate line on the mini history — 200ms is a mark on the sparkline.
      line("gate-h", 450, 360, [[0, 0], [120, 0]], {
        stroke: ACCENT,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("gate-h-l", 580, 352, "200ms gate", { fontSize: 11, color: ACCENT }),
      // Flake budget bar — ≤1/12 is a fill.
      line("flake-bar", 60, 420, [[0, 0], [120, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("flake-fill", 60, 420, [[0, 0], [10, 0]], { stroke: "#15803d", strokeWidth: 6 }),
      txt("flake-bar-l", 60, 432, "flake 0 / 12", { fontSize: 11, color: "#15803d" }),
      // Headroom chip — 58ms to gate.
      rect("hr-chip", 800, 260, 120, 32, "58ms headroom", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Flake stamp — 0/12 is green.
      rect("flake-chip", 60, 460, 120, 28, "flake 0/12", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Run count chip.
      rect("n-chip", 200, 460, 100, 28, "n = 12", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Required-check chip under PASS.
      rect("req-ev", 800, 300, 120, 28, "required ✓", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Suite name chip.
      rect("suite-chip", 800, 340, 140, 28, "checkout-load", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Staging date chip.
      rect("date-chip", 800, 380, 140, 28, "2026-02-14", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // k6 source chip.
      rect("k6-chip", 800, 420, 100, 28, "k6 · stg", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Latest p99 stamp from proof JSON.
      rect("p99-ev", 800, 460, 100, 28, "p99 142", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  // One column per option, one row per question asked of both — a contrast only
  // reads as an argument when the same question is put to each side.
  comparison: () => {
    const rows = [
      { id: "edit", ask: "Edit a box", before: "re-run the exporter", after: "drag it in Excalidraw" },
      { id: "review", ask: "Review a change", before: "eyeball two PNGs", after: "diff the source" },
      { id: "rebrand", ask: "Re-theme", before: "recolour by hand", after: "pass --theme dark" },
      { id: "open", ask: "Open later", before: "hope the PNG is enough", after: "open the .excalidraw" },
      { id: "ci", ask: "CI render", before: "no source to hydrate", after: "excalidraw-render in CI" },
      { id: "share", ask: "Share w/ PM", before: "attach a stale PNG", after: "link the live file" },
    ];
    const cellW = 250;
    return doc("Comparison — same questions, two answers", [
      txt("h-before", 250, 100, "Static export", { fontSize: 16, color: MUTED }),
      txt("h-after", 540, 100, "Editable source", { fontSize: 16, color: "#15803d" }),
      line("h-rule", 100, 128, [[0, 0], [700, 0]], { strokeWidth: 1, stroke: GRID }),
      ...rows.flatMap((row, i) => {
        const y = 140 + i * 58;
        return [
          txt(`${row.id}-ask`, 100, y + 14, row.ask, { fontSize: 14, color: MUTED }),
          rect(`${row.id}-b`, 250, y, cellW, 46, row.before, { labelSize: 14, fill: "#f1f5f9" }),
          rect(`${row.id}-a`, 530, y, cellW, 46, row.after, {
            labelSize: 14,
            fill: "#dcfce7",
            stroke: "#15803d",
          }),
        ];
      }),
      txt("verdict", 250, 500, "editable wins on every question that matters after day one", {
        fontSize: 13,
        color: "#15803d",
      }),
      txt("day0", 250, 524, "day zero still needs a PNG; day two needs the source", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("score", 250, 548, "6/6 questions favor editable after day one", {
        fontSize: 12,
        color: "#15803d",
      }),
      txt("cost", 250, 572, "regen cost: static ≈ hours · editable ≈ minutes", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("day1", 530, 620, "day-1 cost: learn Excalidraw once", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("buyer", 250, 596, "buyer ask: \"can we edit the boxes?\" → editable", {
        fontSize: 12,
        color: "#15803d",
      }),
      txt("row-n", 100, 100, "6 matched questions", { fontSize: 11, color: MUTED }),
      txt("col-win", 540, 80, "preferred →", { fontSize: 11, color: "#15803d" }),
      // Score chip — 6/6 is a stamp, not only a caption.
      rect("score-chip", 800, 500, 100, 40, "6/6 win", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 14,
      }),
      txt("score-chip-l", 800, 548, "after day one", { fontSize: 11, color: "#15803d" }),
      // Preferred column chip.
      rect("pref-chip", 700, 60, 140, 28, "editable wins", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Static export lose chip.
      rect("lose-chip", 250, 60, 140, 28, "static loses", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  // The boundary earns its keep by leaving something out: browser and CDN sit
  // outside the cluster, which is the whole reason to draw the cluster.
  "high-level": () => {
    const browser = { id: "browser", x: 60, y: 208, w: 132, h: 48 };
    const cdn = { id: "cdn", x: 240, y: 208, w: 132, h: 48 };
    const app = { id: "app", x: 460, y: 160, w: 132, h: 48 };
    const db = { id: "db", x: 660, y: 140, w: 132, h: 48 };
    const cache = { id: "cache", x: 660, y: 280, w: 132, h: 40 };
    const worker = { id: "worker", x: 460, y: 280, w: 132, h: 40 };
    const appRight = app.x + app.w;
    const appCy = app.y + app.h / 2;
    return doc("High-level — end-to-end on one cluster", [
      zone("cluster", 420, 110, 412, 240, ""),
      txt("cluster-l", 436, 120, "Production cluster", { fontSize: 14, color: MUTED }),
      rect(browser.id, browser.x, browser.y, browser.w, browser.h, "Browser", { fill: PAPER, stroke: MUTED }),
      rect(cdn.id, cdn.x, cdn.y, cdn.w, cdn.h, "CDN", { fill: PAPER, stroke: MUTED }),
      rect(app.id, app.x, app.y, app.w, app.h, "App"),
      rect(db.id, db.x, db.y, db.w, db.h, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
      rect(cache.id, cache.x, cache.y, cache.w, cache.h, "Redis"),
      rect(worker.id, worker.x, worker.y, worker.w, worker.h, "Worker", {
        fill: "#e2e8f0",
        labelSize: 15,
      }),
      arrow("hl1", browser, cdn, "", { from: "right", to: "left" }),
      // CDN → App: elbow so App can sit above Worker without a diagonal.
      elbow("hl2", [
        [cdn.x + cdn.w + 8, cdn.y + cdn.h / 2],
        [420, cdn.y + cdn.h / 2],
        [420, appCy],
        [app.x - 8, appCy],
      ]),
      elbow("hl3", [
        [appRight + 8, appCy],
        [appRight + 40, appCy],
        [appRight + 40, db.y + db.h / 2],
        [db.x - 8, db.y + db.h / 2],
      ]),
      // App reads Redis via the shared rail; Worker SETs on the bottom row.
      elbow("hl4", [
        [appRight + 8, appCy],
        [appRight + 40, appCy],
        [appRight + 40, cache.y + cache.h / 2],
        [cache.x - 8, cache.y + cache.h / 2],
      ]),
      arrow("hl5", app, worker, "", { from: "bottom", to: "top" }),
      arrow("hl6", worker, cache, "", { from: "right", to: "left" }),
      txt("hl1-l", 168, 186, "HTTPS", { fontSize: 13, color: MUTED }),
      txt("hl2-l", 348, 176, "edge cache", { fontSize: 13, color: MUTED }),
      txt("hl3-l", 600, 128, "SQL", { fontSize: 13, color: MUTED }),
      txt("hl4-l", 600, 248, "GET", { fontSize: 13, color: MUTED }),
      txt("hl5-l", 500, 248, "jobs", { fontSize: 12, color: MUTED }),
      txt("hl6-l", 580, 260, "SET", { fontSize: 12, color: MUTED }),
      txt("note", 60, 280, "origin stays inside; edge stays out", { fontSize: 13, color: MUTED }),
      txt("obs", 60, 304, "metrics scraped from App · not from CDN", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("ttl", 60, 328, "Redis TTL 15m · Worker owns warm SETs", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("fail", 60, 352, "failover: App AZ-a · Postgres primary AZ-b", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("rps", 60, 376, "budget: 2k RPS at edge · 400 RPS origin", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("warm-hl", 500, 340, "cache hit > 92% last 7d", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("origin", 500, 364, "origin only serves on miss", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("edge-hit", 240, 186, "edge hit 78%", { fontSize: 11, color: MUTED }),
      txt("p99-hl", 460, 140, "App p99 62ms", { fontSize: 11, color: ACCENT }),
      txt("cdn-ttl", 240, 268, "CDN TTL 1h", { fontSize: 11, color: MUTED }),
      txt("jobs-n", 460, 320, "jobs lag < 5s", { fontSize: 11, color: MUTED }),
      txt("sql-n", 660, 120, "primary", { fontSize: 11, color: ACCENT }),
      txt("redis-n", 800, 288, "hit 92%", { fontSize: 11, color: MUTED }),
      txt("https-n", 168, 268, "TLS 1.3", { fontSize: 11, color: MUTED }),
      txt("cluster-n", 436, 100, "3 nodes · k8s", { fontSize: 11, color: MUTED }),
      txt("pg-sz", 800, 152, "primary 400GB", { fontSize: 11, color: MUTED }),
      txt("worker-jobs", 460, 340, "queue depth 12", { fontSize: 11, color: MUTED }),
      // Metrics scrape from App — "not from CDN" needs a scraper outside the edge.
      rect("metrics", 60, 120, 120, 36, "Prometheus", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 13,
      }),
      elbow(
        "scrape",
        [
          [180, 138],
          [420, 138],
          [420, app.y - 8],
        ],
        { stroke: MUTED, dashed: true }
      ),
      txt("scrape-l", 200, 120, "scrape App only", { fontSize: 11, color: MUTED }),
      // Edge hit bar under CDN — 78% is a fill, not only a caption.
      line("edge-bar", 240, 292, [[0, 0], [132, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("edge-fill", 240, 292, [[0, 0], [103, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("edge-bar-l", 240, 304, "edge hit 78%", { fontSize: 11, color: MUTED }),
      // Origin RPS vs edge — 400 of 2k is a fill under the budget claim.
      line("orig-bar", 60, 400, [[0, 0], [160, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("orig-fill", 60, 400, [[0, 0], [32, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("orig-bar-l", 60, 412, "origin 400 / edge 2k RPS", { fontSize: 11, color: MUTED }),
      // App p99 chip.
      rect("p99-chip", 840, 120, 110, 28, "App p99 62ms", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Redis hit chip beside Cache.
      rect("redis-chip", 800, 320, 100, 28, "Redis 92%", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Origin-only-on-miss chip.
      rect("miss-only", 60, 440, 160, 28, "origin on miss", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Cluster node count chip.
      rect("nodes", 840, 200, 100, 28, "3 nodes", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Jobs lag chip.
      rect("jobs-lag", 460, 400, 120, 28, "jobs < 5s", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // TLS stamp on Client edge.
      rect("tls13", 60, 480, 100, 28, "TLS 1.3", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  "it-state": () => {
    const mainframe = { id: "mainframe", x: 80, y: 110, w: 150, h: 56 };
    const as400 = { id: "as400", x: 80, y: 190, w: 150, h: 56 };
    const files = { id: "files", x: 80, y: 270, w: 150, h: 56 };
    const esb = { id: "esb", x: 440, y: 185, w: 150, h: 64 };
    const saas = { id: "saas", x: 780, y: 140, w: 150, h: 56 };
    const warehouse = { id: "warehouse", x: 780, y: 230, w: 150, h: 56 };
    const railX = 320;
    const esbCy = esb.y + esb.h / 2;
    return doc("IT current-state — legacy landscape", [
      rect(mainframe.id, mainframe.x, mainframe.y, mainframe.w, mainframe.h, "Mainframe\nCOBOL jobs"),
      rect(as400.id, as400.x, as400.y, as400.w, as400.h, "AS/400\ninventory"),
      rect(files.id, files.x, files.y, files.w, files.h, "File share\nCSV dumps", {
        fill: "#e2e8f0",
        labelSize: 15,
      }),
      // Everything funnels through one bus: that is the finding, so it carries the accent.
      rect(esb.id, esb.x, esb.y, esb.w, esb.h, "ESB\nsingle throat", {
        fill: "#fed7aa",
        stroke: ACCENT,
      }),
      rect(saas.id, saas.x, saas.y, saas.w, saas.h, "SaaS CRM", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
      rect(warehouse.id, warehouse.x, warehouse.y, warehouse.w, warehouse.h, "Warehouse"),
      elbow("i1", [
        [mainframe.x + mainframe.w + 8, mainframe.y + mainframe.h / 2],
        [railX, mainframe.y + mainframe.h / 2],
        [railX, esbCy],
        [esb.x - 8, esbCy],
      ]),
      elbow("i2", [
        [as400.x + as400.w + 8, as400.y + as400.h / 2],
        [railX, as400.y + as400.h / 2],
        [railX, esbCy],
        [esb.x - 8, esbCy],
      ]),
      elbow("i2b", [
        [files.x + files.w + 8, files.y + files.h / 2],
        [railX, files.y + files.h / 2],
        [railX, esbCy],
        [esb.x - 8, esbCy],
      ]),
      elbow("i3", [
        [esb.x + esb.w + 8, esbCy],
        [720, esbCy],
        [720, saas.y + saas.h / 2],
        [saas.x - 8, saas.y + saas.h / 2],
      ]),
      elbow("i4", [
        [esb.x + esb.w + 8, esbCy],
        [720, esbCy],
        [720, warehouse.y + warehouse.h / 2],
        [warehouse.x - 8, warehouse.y + warehouse.h / 2],
      ]),
      txt("i1-l", 250, 120, "nightly batch", { fontSize: 13, color: MUTED }),
      txt("i2-l", 250, 200, "flat file", { fontSize: 13, color: MUTED }),
      txt("i2b-l", 250, 280, "drop folder", { fontSize: 13, color: MUTED }),
      txt("i3-l", 640, 148, "REST", { fontSize: 13, color: MUTED }),
      txt("i4-l", 640, 248, "CDC", { fontSize: 13, color: MUTED }),
      txt("find", 80, 360, "finding: every modernization path still hits the ESB", {
        fontSize: 13,
        color: ACCENT,
      }),
      txt("opt", 80, 384, "option under study: strangler around inventory only", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("risk", 80, 408, "risk: ESB MTTD ~ 4h · no bypass without Change Board", {
        fontSize: 12,
        color: MUTED,
      }),
      // Dashed hope path that isn't real yet — naming the fantasy is the audit.
      elbow(
        "bypass",
        [
          [as400.x + as400.w + 8, as400.y + 8],
          [780, as400.y + 8],
          [780, saas.y + saas.h / 2],
          [saas.x - 8, saas.y + saas.h / 2],
        ],
        { stroke: MUTED, dashed: true }
      ),
      txt("bypass-l", 560, 100, "hoped bypass (not live)", { fontSize: 12, color: MUTED }),
      txt("age", 80, 432, "Mainframe ~28y · AS/400 ~19y · ESB ~11y · SaaS ~3y", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("cost-it", 80, 456, "ESB ops cost ≈ 4× SaaS CRM last FY", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("throat-n", 440, 260, "~180 interfaces", { fontSize: 11, color: ACCENT }),
      txt("batch-n", 80, 80, "nightly: 42 jobs", { fontSize: 11, color: MUTED }),
      txt("saas-n", 780, 110, "Salesforce", { fontSize: 11, color: MUTED }),
      // Change Board gate on the hoped bypass — not live until approved.
      diamond("cb", 560, 60, 48, 40, ""),
      txt("cb-l", 552, 48, "CAB", { fontSize: 11, color: ACCENT }),
      txt("cb-n", 620, 72, "required", { fontSize: 11, color: MUTED }),
      // Strangler scope chip around inventory — option under study is a box.
      rect("strangle", 80, 480, 200, 40, "strangler: AS/400", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 13,
      }),
      txt("strangle-l", 80, 528, "study only · not funded", { fontSize: 11, color: MUTED }),
      // ESB cost chip — 4× SaaS.
      rect("cost-chip", 440, 320, 140, 28, "ESB 4× SaaS", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Interface count chip.
      rect("iface", 440, 360, 140, 28, "~180 ifaces", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  // Scoping is the argument: the same pipeline, cut where one role's reach ends.
  "data-flow": () => {
    const ingest = { id: "ingest", x: 90, y: 208, w: 132, h: 48 };
    const stream = { id: "stream", x: 268, y: 208, w: 132, h: 48 };
    const warehouse = { id: "warehouse", x: 566, y: 208, w: 148, h: 48 };
    const dash = { id: "dash", x: 766, y: 208, w: 148, h: 48 };
    return doc("Data flow — role-scoped pipeline", [
      zone("raw", 66, 168, 358, 128, ""),
      txt("raw-l", 82, 178, "service accounts only — raw PII", { fontSize: 13, color: ACCENT }),
      zone("scoped", 536, 168, 400, 128, ""),
      txt("scoped-l", 552, 178, "analytics engineer can read", { fontSize: 13, color: MUTED }),
      rect(ingest.id, ingest.x, ingest.y, ingest.w, ingest.h, "Ingest", { fill: "#fed7aa", stroke: ACCENT }),
      rect(stream.id, stream.x, stream.y, stream.w, stream.h, "Stream", { fill: "#fed7aa", stroke: ACCENT }),
      rect(warehouse.id, warehouse.x, warehouse.y, warehouse.w, warehouse.h, "Warehouse"),
      rect(dash.id, dash.x, dash.y, dash.w, dash.h, "Dashboards"),
      arrow("df1", ingest, stream, ""),
      arrow("df2", stream, warehouse, ""),
      arrow("df3", warehouse, dash, ""),
      txt("df1-l", 210, 158, "Kafka", { fontSize: 12, color: MUTED }),
      txt("df2-l", 430, 158, "masked", { fontSize: 13, color: MUTED }),
      txt("df3-l", 700, 158, "Looker", { fontSize: 12, color: MUTED }),
      // DLQ sits under Stream — failures don't leak into the scoped zone.
      rect("dlq", 268, 320, 132, 36, "DLQ", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 15,
      }),
      elbow(
        "df-dlq",
        [
          [stream.x + stream.w / 2, stream.y + stream.h + 6],
          [stream.x + stream.w / 2, 312],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("dlq-l", 410, 328, "poison → reprocess", { fontSize: 12, color: ACCENT }),
      txt("cut", 536, 320, "the cut is who may see raw PII", {
        fontSize: 13,
        color: ACCENT,
      }),
      txt("policy", 66, 380, "policy: PII stays in Kafka ACL · mask at Stream→WH", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("ret", 66, 404, "retention: raw 7d · warehouse 2y · dashboards live", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("parts", 430, 360, "Kafka: 24 partitions · ACL deny analysts", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("lag", 536, 380, "ingest lag SLO < 2 min", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("vol-df", 90, 268, "~40k msg/min", { fontSize: 11, color: MUTED }),
      txt("dlq-n", 268, 368, "DLQ depth < 20", { fontSize: 11, color: ACCENT }),
      txt("mask-n", 430, 248, "hash email+phone", { fontSize: 11, color: MUTED }),
      txt("wh-n", 566, 268, "Snowflake", { fontSize: 11, color: MUTED }),
      txt("dash-n", 766, 268, "12 boards", { fontSize: 11, color: MUTED }),
      txt("stream-n", 410, 248, "topic orders", { fontSize: 11, color: MUTED }),
      txt("kafka-ver", 268, 158, "Kafka 3.6", { fontSize: 11, color: MUTED }),
      // DLQ re-enters Stream — poison without a loop is a dead end, not a flow.
      elbow(
        "df-re",
        [
          [268 + 66, 356],
          [268 + 66, 380],
          [210, 380],
          [210, 232],
          [stream.x - 8, 232],
        ],
        { stroke: ACCENT, dashed: true }
      ),
      txt("df-re-l", 120, 372, "reprocess", { fontSize: 11, color: ACCENT }),
      // Schema Registry sits on the mask hop — contract before warehouse.
      rect("schema", 430, 280, 120, 36, "Schema Reg", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 13,
      }),
      txt("schema-n", 430, 324, "BACKWARD", { fontSize: 11, color: MUTED }),
      // ACL deny stamp on raw zone — analysts never touch Kafka.
      rect("acl", 66, 300, 140, 36, "ACL deny", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 13,
      }),
      txt("acl-l", 66, 344, "analysts blocked", { fontSize: 11, color: ACCENT }),
      // Mask contract chip on the cut.
      rect("mask-chip", 430, 400, 140, 32, "hash email+phone", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Warehouse engine chip.
      rect("wh-chip", 766, 300, 120, 28, "Snowflake", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Compat chip — BACKWARD contract.
      rect("compat-chip", 430, 440, 120, 28, "BACKWARD", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Reprocess chip on DLQ loop.
      rect("repr-chip", 120, 420, 120, 28, "reprocess ✓", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Analyst deny already ACL — stamp PII gate.
      rect("pii-chip", 66, 420, 100, 28, "raw PII", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Kafka version chip.
      rect("kaf-chip", 268, 120, 120, 28, "Kafka 3.6", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Mask hop chip.
      rect("mask-n", 430, 480, 120, 28, "mask hop", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Dashboard count stamp.
      rect("boards", 766, 340, 120, 28, "12 boards", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Orders topic stamp — clear of Kafka edge labels.
      rect("ord-t", 766, 380, 120, 28, "orders topic", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  "dp-integration": () => {
    const sources = [
      { id: "s-db", x: 60, y: 120, w: 156, h: 44, label: "Postgres" },
      { id: "s-events", x: 60, y: 186, w: 156, h: 44, label: "Clickstream" },
      { id: "s-files", x: 60, y: 252, w: 156, h: 44, label: "SFTP drop" },
    ];
    const core = { id: "core", x: 310, y: 152, w: 170, h: 112 };
    const consumers = [
      { id: "c-bi", x: 580, y: 110, w: 156, h: 44, label: "Dashboards" },
      { id: "c-ml", x: 580, y: 186, w: 156, h: 44, label: "ML features" },
      { id: "c-ops", x: 580, y: 262, w: 156, h: 44, label: "Reverse ETL" },
    ];
    const railIn = 260;
    const railOut = 520;
    const coreCy = core.y + core.h / 2;
    return doc("DP integration — sources → core → consumers", [
      ...sources.map((s) => rect(s.id, s.x, s.y, s.w, s.h, s.label)),
      rect(core.id, core.x, core.y, core.w, core.h, "Lakehouse\nDelta + Unity", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      ...consumers.map((c, i) =>
        rect(c.id, c.x, c.y, c.w, c.h, c.label, i === 2 ? { fill: "#e2e8f0", labelSize: 15 } : {})
      ),
      ...sources.map((s, i) =>
        elbow(`in${i}`, [
          [s.x + s.w + 8, s.y + s.h / 2],
          [railIn, s.y + s.h / 2],
          [railIn, coreCy],
          [core.x - 8, coreCy],
        ])
      ),
      ...consumers.map((c, i) =>
        elbow(`out${i}`, [
          [core.x + core.w + 8, coreCy],
          [railOut, coreCy],
          [railOut, c.y + c.h / 2],
          [c.x - 8, c.y + c.h / 2],
        ])
      ),
      txt("in-l", 230, 100, "CDC / batch", { fontSize: 12, color: MUTED }),
      txt("out-l", 500, 90, "SQL / features / sync", { fontSize: 12, color: MUTED }),
      txt("core-note", 310, 290, "one write path; many readers", { fontSize: 13, color: ACCENT }),
      txt("claim", 60, 320, "Reverse ETL proves the lake is not a dead end", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("slo", 60, 344, "SLO: ingest lag < 15 min · reverse ETL hourly", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("schema", 60, 368, "schema registry gates every CDC topic", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("own", 60, 392, "owner: data platform · page on lag breach", {
        fontSize: 12,
        color: MUTED,
      }),
      rect("reg", 310, 90, 170, 36, "Schema Registry", {
        fill: "#e2e8f0",
        labelSize: 14,
      }),
      elbow(
        "reg-l",
        [
          [core.x + core.w / 2, core.y - 8],
          [core.x + core.w / 2, 126],
        ],
        { stroke: MUTED, dashed: true }
      ),
      txt("compat", 500, 320, "compat: BACKWARD · reject breaking", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("lag-n", 310, 320, "lag p95 4m", { fontSize: 11, color: ACCENT }),
      txt("src-n", 60, 300, "3 sources · 3 consumers", { fontSize: 11, color: MUTED }),
      txt("etl-n", 580, 320, "reverse ETL hourly", { fontSize: 11, color: MUTED }),
      // Ingest lag bar vs 15m SLO — lag p95 4m is a fill level.
      line("lag-bar", 310, 360, [[0, 0], [170, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("lag-fill", 310, 360, [[0, 0], [45, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("lag-bar-l", 310, 372, "lag 4m / SLO 15m", { fontSize: 11, color: ACCENT }),
      // Source→consumer fan count — 3×3 is a stamp.
      rect("fan-n", 760, 186, 100, 40, "3×3 fan", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 13,
      }),
      // Reverse ETL proof chip.
      rect("retl", 580, 340, 140, 28, "not a dead end", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Lag SLO green chip — 4m under 15m.
      rect("lag-chip", 310, 400, 140, 28, "lag OK · 4m", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Hourly reverse-ETL chip.
      rect("hourly", 580, 380, 140, 28, "ETL hourly", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Schema Registry chip already above — stamp compat.
      rect("bw-chip", 500, 400, 120, 28, "BACKWARD", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Source count chip.
      rect("src3", 60, 340, 120, 28, "3 sources", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Consumer count chip.
      rect("con3", 580, 420, 120, 28, "3 consumers", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Page-on-lag ownership stamp.
      rect("page-lag", 580, 460, 140, 28, "page on lag", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  "dp-security-matrix": () => {
    const cell = (id, x, y, label, write) =>
      rect(id, x, y, 130, 44, label, write ? { fill: "#fed7aa", stroke: ACCENT } : { fill: PAPER, stroke: MUTED });
    const deny = (id, x, y) =>
      rect(id, x, y, 130, 44, "deny", { fill: "#fee2e2", stroke: "#b91c1c", labelSize: 15 });
    return doc("DP security matrix — role × resource", [
      txt("h1", 300, 128, "orders_pii", { fontSize: 14, color: MUTED }),
      txt("h2", 470, 128, "agg_revenue", { fontSize: 14, color: MUTED }),
      txt("h3", 640, 128, "secrets", { fontSize: 14, color: MUTED }),
      line("h-rule", 100, 152, [[0, 0], [670, 0]], { strokeWidth: 1 }),
      line("v-rule", 280, 152, [[0, 0], [0, 226]], { strokeWidth: 1 }),
      txt("r1", 110, 180, "Analyst", { fontSize: 15 }),
      txt("r2", 110, 238, "Engineer", { fontSize: 15 }),
      txt("r3", 110, 296, "Admin", { fontSize: 15 }),
      txt("r4", 110, 354, "Intern", { fontSize: 15, color: MUTED }),
      cell("c11", 300, 166, "read", false),
      cell("c12", 450, 166, "read", false),
      deny("c13", 600, 166),
      cell("c21", 300, 224, "write", true),
      cell("c22", 450, 224, "read", false),
      deny("c23", 600, 224),
      cell("c31", 300, 282, "write", true),
      cell("c32", 450, 282, "write", true),
      cell("c33", 600, 282, "write", true),
      deny("c41", 300, 340),
      cell("c42", 450, 340, "read", false),
      deny("c43", 600, 340),
      txt("leg", 100, 410, "orange = write · white = read · red = deny", { fontSize: 13, color: MUTED }),
      txt("claim", 100, 440, "Analyst never touches PII write path · Intern never sees secrets", {
        fontSize: 13,
        color: ACCENT,
      }),
      txt("deny", 100, 464, "deny-by-default · grants are explicit cells · audited weekly", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("glass", 100, 488, "break-glass: Admin only · logged · expires 4h", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("next-audit", 100, 512, "next access review: 2026-03-01", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("ticket", 450, 512, "open: SEC-441 break-glass log", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("mask", 300, 100, "orders_pii masked at query", { fontSize: 11, color: MUTED }),
      txt("cell-n", 600, 100, "12 cells · 5 deny", { fontSize: 11, color: MUTED }),
      txt("eng-scope", 780, 238, "Eng write: PII only", { fontSize: 11, color: ACCENT }),
      txt("admin-n", 780, 296, "Admin = break-glass", { fontSize: 11, color: ACCENT }),
      txt("intern-n", 780, 360, "Intern: agg only", { fontSize: 11, color: MUTED }),
      txt("analyst-n", 780, 180, "Analyst: read×2", { fontSize: 11, color: MUTED }),
      // Break-glass ticket is a card — SEC-441 without a box is wallpaper.
      rect("bg", 100, 540, 200, 48, "SEC-441 · 4h", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 14,
      }),
      txt("bg-l", 100, 596, "break-glass open · Admin", { fontSize: 11, color: ACCENT }),
      // Deny column highlight for secrets — the red column is the argument.
      line("deny-col", 600, 152, [[0, 0], [0, 226]], {
        stroke: "#b91c1c",
        dashed: true,
        strokeWidth: 1,
      }),
      txt("deny-col-l", 740, 128, "deny column", { fontSize: 11, color: "#b91c1c" }),
      // Deny cell count — 5 of 12 is a fill.
      line("deny-bar", 450, 560, [[0, 0], [180, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("deny-fill", 450, 560, [[0, 0], [75, 0]], { stroke: "#b91c1c", strokeWidth: 6 }),
      txt("deny-bar-l", 450, 572, "5 deny / 12 cells", { fontSize: 11, color: "#b91c1c" }),
      // Intern least-privilege chip.
      rect("intern-chip", 780, 400, 120, 28, "least privilege", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Next access review chip.
      rect("rev-chip", 450, 600, 160, 28, "review 2026-03-01", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Deny count chip.
      rect("deny-n", 640, 600, 120, 28, "5 deny cells", {
        fill: "#fee2e2",
        stroke: "#b91c1c",
        labelSize: 12,
      }),
      // Admin break-glass chip.
      rect("admin-chip", 780, 440, 120, 28, "Admin BG", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Analyst read chip.
      rect("an-read", 780, 480, 120, 28, "Analyst R×2", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Intern scope stamp.
      rect("int-agg", 780, 520, 120, 28, "Intern agg", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  bar: () => {
    // A bar without a scale only shows which is taller. Ticks + avg make it a number.
    const baseline = 320;
    const perUnit = 1.6;
    const avg = 66;
    const prior = [38, 52, 48, 78];
    const bar = (id, x, value, label, accent) => {
      const top = baseline - value * perUnit;
      return [
        rect(id, x, top, 60, value * perUnit, "", accent ? { fill: ACCENT, stroke: ACCENT } : { fill: FILL }),
        txt(`${id}-l`, x + 16, baseline + 12, label, { fontSize: 14, color: MUTED }),
        txt(`${id}-v`, x + (value >= 100 ? 8 : 14), top - 22, `${value}`, {
          fontSize: 14,
          color: accent ? ACCENT : MUTED,
        }),
      ];
    };
    const ghost = (id, x, value) => {
      const top = baseline - value * perUnit;
      // Left of the live bar so YoY peeks out instead of hiding under the fill.
      return rect(id, x - 18, top, 28, value * perUnit, "", {
        fill: "#e2e8f0",
        stroke: MUTED,
      });
    };
    const tick = (id, value) => [
      line(id, 140, baseline - value * perUnit, [[0, 0], [440, 0]], { strokeWidth: 1, stroke: GRID }),
      txt(`${id}-l`, 96, baseline - value * perUnit - 8, `${value}`, { fontSize: 13, color: MUTED }),
    ];
    const goal = 90;
    return doc("Bar chart — categorical comparison", [
      ...tick("t25", 25),
      ...tick("t50", 50),
      ...tick("t75", 75),
      ...tick("t100", 100),
      line("y-axis", 140, 130, [[0, 0], [0, 190]], { stroke: INK }),
      line("x-axis", 140, baseline, [[0, 0], [440, 0]], { stroke: INK }),
      txt("y-unit", 96, 108, "signups (k)", { fontSize: 13, color: MUTED }),
      // Prior-year ghosts behind bars: YoY is visible, not only captioned.
      ghost("g1", 180, prior[0]),
      ghost("g2", 280, prior[1]),
      ghost("g3", 380, prior[2]),
      ghost("g4", 480, prior[3]),
      ...bar("b1", 180, 44, "Q1"),
      ...bar("b2", 280, 65, "Q2"),
      ...bar("b3", 380, 55, "Q3"),
      ...bar("b4", 480, 101, "Q4", true),
      // Q4 split: paid rides on organic — the launch mix is the claim.
      rect("b4-paid", 480, baseline - 101 * perUnit, 60, 41 * perUnit, "", {
        fill: "#9a3412",
        stroke: "#9a3412",
      }),
      txt("paid-l", 550, baseline - 101 * perUnit + 8, "paid 41", { fontSize: 11, color: ACCENT }),
      txt("org-l", 550, baseline - 60 * perUnit, "organic 60", { fontSize: 11, color: MUTED }),
      // Per-bar YoY deltas: the ghost alone shows prior; the delta names the bet.
      txt("d1", 188, baseline + 36, "+6", { fontSize: 11, color: MUTED }),
      txt("d2", 288, baseline + 36, "+13", { fontSize: 11, color: MUTED }),
      txt("d3", 388, baseline + 36, "+7", { fontSize: 11, color: MUTED }),
      txt("d4", 488, baseline + 36, "+23", { fontSize: 11, color: ACCENT }),
      // Average line: Q4's claim is "above the year", not only "tallest bar".
      line("avg", 140, baseline - avg * perUnit, [[0, 0], [440, 0]], {
        stroke: MUTED,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("avg-l", 590, baseline - avg * perUnit - 8, `avg ${avg}`, { fontSize: 12, color: MUTED }),
      // Goal band: clearing 90k is the plan; Q4 alone clears it.
      line("goal", 140, baseline - goal * perUnit, [[0, 0], [440, 0]], {
        stroke: ACCENT,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("goal-l", 590, baseline - goal * perUnit - 8, `goal ${goal}`, {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("dip", 360, baseline - 55 * perUnit - 40, "Q3 dip", { fontSize: 12, color: MUTED }),
      // Dip stem: the trough is a measured drop, not a caption floating near a short bar.
      line("dip-stem", 410, baseline - 55 * perUnit - 8, [[0, 0], [0, -24]], {
        stroke: MUTED,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("callout", 360, 48, "record quarter", { fontSize: 14, color: ACCENT }),
      txt("delta", 540, 148, "+35 vs avg", { fontSize: 12, color: ACCENT }),
      txt("prior-l", 590, 280, "grey = prior year", { fontSize: 12, color: MUTED }),
      txt("yoy", 180, baseline + 56, "+30% YoY · theme pack launch in Q4", { fontSize: 13, color: MUTED }),
      txt("launch", 180, baseline + 80, "launch week: Nov 3 · paid + organic · YTD 265k", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("src", 180, baseline + 104, "source: warehouse.signups_daily · freeze 2026-01-08", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("mix", 180, baseline + 128, "Q4 mix: 41% paid · 59% organic", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("target-q", 180, baseline + 152, "2026 target: 120k / quarter by Q4", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("share", 550, 124, "Q4 = 38% of YTD", { fontSize: 11, color: ACCENT }),
      txt("cum", 590, baseline - 50 * perUnit - 8, "YTD 265", { fontSize: 11, color: MUTED }),
      // YoY delta stems beside the chart: each quarter's lift off prior year.
      ...[44, 65, 55, 101].map((v, i) =>
        line(
          `spark${i}`,
          700 + i * 18,
          baseline - prior[i] * perUnit,
          [[0, 0], [0, -(v - prior[i]) * perUnit]],
          {
            stroke: i === 3 ? ACCENT : MUTED,
            strokeWidth: 2,
          }
        )
      ),
      txt("spark-l", 700, 108, "Δ YoY", { fontSize: 11, color: MUTED }),
      txt("q3-cause", 250, baseline + 176, "Q3 cause: promo pause", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("q4-vs", 550, 172, "Q4 vs goal +11k", { fontSize: 11, color: ACCENT }),
      txt("prior-tot", 590, baseline + 36, "prior YTD 216", { fontSize: 11, color: MUTED }),
      txt("goal-gap", 590, baseline - goal * perUnit + 12, "gap closed Q4", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("paid-pct", 550, baseline - 80 * perUnit, "paid share ↑", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("q1-base", 160, baseline + 200, "Q1 = year base", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("freeze-d", 400, baseline + 200, "freeze 2026-01-08", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("q2-peak", 280, baseline - 65 * perUnit - 36, "mid-year", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("legend-b", 590, 300, "live vs prior", { fontSize: 11, color: MUTED }),
      // Launch week pin on Q4 — Nov 3 is a mark on the category, not only a caption.
      diamond("launch-d", 500, 48, 36, 32, ""),
      txt("launch-d-l", 540, 54, "Nov 3", { fontSize: 11, color: ACCENT }),
      // 2026 target as a floating goal tick above the chart.
      line("tgt26", 140, 120, [[0, 0], [440, 0]], {
        stroke: MUTED,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("tgt26-l", 590, 112, "2026 120k", { fontSize: 11, color: MUTED }),
      // YTD share of Q4 — 38% is a fill beside the callout.
      line("share-bar", 550, 200, [[0, 0], [100, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("share-fill", 550, 200, [[0, 0], [38, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("share-bar-l", 550, 212, "Q4 38% YTD", { fontSize: 11, color: ACCENT }),
      // Paid share of Q4 — 41% is a fill under paid label.
      line("paid-bar", 550, 240, [[0, 0], [100, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("paid-fill", 550, 240, [[0, 0], [41, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("paid-bar-l", 550, 252, "paid 41%", { fontSize: 11, color: ACCENT }),
      // Goal clearance chip — +11k over goal.
      rect("goal-chip", 700, 148, 110, 28, "+11k goal", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // YoY lift chip.
      rect("yoy-chip", 700, 184, 110, 28, "+30% YoY", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Record quarter stamp on Q4.
      rect("rec-chip", 700, 220, 120, 28, "record Q4", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Freeze date chip.
      rect("frz-chip", 700, 256, 140, 28, "freeze 01-08", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // YTD total chip.
      rect("ytd-chip", 700, 292, 110, 28, "YTD 265k", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Q3 pause chip.
      rect("q3-chip", 250, baseline + 220, 120, 28, "Q3 pause", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Paid share chip.
      rect("paid-chip", 700, 328, 110, 28, "paid 41%", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Prior-year YTD stamp.
      rect("prior-chip", 700, 364, 120, 28, "prior 216k", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Launch date stamp.
      rect("nov3", 700, 400, 100, 28, "Nov 3", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  line: () => {
    const baseline = 320;
    const perMs = 0.4;
    const y = (ms) => baseline - ms * perMs;
    const readings = [400, 345, 315, 215, 168, 142];
    const prior = [380, 360, 340, 330, 320, 310];
    const at = (i) => [160 + i * 92, y(readings[i])];
    const atP = (i) => [160 + i * 92, y(prior[i])];
    const tick = (id, ms) => [
      line(id, 140, y(ms), [[0, 0], [480, 0]], { strokeWidth: 1, stroke: GRID }),
      txt(`${id}-l`, 74, y(ms) - 8, `${ms}ms`, { fontSize: 13, color: MUTED }),
    ];
    // Rewrite lands between reading 3 and 4 — the claim is "after this, under SLA".
    const rewriteX = 160 + 3.5 * 92;
    return doc("Line chart — trend over time", [
      ...tick("t200", 200),
      ...tick("t300", 300),
      ...tick("t400", 400),
      line("y-axis", 140, 140, [[0, 0], [0, 180]], { stroke: INK }),
      line("x-axis", 140, baseline, [[0, 0], [480, 0]], { stroke: INK }),
      txt("y-unit", 74, 116, "p99 latency", { fontSize: 13, color: MUTED }),
      txt("x0", 146, baseline + 12, "2024", { fontSize: 13, color: MUTED }),
      txt("x1", 570, baseline + 12, "2026", { fontSize: 13, color: MUTED }),
      // SLA threshold: the chart's claim is crossing under, not just falling.
      line("sla", 140, y(200), [[0, 0], [480, 0]], { stroke: ACCENT, dashed: true, strokeWidth: 1 }),
      txt("sla-l", 630, y(200) - 8, "SLA 200ms", { fontSize: 12, color: ACCENT }),
      // Prior year never crossed SLA — rewrite is the cause, not seasonality.
      poly("prior", prior.map((_, i) => atP(i)), { stroke: MUTED, open: true, dashed: true, strokeWidth: 1 }),
      ...prior.map((_, i) => {
        const [px, py] = atP(i);
        return dot(`p${i}`, px, py, 3, { fill: MUTED, stroke: MUTED });
      }),
      txt("prior-l", 630, y(310) - 8, "prior year", { fontSize: 11, color: MUTED }),
      poly("series", readings.map((_, i) => at(i)), { stroke: ACCENT, open: true }),
      ...readings.map((_, i) => {
        const [px, py] = at(i);
        return dot(`s${i}`, px, py, 5, { fill: ACCENT, stroke: ACCENT });
      }),
      txt("start-v", at(0)[0] - 18, at(0)[1] - 16, "400", { fontSize: 12, color: MUTED }),
      ...readings.map((_, i) =>
        txt(`rel${i}`, at(i)[0] - 8, baseline + 28, `R${i + 1}`, { fontSize: 11, color: MUTED })
      ),
      line("rewrite", rewriteX, 150, [[0, 0], [0, baseline - 150]], {
        stroke: MUTED,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("rewrite-l", rewriteX - 28, 132, "index rewrite", { fontSize: 12, color: MUTED }),
      txt("cross", rewriteX + 8, y(200) + 12, "R4 crosses", { fontSize: 11, color: ACCENT }),
      txt("r4-v", at(3)[0] - 10, at(3)[1] - 18, "215", { fontSize: 11, color: MUTED }),
      // Pre-rewrite zone: falling but still over SLA — rewrite is the cause, not drift.
      txt("over", 200, y(300) - 4, "over SLA", { fontSize: 12, color: MUTED }),
      txt("callout", 634, y(142) - 10, "142ms", { fontSize: 15, color: ACCENT }),
      txt("note", 160, baseline + 48, "crossed under SLA after the index rewrite", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("delta", 160, baseline + 72, "−258ms from start · 6 releases · hold <180ms", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("owner-l", 160, baseline + 96, "owner: search eng · alert if p99 > 180 for 15m", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("hold", 630, y(142) + 16, "hold <180", { fontSize: 11, color: MUTED }),
      // Alert band sits under SLA so the page fires before the contract breaks.
      line("alert", 140, y(180), [[0, 0], [480, 0]], { stroke: MUTED, dashed: true, strokeWidth: 1 }),
      txt("alert-l", 630, y(180) - 8, "alert 180", { fontSize: 11, color: MUTED }),
      txt("end-v", at(5)[0] - 10, at(5)[1] - 16, "142", { fontSize: 12, color: ACCENT }),
      txt("under", 520, y(142) + 28, "under SLA", { fontSize: 11, color: ACCENT }),
      // Hold span on R5–R6: the win is staying under, not one lucky reading.
      line("hold-h", at(4)[0], y(190), [[0, 0], [at(5)[0] - at(4)[0], 0]], {
        stroke: ACCENT,
        strokeWidth: 1,
      }),
      txt("hold-span", at(4)[0] + 8, y(190) - 16, "hold", { fontSize: 11, color: ACCENT }),
      txt("rel-cad", 400, baseline + 120, "release cadence: ~3wk", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("prior-min", 630, y(310) + 12, "prior never <SLA", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("r5-v", at(4)[0] - 10, at(4)[1] - 16, "168", { fontSize: 11, color: MUTED }),
      // Shade the under-alert band so hold isn't only a caption.
      line("band-l", rewriteX, y(180), [[0, 0], [at(5)[0] - rewriteX + 20, 0]], {
        stroke: "#86efac",
        strokeWidth: 8,
      }),
      txt("band-l2", rewriteX + 8, y(180) + 12, "safe band", { fontSize: 11, color: "#15803d" }),
      txt("delta-r", 400, baseline + 144, "R1→R6: −258ms · −64.5%", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("r6-ok", at(5)[0] + 16, at(5)[1] + 4, "ok", { fontSize: 11, color: "#15803d" }),
      txt("rewrite-cost", rewriteX - 40, 116, "2wk rewrite", { fontSize: 11, color: MUTED }),
      txt("pages", 630, y(180) + 28, "0 pages this wk", { fontSize: 11, color: "#15803d" }),
      txt("sla-met", 400, y(168) - 4, "5 releases under", {
        fontSize: 11,
        color: "#15803d",
      }),
      txt("r3-v", at(2)[0] - 10, at(2)[1] - 16, "315", { fontSize: 11, color: MUTED }),
      txt("r2-v", at(1)[0] - 10, at(1)[1] - 16, "345", { fontSize: 11, color: MUTED }),
      txt("prior-end", atP(5)[0] + 8, atP(5)[1] - 12, "310", { fontSize: 11, color: MUTED }),
      txt("series-n", 160, baseline + 168, "series: current vs prior year", {
        fontSize: 11,
        color: MUTED,
      }),
      // Rewrite duration bracket — 2wk is a span on the axis, not only a caption.
      line("rw-br", rewriteX - 40, 100, [[0, 0], [80, 0]], {
        stroke: MUTED,
        strokeWidth: 1,
      }),
      line("rw-bl", rewriteX - 40, 96, [[0, 0], [0, 8]], { stroke: MUTED, strokeWidth: 1 }),
      line("rw-br2", rewriteX + 40, 96, [[0, 0], [0, 8]], { stroke: MUTED, strokeWidth: 1 }),
      // Last page event before rewrite — pages weren't zero forever.
      ellipse("page-ev", at(2)[0] - 6, y(315) - 40, 14, 14, "", {
        fill: "#fee2e2",
        stroke: ACCENT,
      }),
      txt("page-ev-l", at(2)[0] + 12, y(315) - 44, "page", { fontSize: 11, color: ACCENT }),
      // Cross-under marker at R4 — the SLA win is a stamp on the reading.
      ellipse("cross-mark", at(3)[0] - 8, y(200) - 8, 16, 16, "", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
      txt("cross-mark-l", at(3)[0] + 12, y(200) - 12, "under", { fontSize: 11, color: "#15803d" }),
      // Improvement fill — −64.5% from R1 is a bar, not only a caption.
      line("imp-bar", 160, baseline + 190, [[0, 0], [200, 0]], { stroke: MUTED, strokeWidth: 6 }),
      line("imp-fill", 160, baseline + 190, [[0, 0], [129, 0]], { stroke: ACCENT, strokeWidth: 6 }),
      txt("imp-bar-l", 160, baseline + 202, "−64.5% R1→R6", { fontSize: 11, color: ACCENT }),
      // Pages this week — 0 is a green chip under alert.
      rect("page0", 630, y(180) + 48, 90, 28, "0 pages", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Safe-band width under alert — hold span as a chip.
      rect("hold-chip", at(5)[0] - 20, y(142) + 40, 80, 28, "hold OK", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Rewrite cost chip.
      rect("rw-chip", rewriteX - 50, 80, 100, 28, "2wk rewrite", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Under-SLA count chip — 5 releases is the streak.
      rect("under-n", 400, y(168) + 20, 120, 28, "5 under SLA", {
        fill: "#dcfce7",
        stroke: "#15803d",
        labelSize: 12,
      }),
      // Prior year never cleared SLA — contrast stamp.
      rect("prior-chip", 630, baseline + 220, 140, 28, "prior never <SLA", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Alert threshold chip.
      rect("alert-chip", 160, baseline + 220, 120, 28, "alert 180ms", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Cadence chip.
      rect("cad-chip", 300, baseline + 220, 120, 28, "cadence 3wk", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Delta chip.
      rect("delta-chip", 440, baseline + 220, 120, 28, "−258ms", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Release count chip.
      rect("rel6", 580, baseline + 220, 100, 28, "6 releases", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Search eng owner chip.
      rect("own-chip", 160, baseline + 250, 140, 28, "search eng", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // SLA contract stamp.
      rect("sla200", 320, baseline + 250, 120, 28, "SLA 200ms", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
  scatter: () => {
    // Errors fall with practice — a rising cloud would tell the wrong story.
    const baseline = 320;
    const points = [
      [180, 150],
      [210, 168],
      [240, 160],
      [270, 190],
      [300, 182],
      [330, 210],
      [360, 205],
      [390, 230],
      [420, 248],
      [450, 242],
      [480, 270],
    ];
    const tick = (id, y, label) => [
      line(id, 140, y, [[0, 0], [400, 0]], { strokeWidth: 1, stroke: GRID }),
      txt(`${id}-l`, 96, y - 8, label, { fontSize: 12, color: MUTED }),
    ];
    return doc("Scatter — distribution + correlation", [
      ...tick("t25", 295, "25"),
      ...tick("t50", 270, "50"),
      ...tick("t100", 200, "100"),
      ...tick("t150", 150, "150"),
      line("y-axis", 140, 130, [[0, 0], [0, 190]], { stroke: INK }),
      line("x-axis", 140, baseline, [[0, 0], [400, 0]], { stroke: INK }),
      txt("y-label", 78, 112, "errors", { fontSize: 13, color: MUTED }),
      txt("x-label", 390, baseline + 14, "hours of practice", { fontSize: 13, color: MUTED }),
      line("trend", 170, 145, [[0, 0], [320, 140]], { stroke: ACCENT, dashed: true }),
      ...points.map(([x, y], i) =>
        i === points.length - 1
          ? dot(`p${i}`, x, y, 7, { fill: ACCENT, stroke: ACCENT })
          : dot(`p${i}`, x, y, 6)
      ),
      // Residual above the trend — named so it isn't mistaken for noise.
      dot("res", 300, 140, 5, { fill: MUTED, stroke: MUTED }),
      txt("res-l", 310, 124, "residual", { fontSize: 11, color: MUTED }),
      // Stem down to the fit: residual is a distance, not a lonely outlier.
      line("res-stem", 300, 145, [[0, 0], [0, 56]], { stroke: MUTED, dashed: true, strokeWidth: 1 }),
      // Practice hour ticks: the x claim needs units, not only a caption.
      ...[200, 300, 400].map((x, i) =>
        line(`xh${i}`, x, baseline, [[0, 0], [0, 6]], { strokeWidth: 1, stroke: MUTED })
      ),
      txt("xh0", 188, baseline + 8, "10h", { fontSize: 11, color: MUTED }),
      txt("xh1", 288, baseline + 8, "20h", { fontSize: 11, color: MUTED }),
      txt("xh2", 388, baseline + 8, "30h", { fontSize: 11, color: MUTED }),
      // Novice cluster: the left side is the argument before practice pays off.
      ellipse("nov-zone", 160, 130, 100, 70, "", { stroke: MUTED, strokeWidth: 1, dashed: true, fill: "transparent" }),
      txt("novice", 168, 118, "novice cluster", { fontSize: 12, color: MUTED }),
      txt("callout", 500, 260, "fewer errors\nwith practice", { fontSize: 13, color: ACCENT }),
      txt("r2", 500, 220, "r ≈ −0.82", { fontSize: 12, color: MUTED }),
      txt("p", 500, 196, "p < 0.01", { fontSize: 12, color: MUTED }),
      txt("out", 500, 300, "accent = last session", { fontSize: 12, color: MUTED }),
      txt("n", 140, baseline + 40, "n = 48 sessions · same cohort", { fontSize: 12, color: MUTED }),
      txt("range", 140, baseline + 64, "practice range: 2–40 hours · no weekend outliers", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("ci95", 500, 340, "95% CI on slope excludes 0", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("cohort", 140, baseline + 88, "cohort: eng onboarding class · 2025-Q4", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("method", 500, 364, "OLS · robust SE", { fontSize: 11, color: MUTED }),
      txt("target-sc", 140, baseline + 112, "target: <40 errors after 30h practice", {
        fontSize: 12,
        color: ACCENT,
      }),
      // Target floor as a line: <40 after 30h is measurable on the chart.
      line("err-tgt", 140, 270, [[0, 0], [400, 0]], { stroke: ACCENT, dashed: true, strokeWidth: 1 }),
      txt("err-tgt-l", 550, 262, "target 40", { fontSize: 11, color: ACCENT }),
      txt("last-h", 460, 248, "38h practiced", { fontSize: 11, color: ACCENT }),
      txt("slope", 500, 388, "slope ≈ −2.1 err/h", { fontSize: 11, color: MUTED }),
      txt("nov-n", 168, 200, "n=11 novice", { fontSize: 11, color: MUTED }),
      txt("exp-n", 420, 248, "n=37 practiced", { fontSize: 11, color: MUTED }),
      txt("fit", 170, 300, "fit R²≈0.67", { fontSize: 11, color: MUTED }),
      txt("out-n", 450, 280, "1 residual", { fontSize: 11, color: MUTED }),
      txt("last-err", 460, 232, "28 errors", { fontSize: 11, color: ACCENT }),
      txt("start-err", 96, 160, "~140 err", { fontSize: 11, color: MUTED }),
      // Expert cluster on the right — practice pays off as a zone, not only n=.
      ellipse("exp-zone", 400, 220, 110, 70, "", {
        stroke: ACCENT,
        strokeWidth: 1,
        dashed: true,
        fill: "transparent",
      }),
      txt("exp-zone-l", 410, 208, "practiced", { fontSize: 11, color: ACCENT }),
      // CI band around the trend: slope claim needs a width, not only a caption.
      line("ci-lo", 170, 160, [[0, 0], [320, 140]], {
        stroke: MUTED,
        dashed: true,
        strokeWidth: 1,
      }),
      line("ci-hi", 170, 130, [[0, 0], [320, 140]], {
        stroke: MUTED,
        dashed: true,
        strokeWidth: 1,
      }),
      txt("ci-band", 500, 148, "±1 SE band", { fontSize: 11, color: MUTED }),
      // Correlation chip.
      rect("r-chip", 500, 110, 100, 28, "r ≈ −0.82", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Significance chip — p < 0.01.
      rect("p-chip", 620, 110, 100, 28, "p < 0.01", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Cohort size chip.
      rect("n48", 620, 420, 100, 28, "n = 48", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Residual count chip.
      rect("res-chip", 620, 460, 120, 28, "1 residual", {
        fill: "#e2e8f0",
        stroke: MUTED,
        labelSize: 12,
      }),
      // Fit R² chip.
      rect("r2-chip", 620, 500, 100, 28, "R²≈0.67", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Slope chip.
      rect("slope-chip", 740, 500, 120, 28, "−2.1 err/h", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Novice zone chip.
      rect("nov-chip", 80, 80, 120, 28, "novice zone", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
    ]);
  },
  radar: () => {
    const cx = 260;
    const cy = 250;
    const vertex = (r, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return [Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))];
    };
    const hexagon = (id, radii, opts) => poly(id, radii.map((r, i) => vertex(r, i)), opts);
    const even = (r) => [r, r, r, r, r, r];
    const now = [112, 94, 60, 100, 52, 80];
    const before = [74, 66, 78, 58, 44, 62];
    const labels = ["Speed", "Quality", "Cost", "Reach", "Depth", "Taste"];
    return doc("Radar — this quarter against last", [
      hexagon("now", now, { stroke: ACCENT, fill: "#fed7aa" }),
      // Rings and spokes go over the fill: Excalidraw fills are opaque, so a
      // grid underneath disappears exactly where the data sits.
      hexagon("ring-outer", even(120), { strokeWidth: 1, stroke: GRID }),
      hexagon("ring-mid", even(80), { strokeWidth: 1, stroke: GRID }),
      hexagon("ring-inner", even(40), { strokeWidth: 1, stroke: GRID }),
      // Target ring: the quarter's bet, not just last vs now.
      hexagon("target", even(100), { strokeWidth: 1, stroke: MUTED, dashed: true }),
      ...[0, 1, 2].map((i) => {
        const [x1, y1] = vertex(120, i);
        const [x2, y2] = vertex(120, i + 3);
        return line(`spoke${i}`, x1, y1, [[0, 0], [x2 - x1, y2 - y1]], { strokeWidth: 1, stroke: GRID });
      }),
      hexagon("before", before, { dashed: true, strokeWidth: 2 }),
      ...labels.map((label, i) => {
        const [x, y] = vertex(148, i);
        // Anchor each label outside its vertex so "Quality"/"Depth" never sit on the ring.
        const ox = i === 0 ? -18 : i === 1 || i === 2 ? 8 : i === 3 ? -18 : -56;
        const oy = i === 0 ? -22 : i === 3 ? 8 : -8;
        return txt(`ax${i}`, x + ox, y + oy, label, { fontSize: 14, color: MUTED });
      }),
      line("key-now", 520, 214, [[0, 0], [28, 0]], { stroke: ACCENT, strokeWidth: 3 }),
      txt("key-now-label", 558, 206, "This quarter", { fontSize: 13, color: INK }),
      line("key-before", 520, 248, [[0, 0], [28, 0]], { dashed: true }),
      txt("key-before-label", 558, 240, "Last quarter", { fontSize: 13, color: MUTED }),
      line("key-tgt", 520, 282, [[0, 0], [28, 0]], { dashed: true, stroke: MUTED }),
      txt("key-tgt-label", 558, 274, "Target ≥ 100", { fontSize: 12, color: MUTED }),
      txt("key-note", 520, 310, "0–120 per axis", { fontSize: 12, color: MUTED }),
      txt("find", 520, 346, "Reach + Taste up; Cost traded down", {
        fontSize: 13,
        color: ACCENT,
      }),
      txt("cost-note", 520, 376, "lower Cost score = cheaper to run", {
        fontSize: 12,
        color: MUTED,
      }),
      txt("taste-note", 520, 400, "Taste is the product differentiator this quarter", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("scores", 520, 424, "now: Sp112 Q94 C60 R100 D52 T80", {
        fontSize: 11,
        color: MUTED,
      }),
      txt("gap", 520, 448, "biggest gap to target: Depth (−48)", {
        fontSize: 12,
        color: ACCENT,
      }),
      txt("bet", 520, 472, "this quarter bet: close Depth gap first", {
        fontSize: 12,
        color: ACCENT,
      }),
      // Depth vertex callout — the gap should sit on the axis it names.
      txt("depth-now", vertex(52, 4)[0] - 36, vertex(52, 4)[1] + 8, "52", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("taste-now", vertex(80, 5)[0] - 10, vertex(80, 5)[1] - 18, "80", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("reach-now", vertex(100, 3)[0] - 10, vertex(100, 3)[1] + 8, "100", {
        fontSize: 11,
        color: ACCENT,
      }),
      txt("speed-now", vertex(112, 0)[0] - 10, vertex(112, 0)[1] - 18, "112", {
        fontSize: 11,
        color: ACCENT,
      }),
      // Depth gap stem from now to target ring — −48 is a distance, not only a caption.
      line(
        "depth-gap",
        vertex(52, 4)[0],
        vertex(52, 4)[1],
        [
          [
            vertex(100, 4)[0] - vertex(52, 4)[0],
            vertex(100, 4)[1] - vertex(52, 4)[1],
          ],
        ],
        { stroke: ACCENT, dashed: true, strokeWidth: 1 }
      ),
      txt("depth-gap-l", vertex(76, 4)[0] + 8, vertex(76, 4)[1] + 4, "−48", {
        fontSize: 11,
        color: ACCENT,
      }),
      // Depth-first bet chip — the quarter's priority is a stamp, not only a caption.
      rect("depth-bet", 520, 496, 140, 28, "Depth first", {
        fill: "#fee2e2",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Taste differentiator chip.
      rect("taste-chip", 680, 496, 120, 28, "Taste ↑", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Cost trade chip.
      rect("cost-trade", 80, 500, 120, 28, "Cost ↓", {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 12,
      }),
      // Reach score chip.
      rect("reach-n", 80, 460, 100, 28, "Reach 100", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 12,
      }),
      // Speed score stamp.
      rect("speed-n", 80, 420, 100, 28, "Speed 112", {
        fill: "#fed7aa",
        stroke: ACCENT,
        labelSize: 12,
      }),
    ]);
  },
};

async function main() {
  const { hydrateSkeleton } = await import(
    join(ROOT, "packages", "renderer-node", "dist", "index.js")
  );

  const types = Object.keys(BUILDERS);
  for (const type of types) {
    const dir = join(OUT, type);
    await mkdir(dir, { recursive: true });
    const skeleton = JSON.stringify(BUILDERS[type]());
    const full = await hydrateSkeleton(skeleton);
    const json = JSON.stringify(stabilize(type, JSON.parse(full)), null, 2) + "\n";
    await writeFile(join(dir, "example.excalidraw"), json);
    console.log(`wrote ${type}/example.excalidraw`);
  }
  console.log(`\n${types.length} hydrated type fixtures generated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
