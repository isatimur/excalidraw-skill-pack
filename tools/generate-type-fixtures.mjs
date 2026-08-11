#!/usr/bin/env node
/**
 * Generate canonical hydrated excalidraw fixtures for each diagram type.
 * Output: packages/shared/fixtures/types/<type>/example.excalidraw
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

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
    strokeWidth: 2,
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

const ID_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
const FIXED_UPDATED = Date.UTC(2026, 0, 1);

function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Hydration mints fresh ids, seeds and a wall-clock `updated` on every run, so
// re-running rewrote all 29 files whether or not any diagram changed. Deriving
// them from the type name keeps the diff to the diagrams that actually moved.
function stabilize(type, document) {
  const rand = mulberry32(fnv1a(type));
  const randInt = () => Math.floor(rand() * 2147483648);
  const ids = new Map();
  const idFor = (id) => {
    if (typeof id !== "string") return id;
    if (!ids.has(id)) {
      ids.set(
        id,
        Array.from({ length: 21 }, () => ID_ALPHABET[Math.floor(rand() * ID_ALPHABET.length)]).join("")
      );
    }
    return ids.get(id);
  };

  for (const el of document.elements) idFor(el.id);

  for (const el of document.elements) {
    el.id = idFor(el.id);
    el.seed = randInt();
    el.versionNonce = randInt();
    el.updated = FIXED_UPDATED;
    if (el.containerId) el.containerId = idFor(el.containerId);
    if (el.frameId) el.frameId = idFor(el.frameId);
    if (Array.isArray(el.groupIds)) el.groupIds = el.groupIds.map(idFor);
    if (Array.isArray(el.boundElements)) {
      el.boundElements = el.boundElements.map((bound) => ({ ...bound, id: idFor(bound.id) }));
    }
    for (const key of ["startBinding", "endBinding"]) {
      if (el[key]?.elementId) el[key] = { ...el[key], elementId: idFor(el[key].elementId) };
    }
  }
  return document;
}

const BUILDERS = {
  architecture: () => {
    // Both dependencies fan out from the API, so they sit on separate rows: a single
    // row would route the queue arrow through Postgres and stack the two edge labels.
    const api = { id: "api", x: 120, y: 176, w: 140, h: 64 };
    const db = { id: "db", x: 440, y: 112, w: 160, h: 64 };
    const queue = { id: "queue", x: 440, y: 248, w: 160, h: 64 };
    return doc("Architecture — components + boundaries", [
      zone("zone", 80, 88, 700, 248, ""),
      txt("zone-label", 96, 96, "VPC", { fontSize: 14, color: MUTED }),
      rect(api.id, api.x, api.y, api.w, api.h, "API"),
      rect(db.id, db.x, db.y, db.w, db.h, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
      rect(queue.id, queue.x, queue.y, queue.w, queue.h, "Queue"),
      arrow("a1", api, db, "read/write"),
      arrow("a2", api, queue, "publish"),
    ]);
  },
  // Shapes are declared before any arrow that binds to them: Excalidraw resolves
  // bindings during conversion, and an arrow that names a later element gets skewed.
  flowchart: () => {
    const start = { id: "start", x: 280, y: 100, w: 120, h: 48 };
    const decide = { id: "decide", x: 260, y: 190, w: 160, h: 80 };
    const yes = { id: "yes", x: 100, y: 330, w: 140, h: 56 };
    const no = { id: "no", x: 440, y: 330, w: 140, h: 56 };
    return doc("Flowchart — branching decisions", [
      ellipse(start.id, start.x, start.y, start.w, start.h, "Trigger"),
      diamond(decide.id, decide.x, decide.y, decide.w, decide.h, "Valid?"),
      rect(yes.id, yes.x, yes.y, yes.w, yes.h, "Process"),
      rect(no.id, no.x, no.y, no.w, no.h, "Reject", { fill: "#fed7aa", stroke: ACCENT }),
      arrow("a0", start, decide, ""),
      arrow("a1", decide, yes, "yes", { from: "left", to: "top" }),
      arrow("a2", decide, no, "no", { from: "right", to: "top" }),
    ]);
  },
  sequence: () => {
    // Lifelines hang from box centres. Message labels sit ABOVE the shaft as
    // free text — bound labels land on the line and, at Cascadia width, collide.
    const cx = { client: 160, api: 400, db: 640 };
    const lifeline = (id, x) => line(id, x, 168, [[0, 0], [0, 260]], { dashed: true });
    return doc("Sequence — messages over time", [
      rect("client", cx.client - 60, 110, 120, 48, "Client"),
      rect("api", cx.api - 60, 110, 120, 48, "API"),
      rect("db", cx.db - 60, 110, 120, 48, "DB"),
      lifeline("ll1", cx.client),
      lifeline("ll2", cx.api),
      lifeline("ll3", cx.db),
      path("m1", cx.client, 200, [[0, 0], [cx.api - cx.client - 8, 0]], ""),
      txt("m1-l", cx.client + 48, 178, "POST /orders", { fontSize: 14, color: MUTED }),
      path("m2", cx.api, 255, [[0, 0], [cx.db - cx.api - 8, 0]], ""),
      txt("m2-l", cx.api + 72, 233, "INSERT", { fontSize: 14, color: MUTED }),
      path("m3", cx.db, 310, [[0, 0], [cx.api - cx.db + 8, 0]], "", { dashed: true, stroke: MUTED }),
      txt("m3-l", cx.api + 80, 288, "1 row", { fontSize: 14, color: MUTED }),
      path("m4", cx.api, 365, [[0, 0], [cx.client - cx.api + 8, 0]], "", { dashed: true, stroke: MUTED }),
      txt("m4-l", cx.client + 48, 343, "201 Created", { fontSize: 14, color: MUTED }),
    ]);
  },
  state: () => {
    const draft = { id: "draft", x: 100, y: 140, w: 130, h: 56 };
    const review = { id: "review", x: 350, y: 140, w: 130, h: 56 };
    const live = { id: "live", x: 600, y: 140, w: 130, h: 56 };
    return doc("State machine — allowed transitions", [
      rect(draft.id, draft.x, draft.y, draft.w, draft.h, "Draft"),
      rect(review.id, review.x, review.y, review.w, review.h, "Review"),
      rect(live.id, live.x, live.y, live.w, live.h, "Live", { fill: "#dcfce7", stroke: "#15803d" }),
      arrow("t1", draft, review, "submit"),
      arrow("t2", review, live, "approve"),
      // The rejection path is what makes this a machine rather than a pipeline.
      path("t3", 415, 196, [[0, 0], [0, 80], [-250, 80], [-250, 0]], "reject", { stroke: ACCENT }),
    ]);
  },
  er: () => {
    const user = { id: "user", x: 80, y: 140, w: 150, h: 72 };
    const order = { id: "order", x: 370, y: 140, w: 150, h: 72 };
    const item = { id: "item", x: 660, y: 140, w: 150, h: 72 };
    return doc("ER — entities + cardinality", [
      rect(user.id, user.x, user.y, user.w, user.h, "User\nid, email"),
      rect(order.id, order.x, order.y, order.w, order.h, "Order\nid, total"),
      rect(item.id, item.x, item.y, item.w, item.h, "LineItem\nsku, qty"),
      arrow("r1", user, order, "1:N", { labelSize: 14 }),
      arrow("r2", order, item, "1:N", { labelSize: 14 }),
    ]);
  },
  timeline: () => {
    return doc("Timeline — events on an axis", [
      line("axis", 120, 250, [[0, 0], [520, 0]], { stroke: INK }),
      dot("d1", 220, 250, 6),
      dot("d2", 380, 250, 6),
      dot("d3", 540, 250, 6, { fill: ACCENT, stroke: ACCENT }),
      txt("e1", 196, 210, "MVP", { fontSize: 15 }),
      txt("e2", 344, 210, "Themes", { fontSize: 15 }),
      txt("e3", 506, 210, "MCP app", { fontSize: 15, color: ACCENT }),
      txt("t0", 112, 266, "2024", { fontSize: 13, color: MUTED }),
      txt("t1", 616, 266, "2026", { fontSize: 13, color: MUTED }),
    ]);
  },
  gantt: () => {
    const week = (id, x, label) => [
      line(id, x, 140, [[0, 0], [0, 180]], { dashed: true, strokeWidth: 1 }),
      txt(`${id}-l`, x - 12, 118, label, { fontSize: 13, color: MUTED }),
    ];
    return doc("Gantt — phases on a timeline", [
      ...week("w1", 200, "W1"),
      ...week("w3", 340, "W3"),
      ...week("w5", 480, "W5"),
      ...week("w7", 620, "W7"),
      rect("p1", 140, 160, 200, 34, "Design"),
      rect("p2", 270, 220, 250, 34, "Build", { fill: "#fef3c7" }),
      rect("p3", 450, 280, 190, 34, "Ship", { fill: "#dcfce7", stroke: "#15803d" }),
      // Without a now-line a Gantt only says what the plan is, never whether it holds.
      line("today", 400, 132, [[0, 0], [0, 196]], { stroke: ACCENT, strokeWidth: 2 }),
      txt("today-l", 372, 112, "today", { fontSize: 13, color: ACCENT }),
      txt("slip", 548, 228, "Build runs past\nthe Ship start", { fontSize: 13, color: MUTED }),
    ]);
  },
  swimlane: () => {
    // Orthogonal elbows only — a diagonal handoff through empty lane space
    // reads as a routing bug, not a cross-functional story.
    const spec = { id: "spec", x: 220, y: 140, w: 130, h: 48 };
    const impl = { id: "impl", x: 420, y: 270, w: 140, h: 48 };
    const signoff = { id: "signoff", x: 650, y: 140, w: 140, h: 48 };
    return doc("Swimlane — cross-functional handoffs", [
      zone("lane1", 180, 110, 660, 100, ""),
      zone("lane2", 180, 240, 660, 100, ""),
      txt("lane1-l", 60, 150, "Product", { fontSize: 14, color: MUTED }),
      txt("lane2-l", 48, 280, "Engineering", { fontSize: 14, color: MUTED }),
      rect(spec.id, spec.x, spec.y, spec.w, spec.h, "Spec"),
      rect(impl.id, impl.x, impl.y, impl.w, impl.h, "Implement"),
      rect(signoff.id, signoff.x, signoff.y, signoff.w, signoff.h, "Sign-off", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
      elbow(
        "h1",
        [
          [spec.x + spec.w / 2, spec.y + spec.h],
          [spec.x + spec.w / 2, impl.y + impl.h / 2],
          [impl.x - 8, impl.y + impl.h / 2],
        ],
        {}
      ),
      txt("h1-l", spec.x + spec.w / 2 + 12, 220, "handoff", { fontSize: 13, color: MUTED }),
      elbow(
        "h2",
        [
          [impl.x + impl.w + 8, impl.y + impl.h / 2],
          [signoff.x + signoff.w / 2, impl.y + impl.h / 2],
          [signoff.x + signoff.w / 2, signoff.y + signoff.h + 8],
        ],
        {}
      ),
      txt("h2-l", signoff.x - 40, 252, "review", { fontSize: 13, color: MUTED }),
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
      dot("p1", 258, 186, 7),
      txt("p1-l", 274, 176, "Themes", { fontSize: 15 }),
      dot("p2", 470, 158, 7, { fill: ACCENT, stroke: ACCENT }),
      txt("p2-l", 486, 148, "MCP app", { fontSize: 15, color: ACCENT }),
      dot("p3", 244, 320, 7),
      txt("p3-l", 260, 310, "Docs polish", { fontSize: 15 }),
      // The empty quadrant is the one worth filling: naming what to drop is the
      // decision a positioning chart exists to force.
      dot("p4", 470, 330, 7, { fill: MUTED, stroke: MUTED }),
      txt("p4-l", 486, 320, "Slide export", { fontSize: 15, color: MUTED }),
    ]);
  },
  // Stations on a rectangle so every edge is pure H or V — a diamond with
  // corner-to-corner diagonals is a flywheel drawn as a star, not a loop.
  loop: () => {
    const capture = { id: "capture", x: 200, y: 110, w: 140, h: 48 };
    const synth = { id: "synth", x: 520, y: 110, w: 152, h: 48 };
    const publish = { id: "publish", x: 520, y: 310, w: 152, h: 48 };
    const review = { id: "review", x: 200, y: 310, w: 140, h: 48 };
    const hub = { id: "hub", x: 366, y: 206, w: 140, h: 56 };
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
    ]);
  },
  process: () => {
    const s1 = { id: "s1", x: 80, y: 180, w: 150, h: 56 };
    const s2 = { id: "s2", x: 310, y: 180, w: 150, h: 56 };
    const s3 = { id: "s3", x: 540, y: 180, w: 150, h: 56 };
    return doc("Process — multi-step workflow", [
      rect(s1.id, s1.x, s1.y, s1.w, s1.h, "Ingest"),
      rect(s2.id, s2.x, s2.y, s2.w, s2.h, "Transform", { fill: "#fef3c7", stroke: ACCENT }),
      rect(s3.id, s3.x, s3.y, s3.w, s3.h, "Deliver"),
      arrow("p1", s1, s2, ""),
      arrow("p2", s2, s3, ""),
      txt("p1-l", 248, 156, "clean", { fontSize: 13, color: MUTED }),
      txt("p2-l", 478, 156, "ship", { fontSize: 13, color: MUTED }),
      txt("role", 80, 140, "Role: data engineer", { fontSize: 13, color: MUTED }),
    ]);
  },
  // Equal widths, because tapering them says "pyramid". The one-way arrow is the
  // claim a layer diagram exists to make: dependencies point down, never up.
  layers: () => {
    return doc("Layers — stacked abstractions", [
      rect("l3", 140, 130, 460, 60, "Presentation"),
      rect("l2", 140, 206, 460, 60, "Domain", { fill: "#fef3c7", stroke: ACCENT }),
      rect("l1", 140, 282, 460, 60, "Infrastructure"),
      path("dep", 648, 136, [[0, 0], [0, 200]], "", { stroke: MUTED }),
      txt("dep-l", 668, 200, "depends on", { fontSize: 14, color: MUTED }),
      txt("rule", 140, 358, "no upward calls: Infrastructure never imports Domain", {
        fontSize: 13,
        color: MUTED,
      }),
    ]);
  },
  // Boundary labels sit at the top-left edge: a centred container label lands on
  // whatever the boundary contains.
  nested: () => {
    return doc("Nested — hierarchy by containment", [
      zone("outer", 100, 110, 600, 216, ""),
      txt("outer-l", 116, 120, "Platform", { fontSize: 14, color: MUTED }),
      zone("inner", 140, 158, 300, 140, ""),
      txt("inner-l", 156, 168, "Service A", { fontSize: 14, color: MUTED }),
      rect("api", 172, 196, 236, 44, "API"),
      rect("cache", 172, 250, 236, 36, "Cache", { fill: "#fef3c7", stroke: ACCENT, labelSize: 15 }),
      rect("gateway", 484, 196, 176, 44, "Gateway"),
    ]);
  },
  medallion: () => {
    const bronze = { id: "bronze", x: 100, y: 180, w: 150, h: 68 };
    const silver = { id: "silver", x: 420, y: 180, w: 150, h: 68 };
    const gold = { id: "gold", x: 740, y: 180, w: 150, h: 68 };
    return doc("Medallion — bronze / silver / gold tiers", [
      rect(bronze.id, bronze.x, bronze.y, bronze.w, bronze.h, "Bronze\nraw"),
      rect(silver.id, silver.x, silver.y, silver.w, silver.h, "Silver\nconformed", { fill: "#e2e8f0" }),
      rect(gold.id, gold.x, gold.y, gold.w, gold.h, "Gold\nmart", { fill: "#fef3c7", stroke: ACCENT }),
      arrow("m1", bronze, silver, "clean"),
      arrow("m2", silver, gold, "aggregate"),
    ]);
  },
  tree: () => {
    const root = { id: "root", x: 314, y: 100, w: 132, h: 48 };
    const left = { id: "left", x: 144, y: 210, w: 132, h: 48 };
    const right = { id: "right", x: 484, y: 210, w: 132, h: 48 };
    return doc("Tree — parent → children", [
      rect(root.id, root.x, root.y, root.w, root.h, "Root"),
      rect(left.id, left.x, left.y, left.w, left.h, "Branch A"),
      rect(right.id, right.x, right.y, right.w, right.h, "Branch B"),
      arrow("t1", root, left, "", { from: "bottom", to: "top" }),
      arrow("t2", root, right, "", { from: "bottom", to: "top" }),
    ]);
  },
  // Solid lines are the reporting tree; the dashed one is the routing the title
  // promises — who Product actually asks, which the tree alone never shows.
  "org-chart": () => {
    const ceo = { id: "ceo", x: 306, y: 100, w: 120, h: 48 };
    const eng = { id: "eng", x: 140, y: 210, w: 156, h: 48 };
    const prod = { id: "prod", x: 436, y: 210, w: 156, h: 48 };
    const platform = { id: "platform", x: 140, y: 320, w: 156, h: 48 };
    return doc("Org chart — ownership + routing", [
      rect(ceo.id, ceo.x, ceo.y, ceo.w, ceo.h, "CEO"),
      rect(eng.id, eng.x, eng.y, eng.w, eng.h, "Engineering"),
      rect(prod.id, prod.x, prod.y, prod.w, prod.h, "Product"),
      rect(platform.id, platform.x, platform.y, platform.w, platform.h, "Platform", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      arrow("o1", ceo, eng, "", { from: "bottom", to: "top" }),
      arrow("o2", ceo, prod, "", { from: "bottom", to: "top" }),
      arrow("o3", eng, platform, "", { from: "bottom", to: "top" }),
      path("route", 514, 262, [[0, 0], [0, 82], [-198, 82]], "", { dashed: true, stroke: MUTED }),
      txt("route-l", 336, 356, "asks for capacity", { fontSize: 13, color: MUTED }),
    ]);
  },
  venn: () => {
    return doc("Venn — set overlap", [
      ellipse("a", 180, 130, 200, 200, ""),
      ellipse("b", 320, 130, 200, 200, ""),
      txt("a-l", 212, 220, "Speed", { fontSize: 16 }),
      txt("b-l", 430, 220, "Quality", { fontSize: 16 }),
      // The overlap is too narrow to hold its own label, so the label sits below it.
      line("leader", 350, 332, [[0, 0], [0, 26]], { stroke: ACCENT, strokeWidth: 1 }),
      txt("overlap", 300, 364, "ship it twice", { fontSize: 14, color: ACCENT }),
    ]);
  },
  // Tiers are trapezoids, not stacked bars: the widening is what says the base
  // carries everything above it.
  pyramid: () => {
    const apex = 400;
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
      txt("t3-l", 360, 158, "Strategy", { fontSize: 16, color: ACCENT }),
      txt("t2-l", 340, 222, "Capabilities", { fontSize: 16 }),
      txt("t1-l", 330, 306, "Infrastructure", { fontSize: 16 }),
    ]);
  },
  evidence: () => {
    const claim = { id: "claim", x: 80, y: 160, w: 220, h: 80 };
    const proof = { id: "proof", x: 480, y: 148, w: 280, h: 104 };
    return doc("Evidence — proof artifact beside claim", [
      rect(claim.id, claim.x, claim.y, claim.w, claim.h, "Claim:\nP99 < 200ms"),
      rect(proof.id, proof.x, proof.y, proof.w, proof.h, '{\n  "metric": "p99",\n  "value": 142\n}', {
        fill: PAPER,
        stroke: MUTED,
        labelSize: 15,
      }),
      txt("proof-src", proof.x, proof.y - 24, "load test · 2026-02-14", { fontSize: 13, color: MUTED }),
      arrow("e1", proof, claim, ""),
      txt("e1-l", 360, 168, "proves", { fontSize: 14, color: MUTED }),
    ]);
  },
  // One column per option, one row per question asked of both — a contrast only
  // reads as an argument when the same question is put to each side.
  comparison: () => {
    const rows = [
      { id: "edit", ask: "Edit a box", before: "re-run the exporter", after: "drag it in Excalidraw" },
      { id: "review", ask: "Review a change", before: "eyeball two PNGs", after: "diff the source" },
      { id: "rebrand", ask: "Re-theme", before: "recolour by hand", after: "pass --theme dark" },
    ];
    const cellW = 250;
    return doc("Comparison — before / after contrast", [
      txt("h-before", 250, 118, "Static export", { fontSize: 16, color: MUTED }),
      txt("h-after", 540, 118, "Editable source", { fontSize: 16, color: "#15803d" }),
      line("h-rule", 100, 146, [[0, 0], [700, 0]], { strokeWidth: 1, stroke: GRID }),
      ...rows.flatMap((row, i) => {
        const y = 166 + i * 74;
        return [
          txt(`${row.id}-ask`, 100, y + 16, row.ask, { fontSize: 14, color: MUTED }),
          rect(`${row.id}-b`, 250, y, cellW, 52, row.before, { labelSize: 15, fill: "#f1f5f9" }),
          rect(`${row.id}-a`, 530, y, cellW, 52, row.after, {
            labelSize: 15,
            fill: "#dcfce7",
            stroke: "#15803d",
          }),
        ];
      }),
    ]);
  },
  // The boundary earns its keep by leaving something out: browser and CDN sit
  // outside the cluster, which is the whole reason to draw the cluster.
  "high-level": () => {
    const browser = { id: "browser", x: 60, y: 208, w: 132, h: 48 };
    const cdn = { id: "cdn", x: 240, y: 208, w: 132, h: 48 };
    const app = { id: "app", x: 460, y: 208, w: 132, h: 48 };
    const db = { id: "db", x: 660, y: 160, w: 132, h: 48 };
    const cache = { id: "cache", x: 660, y: 262, w: 132, h: 48 };
    return doc("High-level — end-to-end on one cluster", [
      zone("cluster", 420, 120, 412, 232, ""),
      txt("cluster-l", 436, 130, "Production cluster", { fontSize: 14, color: MUTED }),
      rect(browser.id, browser.x, browser.y, browser.w, browser.h, "Browser", { fill: PAPER, stroke: MUTED }),
      rect(cdn.id, cdn.x, cdn.y, cdn.w, cdn.h, "CDN", { fill: PAPER, stroke: MUTED }),
      rect(app.id, app.x, app.y, app.w, app.h, "App"),
      rect(db.id, db.x, db.y, db.w, db.h, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
      rect(cache.id, cache.x, cache.y, cache.w, cache.h, "Redis"),
      arrow("hl1", browser, cdn, ""),
      arrow("hl2", cdn, app, ""),
      arrow("hl3", app, db, ""),
      arrow("hl4", app, cache, ""),
    ]);
  },
  "it-state": () => {
    const mainframe = { id: "mainframe", x: 80, y: 130, w: 150, h: 64 };
    const as400 = { id: "as400", x: 80, y: 240, w: 150, h: 64 };
    const esb = { id: "esb", x: 440, y: 185, w: 150, h: 64 };
    const saas = { id: "saas", x: 780, y: 185, w: 150, h: 64 };
    return doc("IT current-state — legacy landscape", [
      rect(mainframe.id, mainframe.x, mainframe.y, mainframe.w, mainframe.h, "Mainframe"),
      rect(as400.id, as400.x, as400.y, as400.w, as400.h, "AS/400"),
      // Everything funnels through one bus: that is the finding, so it carries the accent.
      rect(esb.id, esb.x, esb.y, esb.w, esb.h, "ESB", { fill: "#fed7aa", stroke: ACCENT }),
      rect(saas.id, saas.x, saas.y, saas.w, saas.h, "SaaS", { fill: "#dcfce7", stroke: "#15803d" }),
      arrow("i1", mainframe, esb, "nightly batch"),
      arrow("i2", as400, esb, "flat file"),
      arrow("i3", esb, saas, "REST"),
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
      arrow("df2", stream, warehouse, "masked"),
      arrow("df3", warehouse, dash, ""),
    ]);
  },
  "dp-integration": () => {
    const sources = [
      { id: "s-db", x: 80, y: 120, w: 156, h: 44, label: "Postgres" },
      { id: "s-events", x: 80, y: 186, w: 156, h: 44, label: "Clickstream" },
      { id: "s-files", x: 80, y: 252, w: 156, h: 44, label: "SFTP drop" },
    ];
    const core = { id: "core", x: 330, y: 152, w: 170, h: 112 };
    const consumers = [
      { id: "c-bi", x: 594, y: 142, w: 156, h: 44, label: "Dashboards" },
      { id: "c-ml", x: 594, y: 230, w: 156, h: 44, label: "ML features" },
    ];
    return doc("DP integration — sources → core → consumers", [
      ...sources.map((s) => rect(s.id, s.x, s.y, s.w, s.h, s.label)),
      rect(core.id, core.x, core.y, core.w, core.h, "Lakehouse", { fill: "#fef3c7", stroke: ACCENT }),
      ...consumers.map((c) => rect(c.id, c.x, c.y, c.w, c.h, c.label)),
      ...sources.map((s, i) => arrow(`in${i}`, s, core, "")),
      ...consumers.map((c, i) => arrow(`out${i}`, core, c, "")),
    ]);
  },
  "dp-security-matrix": () => {
    const cell = (id, x, y, label, write) =>
      rect(id, x, y, 130, 44, label, write ? { fill: "#fed7aa", stroke: ACCENT } : { fill: PAPER, stroke: MUTED });
    return doc("DP security matrix — role × resource", [
      txt("h1", 300, 128, "Dataset A", { fontSize: 14, color: MUTED }),
      txt("h2", 470, 128, "Dataset B", { fontSize: 14, color: MUTED }),
      line("h-rule", 100, 152, [[0, 0], [500, 0]], { strokeWidth: 1 }),
      line("v-rule", 280, 152, [[0, 0], [0, 168]], { strokeWidth: 1 }),
      txt("r1", 110, 180, "Analyst", { fontSize: 15 }),
      txt("r2", 110, 238, "Engineer", { fontSize: 15 }),
      txt("r3", 110, 296, "Admin", { fontSize: 15 }),
      cell("c11", 300, 166, "read", false),
      cell("c12", 450, 166, "read", false),
      cell("c21", 300, 224, "write", true),
      cell("c22", 450, 224, "read", false),
      cell("c31", 300, 282, "write", true),
      cell("c32", 450, 282, "write", true),
    ]);
  },
  bar: () => {
    // A bar without a scale only shows which is taller. Ticks make it a number.
    const baseline = 320;
    const perUnit = 1.6;
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
    const tick = (id, value) => [
      line(id, 140, baseline - value * perUnit, [[0, 0], [440, 0]], { strokeWidth: 1, stroke: GRID }),
      txt(`${id}-l`, 96, baseline - value * perUnit - 8, `${value}`, { fontSize: 13, color: MUTED }),
    ];
    return doc("Bar chart — categorical comparison", [
      ...tick("t50", 50),
      ...tick("t100", 100),
      line("y-axis", 140, 130, [[0, 0], [0, 190]], { stroke: INK }),
      line("x-axis", 140, baseline, [[0, 0], [440, 0]], { stroke: INK }),
      txt("y-unit", 96, 108, "signups (k)", { fontSize: 13, color: MUTED }),
      ...bar("b1", 180, 44, "Q1"),
      ...bar("b2", 280, 65, "Q2"),
      ...bar("b3", 380, 55, "Q3"),
      ...bar("b4", 480, 101, "Q4", true),
      txt("callout", 466, 100, "record quarter", { fontSize: 14, color: ACCENT }),
    ]);
  },
  line: () => {
    const baseline = 320;
    const perMs = 0.4;
    const y = (ms) => baseline - ms * perMs;
    const readings = [400, 345, 315, 215, 168, 142];
    const at = (i) => [160 + i * 92, y(readings[i])];
    const tick = (id, ms) => [
      line(id, 140, y(ms), [[0, 0], [480, 0]], { strokeWidth: 1, stroke: GRID }),
      txt(`${id}-l`, 74, y(ms) - 8, `${ms}ms`, { fontSize: 13, color: MUTED }),
    ];
    return doc("Line chart — trend over time", [
      ...tick("t200", 200),
      ...tick("t400", 400),
      line("y-axis", 140, 140, [[0, 0], [0, 180]], { stroke: INK }),
      line("x-axis", 140, baseline, [[0, 0], [480, 0]], { stroke: INK }),
      txt("y-unit", 74, 116, "p99 latency", { fontSize: 13, color: MUTED }),
      txt("x0", 146, baseline + 12, "2024", { fontSize: 13, color: MUTED }),
      txt("x1", 570, baseline + 12, "2026", { fontSize: 13, color: MUTED }),
      poly("series", readings.map((_, i) => at(i)), { stroke: ACCENT, open: true }),
      ...readings.map((_, i) => {
        const [px, py] = at(i);
        return dot(`s${i}`, px, py, 5, { fill: ACCENT, stroke: ACCENT });
      }),
      txt("callout", 634, y(142) - 10, "142ms", { fontSize: 15, color: ACCENT }),
    ]);
  },
  scatter: () => {
    const points = [
      [180, 290],
      [220, 262],
      [252, 276],
      [286, 240],
      [318, 250],
      [352, 214],
      [390, 226],
      [424, 190],
      [462, 178],
      [500, 158],
    ];
    return doc("Scatter — distribution + correlation", [
      line("y-axis", 140, 130, [[0, 0], [0, 190]], { stroke: INK }),
      line("x-axis", 140, 320, [[0, 0], [440, 0]], { stroke: INK }),
      txt("y-label", 78, 122, "errors", { fontSize: 13, color: MUTED }),
      txt("x-label", 420, 332, "hours of practice", { fontSize: 13, color: MUTED }),
      line("trend", 170, 300, [[0, 0], [350, -155]], { stroke: ACCENT, dashed: true }),
      ...points.map(([x, y], i) => dot(`p${i}`, x, y, 6)),
    ]);
  },
  radar: () => {
    const cx = 260;
    const cy = 250;
    const vertex = (r, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 2;
      return [Math.round(cx + r * Math.cos(angle)), Math.round(cy + r * Math.sin(angle))];
    };
    const ring = (r) => {
      const pts = [0, 1, 2, 3, 4, 5].map((i) => vertex(r, i));
      const [ox, oy] = pts[0];
      return { origin: [ox, oy], points: [...pts, pts[0]].map(([x, y]) => [x - ox, y - oy]) };
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
      ...[0, 1, 2].map((i) => {
        const [x1, y1] = vertex(120, i);
        const [x2, y2] = vertex(120, i + 3);
        return line(`spoke${i}`, x1, y1, [[0, 0], [x2 - x1, y2 - y1]], { strokeWidth: 1, stroke: GRID });
      }),
      hexagon("before", before, { dashed: true, strokeWidth: 2 }),
      ...labels.map((label, i) => {
        const [x, y] = vertex(152, i);
        return txt(`ax${i}`, x - label.length * 4, y - 8, label, { fontSize: 13, color: MUTED });
      }),
      line("key-now", 520, 214, [[0, 0], [28, 0]], { stroke: ACCENT, strokeWidth: 3 }),
      txt("key-now-label", 558, 206, "This quarter", { fontSize: 13, color: INK }),
      line("key-before", 520, 248, [[0, 0], [28, 0]], { dashed: true }),
      txt("key-before-label", 558, 240, "Last quarter", { fontSize: 13, color: MUTED }),
      txt("key-note", 520, 280, "0–120 per axis", { fontSize: 12, color: MUTED }),
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
