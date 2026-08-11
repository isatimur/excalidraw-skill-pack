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

function dot(id, cx, cy, r, opts = {}) {
  return ellipse(id, cx - r, cy - r, r * 2, r * 2, "", {
    fill: opts.fill ?? INK,
    stroke: opts.stroke ?? INK,
  });
}

// Free-standing arrow for edges that connect coordinates rather than shapes
// (sequence messages, elbow returns), where shape binding would re-route them.
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
    const lifeline = (id, x) => line(id, x, 158, [[0, 0], [0, 250]], { dashed: true });
    return doc("Sequence — messages over time", [
      rect("client", 100, 110, 120, 48, "Client"),
      rect("api", 320, 110, 120, 48, "API"),
      rect("db", 540, 110, 120, 48, "DB"),
      lifeline("ll1", 160),
      lifeline("ll2", 380),
      lifeline("ll3", 600),
      path("m1", 160, 200, [[0, 0], [220, 0]], "POST /orders"),
      path("m2", 380, 250, [[0, 0], [220, 0]], "INSERT"),
      path("m3", 600, 300, [[0, 0], [-220, 0]], "1 row", { dashed: true, stroke: MUTED }),
      path("m4", 380, 350, [[0, 0], [-220, 0]], "201 Created", { dashed: true, stroke: MUTED }),
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
    const user = { id: "user", x: 80, y: 140, w: 140, h: 72 };
    const order = { id: "order", x: 320, y: 140, w: 140, h: 72 };
    const item = { id: "item", x: 560, y: 140, w: 140, h: 72 };
    return doc("ER — entities + cardinality", [
      rect(user.id, user.x, user.y, user.w, user.h, "User\nid, email"),
      rect(order.id, order.x, order.y, order.w, order.h, "Order\nid, total"),
      rect(item.id, item.x, item.y, item.w, item.h, "LineItem\nsku, qty"),
      arrow("r1", user, order, "1:N"),
      arrow("r2", order, item, "1:N"),
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
    ]);
  },
  swimlane: () => {
    const spec = { id: "spec", x: 200, y: 130, w: 120, h: 44 };
    const impl = { id: "impl", x: 420, y: 250, w: 120, h: 44 };
    const signoff = { id: "signoff", x: 620, y: 130, w: 120, h: 44 };
    return doc("Swimlane — cross-functional handoffs", [
      zone("lane1", 160, 110, 620, 90, ""),
      zone("lane2", 160, 230, 620, 90, ""),
      txt("lane1-l", 62, 148, "Product", { fontSize: 14, color: MUTED }),
      txt("lane2-l", 62, 268, "Engineering", { fontSize: 14, color: MUTED }),
      rect(spec.id, spec.x, spec.y, spec.w, spec.h, "Spec"),
      rect(impl.id, impl.x, impl.y, impl.w, impl.h, "Implement"),
      rect(signoff.id, signoff.x, signoff.y, signoff.w, signoff.h, "Sign-off", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
      arrow("h1", spec, impl, "handoff", { from: "bottom", to: "left" }),
      arrow("h2", impl, signoff, "review", { from: "right", to: "bottom" }),
    ]);
  },
  quadrant: () => {
    return doc("Quadrant — two-axis positioning", [
      line("y-axis", 380, 120, [[0, 0], [0, 280]], { stroke: INK }),
      line("x-axis", 140, 260, [[0, 0], [480, 0]], { stroke: INK }),
      txt("y-label", 344, 96, "Impact", { fontSize: 14, color: MUTED }),
      txt("x-label", 634, 252, "Effort", { fontSize: 14, color: MUTED }),
      txt("q-tl", 152, 132, "do now", { fontSize: 12, color: MUTED }),
      txt("q-tr", 540, 132, "plan for", { fontSize: 12, color: MUTED }),
      txt("q-bl", 152, 374, "fill-in", { fontSize: 12, color: MUTED }),
      txt("q-br", 540, 374, "drop", { fontSize: 12, color: MUTED }),
      dot("p1", 260, 190, 7),
      txt("p1-l", 276, 180, "Themes", { fontSize: 14 }),
      dot("p2", 470, 160, 7, { fill: ACCENT, stroke: ACCENT }),
      txt("p2-l", 486, 150, "MCP app", { fontSize: 14, color: ACCENT }),
      dot("p3", 300, 320, 7),
      txt("p3-l", 316, 310, "Docs polish", { fontSize: 14 }),
    ]);
  },
  // A flywheel has to close: the fourth arrow returning to Capture is the whole point.
  loop: () => {
    const capture = { id: "capture", x: 320, y: 100, w: 130, h: 48 };
    const synth = { id: "synth", x: 549, y: 196, w: 152, h: 48 };
    const publish = { id: "publish", x: 320, y: 300, w: 130, h: 48 };
    const review = { id: "review", x: 80, y: 196, w: 130, h: 48 };
    const hub = { id: "hub", x: 320, y: 196, w: 130, h: 56 };
    return doc("Loop — flywheel around a hub", [
      rect(capture.id, capture.x, capture.y, capture.w, capture.h, "Capture"),
      rect(synth.id, synth.x, synth.y, synth.w, synth.h, "Synthesize"),
      rect(publish.id, publish.x, publish.y, publish.w, publish.h, "Publish"),
      rect(review.id, review.x, review.y, review.w, review.h, "Review"),
      rect(hub.id, hub.x, hub.y, hub.w, hub.h, "Memory", { fill: "#fef3c7", stroke: ACCENT }),
      arrow("l1", capture, synth, ""),
      arrow("l2", synth, publish, ""),
      arrow("l3", publish, review, ""),
      arrow("l4", review, capture, ""),
    ]);
  },
  process: () => {
    const s1 = { id: "s1", x: 80, y: 160, w: 132, h: 48 };
    const s2 = { id: "s2", x: 272, y: 160, w: 132, h: 48 };
    const s3 = { id: "s3", x: 464, y: 160, w: 132, h: 48 };
    return doc("Process — multi-step workflow", [
      rect(s1.id, s1.x, s1.y, s1.w, s1.h, "Ingest"),
      rect(s2.id, s2.x, s2.y, s2.w, s2.h, "Transform"),
      rect(s3.id, s3.x, s3.y, s3.w, s3.h, "Deliver"),
      arrow("p1", s1, s2, ""),
      arrow("p2", s2, s3, ""),
    ]);
  },
  layers: () => {
    return doc("Layers — stacked abstractions", [
      rect("l3", 120, 120, 480, 56, "Presentation"),
      rect("l2", 140, 200, 440, 56, "Domain", { fill: "#fef3c7" }),
      rect("l1", 160, 280, 400, 56, "Infrastructure"),
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
  "org-chart": () => {
    const ceo = { id: "ceo", x: 306, y: 100, w: 120, h: 48 };
    const eng = { id: "eng", x: 140, y: 210, w: 156, h: 48 };
    const prod = { id: "prod", x: 436, y: 210, w: 156, h: 48 };
    return doc("Org chart — ownership + routing", [
      rect(ceo.id, ceo.x, ceo.y, ceo.w, ceo.h, "CEO"),
      rect(eng.id, eng.x, eng.y, eng.w, eng.h, "Engineering"),
      rect(prod.id, prod.x, prod.y, prod.w, prod.h, "Product"),
      arrow("o1", ceo, eng, "", { from: "bottom", to: "top" }),
      arrow("o2", ceo, prod, "", { from: "bottom", to: "top" }),
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
  pyramid: () => {
    return doc("Pyramid — ranked hierarchy", [
      rect("top", 300, 120, 120, 48, "Strategy", { fill: "#fef3c7", stroke: ACCENT }),
      rect("mid", 260, 200, 200, 48, "Capabilities"),
      rect("base", 200, 280, 320, 48, "Infrastructure"),
    ]);
  },
  evidence: () => {
    return doc("Evidence — proof artifact beside claim", [
      rect("claim", 80, 140, 200, 72, "Claim:\nP99 < 200ms"),
      rect("proof", 360, 130, 280, 92, '{\n  "metric": "p99",\n  "value": 142\n}', { fill: PAPER, stroke: MUTED }),
      arrow("e1", { id: "proof", x: 360, y: 130, w: 280, h: 92 }, { id: "claim", x: 80, y: 140, w: 200, h: 72 }, "proves"),
    ]);
  },
  comparison: () => {
    return doc("Comparison — before / after contrast", [
      txt("before", 100, 120, "Before: static export", { fontSize: 16, color: MUTED }),
      txt("after", 400, 120, "After: editable loop", { fontSize: 16, color: ACCENT }),
      rect("b1", 80, 160, 240, 120, "HTML snapshot"),
      rect("a1", 380, 160, 240, 120, ".excalidraw + PNG", { fill: "#dcfce7", stroke: "#15803d" }),
    ]);
  },
  "high-level": () => {
    return doc("High-level — end-to-end on one cluster", [
      zone("cluster", 80, 100, 560, 220, "Production cluster"),
      rect("edge", 120, 140, 100, 48, "CDN"),
      rect("app", 280, 140, 100, 48, "App"),
      rect("data", 440, 140, 100, 48, "DB"),
      arrow("h1", { id: "edge", x: 120, y: 140, w: 100, h: 48 }, { id: "app", x: 280, y: 140, w: 100, h: 48 }, ""),
      arrow("h2", { id: "app", x: 280, y: 140, w: 100, h: 48 }, { id: "data", x: 440, y: 140, w: 100, h: 48 }, ""),
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
  "data-flow": () => {
    return doc("Data flow — role-scoped pipeline", [
      rect("ingest", 80, 160, 100, 48, "Ingest"),
      rect("stream", 240, 160, 100, 48, "Stream"),
      rect("serve", 400, 160, 100, 48, "Serve"),
      txt("role", 80, 120, "Role: analytics engineer", { fontSize: 13, color: MUTED }),
      arrow("d1", { id: "ingest", x: 80, y: 160, w: 100, h: 48 }, { id: "stream", x: 240, y: 160, w: 100, h: 48 }, ""),
      arrow("d2", { id: "stream", x: 240, y: 160, w: 100, h: 48 }, { id: "serve", x: 400, y: 160, w: 100, h: 48 }, ""),
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
    const bar = (id, x, top, label, accent) => [
      rect(id, x, top, 60, 320 - top, "", accent ? { fill: ACCENT, stroke: ACCENT } : { fill: FILL }),
      txt(`${id}-l`, x + 16, 332, label, { fontSize: 14, color: MUTED }),
    ];
    return doc("Bar chart — categorical comparison", [
      line("y-axis", 140, 130, [[0, 0], [0, 190]], { stroke: INK }),
      line("x-axis", 140, 320, [[0, 0], [440, 0]], { stroke: INK }),
      ...bar("b1", 180, 250, "Q1"),
      ...bar("b2", 280, 216, "Q2"),
      ...bar("b3", 380, 232, "Q3"),
      ...bar("b4", 480, 158, "Q4", true),
      txt("callout", 466, 128, "record quarter", { fontSize: 14, color: ACCENT }),
    ]);
  },
  line: () => {
    const series = [
      [0, 0],
      [90, 34],
      [180, 22],
      [270, 74],
      [360, 96],
      [440, 128],
    ];
    return doc("Line chart — trend over time", [
      line("y-axis", 140, 130, [[0, 0], [0, 190]], { stroke: INK }),
      line("x-axis", 140, 320, [[0, 0], [460, 0]], { stroke: INK }),
      txt("y-label", 88, 122, "p99", { fontSize: 13, color: MUTED }),
      txt("x0", 132, 332, "2024", { fontSize: 13, color: MUTED }),
      txt("x1", 556, 332, "2026", { fontSize: 13, color: MUTED }),
      line("series", 160, 160, series, { stroke: ACCENT }),
      ...series.map(([dx, dy], i) => dot(`s${i}`, 160 + dx, 160 + dy, 5, { fill: ACCENT, stroke: ACCENT })),
      txt("callout", 428, 258, "142ms", { fontSize: 15, color: ACCENT }),
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
    const hexagon = (id, radii, opts) => {
      const pts = radii.map((r, i) => vertex(r, i));
      const [ox, oy] = pts[0];
      return line(id, ox, oy, [...pts, pts[0]].map(([x, y]) => [x - ox, y - oy]), opts);
    };
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
    const json = JSON.stringify(JSON.parse(full), null, 2) + "\n";
    await writeFile(join(dir, "example.excalidraw"), json);
    console.log(`wrote ${type}/example.excalidraw`);
  }
  console.log(`\n${types.length} hydrated type fixtures generated.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
