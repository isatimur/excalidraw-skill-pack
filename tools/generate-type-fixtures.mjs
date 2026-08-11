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
    label: label ? { text: label } : undefined,
  };
}

function diamond(id, x, y, w, h, label) {
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
    label: label ? { text: label } : undefined,
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

function arrow(id, from, to, label) {
  const start = exitAnchor(from, to);
  const end = entryAnchor(to, from);
  return {
    type: "arrow",
    id,
    x: start.x,
    y: start.y,
    width: end.x - start.x,
    height: end.y - start.y,
    strokeColor: INK,
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
    const api = { id: "api", x: 120, y: 120, w: 140, h: 64 };
    const db = { id: "db", x: 360, y: 120, w: 140, h: 64 };
    const queue = { id: "queue", x: 600, y: 120, w: 140, h: 64 };
    return doc("Architecture — components + boundaries", [
      zone("zone", 80, 96, 700, 120, "VPC"),
      rect(api.id, api.x, api.y, api.w, api.h, "API"),
      rect(db.id, db.x, db.y, db.w, db.h, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
      rect(queue.id, queue.x, queue.y, queue.w, queue.h, "Queue"),
      arrow("a1", api, db, "read/write"),
      arrow("a2", api, queue, "publish"),
    ]);
  },
  flowchart: () => {
    const start = { id: "start", x: 280, y: 100, w: 120, h: 48 };
    const decide = { id: "decide", x: 260, y: 200, w: 160, h: 80 };
    const yes = { id: "yes", x: 120, y: 320, w: 120, h: 56 };
    const no = { id: "no", x: 440, y: 320, w: 120, h: 56 };
    return doc("Flowchart — branching decisions", [
      ellipse(start.id, start.x, start.y, start.w, start.h, "Trigger"),
      arrow("a0", start, decide, ""),
      diamond(decide.id, decide.x, decide.y, decide.w, decide.h, "Valid?"),
      arrow("a1", decide, yes, "yes"),
      arrow("a2", decide, no, "no"),
      rect(yes.id, yes.x, yes.y, yes.w, yes.h, "Process"),
      rect(no.id, no.x, no.y, no.w, no.h, "Reject"),
    ]);
  },
  sequence: () => {
    const client = { id: "client", x: 80, y: 100, w: 100, h: 48 };
    const api = { id: "api", x: 280, y: 100, w: 100, h: 48 };
    const db = { id: "db", x: 480, y: 100, w: 100, h: 48 };
    return doc("Sequence — messages over time", [
      rect(client.id, client.x, client.y, client.w, client.h, "Client"),
      rect(api.id, api.x, api.y, api.w, api.h, "API"),
      rect(db.id, db.x, db.y, db.w, db.h, "DB"),
      txt("m1", 130, 180, "POST /orders", { fontSize: 14, color: MUTED }),
      txt("m2", 330, 220, "INSERT", { fontSize: 14, color: MUTED }),
      txt("m3", 330, 260, "201 Created", { fontSize: 14, color: MUTED }),
      arrow("s1", client, api, ""),
      arrow("s2", api, db, ""),
    ]);
  },
  state: () => {
    const draft = { id: "draft", x: 80, y: 140, w: 120, h: 56 };
    const review = { id: "review", x: 280, y: 140, w: 120, h: 56 };
    const live = { id: "live", x: 480, y: 140, w: 120, h: 56 };
    return doc("State machine — allowed transitions", [
      rect(draft.id, draft.x, draft.y, draft.w, draft.h, "Draft"),
      rect(review.id, review.x, review.y, review.w, review.h, "Review"),
      rect(live.id, live.x, live.y, live.w, live.h, "Live", { fill: "#dcfce7", stroke: "#15803d" }),
      arrow("t1", draft, review, "submit"),
      arrow("t2", review, live, "approve"),
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
      txt("axis", 80, 200, "2024 ————●————●————●———— 2026", { fontSize: 18 }),
      txt("e1", 200, 160, "MVP", { fontSize: 14 }),
      txt("e2", 380, 160, "Themes", { fontSize: 14 }),
      txt("e3", 560, 160, "MCP", { fontSize: 14, color: ACCENT }),
    ]);
  },
  gantt: () => {
    return doc("Gantt — phases on a timeline", [
      rect("p1", 120, 140, 180, 32, "Design"),
      rect("p2", 240, 190, 220, 32, "Build", { fill: "#fef3c7" }),
      rect("p3", 400, 240, 160, 32, "Ship", { fill: "#dcfce7", stroke: "#15803d" }),
      txt("weeks", 80, 120, "Week 1–8", { fontSize: 13, color: MUTED }),
    ]);
  },
  swimlane: () => {
    return doc("Swimlane — cross-functional handoffs", [
      zone("lane1", 60, 100, 620, 80, "Product"),
      zone("lane2", 60, 200, 620, 80, "Engineering"),
      rect("s1", 100, 120, 100, 40, "Spec"),
      rect("s2", 280, 220, 100, 40, "Implement"),
      rect("s3", 460, 120, 100, 40, "Sign-off"),
      arrow("h1", { id: "s1", x: 100, y: 120, w: 100, h: 40 }, { id: "s2", x: 280, y: 220, w: 100, h: 40 }, "handoff"),
    ]);
  },
  quadrant: () => {
    return doc("Quadrant — two-axis positioning", [
      txt("y", 48, 180, "Impact ↑", { fontSize: 14, color: MUTED }),
      txt("x", 360, 360, "Effort →", { fontSize: 14, color: MUTED }),
      rect("q1", 120, 120, 200, 200, "", { fill: PAPER, stroke: MUTED }),
      ellipse("dot1", 180, 200, 48, 48, "Now"),
      ellipse("dot2", 320, 160, 48, 48, "Next", { fill: "#fed7aa", stroke: ACCENT }),
    ]);
  },
  loop: () => {
    const hub = { id: "hub", x: 300, y: 200, w: 120, h: 72 };
    const a = { id: "a", x: 120, y: 120, w: 100, h: 48 };
    const b = { id: "b", x: 500, y: 120, w: 100, h: 48 };
    const c = { id: "c", x: 500, y: 300, w: 100, h: 48 };
    return doc("Loop — flywheel around a hub", [
      rect(hub.id, hub.x, hub.y, hub.w, hub.h, "Memory", { fill: "#fef3c7", stroke: ACCENT }),
      rect(a.id, a.x, a.y, a.w, a.h, "Capture"),
      rect(b.id, b.x, b.y, b.w, b.h, "Synthesize"),
      rect(c.id, c.x, c.y, c.w, c.h, "Publish"),
      arrow("l1", a, hub, ""),
      arrow("l2", hub, b, ""),
      arrow("l3", b, c, ""),
    ]);
  },
  process: () => {
    const s1 = { id: "s1", x: 80, y: 160, w: 100, h: 48 };
    const s2 = { id: "s2", x: 240, y: 160, w: 100, h: 48 };
    const s3 = { id: "s3", x: 400, y: 160, w: 100, h: 48 };
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
  nested: () => {
    return doc("Nested — hierarchy by containment", [
      zone("outer", 80, 100, 520, 280, "Platform"),
      zone("inner", 120, 160, 200, 160, "Service A"),
      rect("leaf", 360, 180, 120, 56, "Cache"),
    ]);
  },
  medallion: () => {
    return doc("Medallion — bronze / silver / gold tiers", [
      rect("bronze", 120, 180, 140, 64, "Bronze\nraw"),
      rect("silver", 300, 160, 140, 64, "Silver\nclean", { fill: "#e2e8f0" }),
      rect("gold", 480, 140, 140, 64, "Gold\nmart", { fill: "#fef3c7", stroke: ACCENT }),
      arrow("m1", { id: "bronze", x: 120, y: 180, w: 140, h: 64 }, { id: "silver", x: 300, y: 160, w: 140, h: 64 }, "transform"),
      arrow("m2", { id: "silver", x: 300, y: 160, w: 140, h: 64 }, { id: "gold", x: 480, y: 140, w: 140, h: 64 }, "aggregate"),
    ]);
  },
  tree: () => {
    const root = { id: "root", x: 320, y: 100, w: 120, h: 48 };
    const left = { id: "left", x: 160, y: 200, w: 100, h: 48 };
    const right = { id: "right", x: 480, y: 200, w: 100, h: 48 };
    return doc("Tree — parent → children", [
      rect(root.id, root.x, root.y, root.w, root.h, "Root"),
      rect(left.id, left.x, left.y, left.w, left.h, "Branch A"),
      rect(right.id, right.x, right.y, right.w, right.h, "Branch B"),
      arrow("t1", root, left, ""),
      arrow("t2", root, right, ""),
    ]);
  },
  "org-chart": () => {
    const ceo = { id: "ceo", x: 300, y: 100, w: 120, h: 48 };
    const eng = { id: "eng", x: 160, y: 200, w: 120, h: 48 };
    const prod = { id: "prod", x: 440, y: 200, w: 120, h: 48 };
    return doc("Org chart — ownership + routing", [
      rect(ceo.id, ceo.x, ceo.y, ceo.w, ceo.h, "CEO"),
      rect(eng.id, eng.x, eng.y, eng.w, eng.h, "Engineering"),
      rect(prod.id, prod.x, prod.y, prod.w, prod.h, "Product"),
      arrow("o1", ceo, eng, ""),
      arrow("o2", ceo, prod, ""),
    ]);
  },
  venn: () => {
    return doc("Venn — set overlap", [
      ellipse("a", 180, 160, 160, 160, "Speed"),
      ellipse("b", 280, 160, 160, 160, "Quality"),
      txt("overlap", 280, 230, "Sweet spot", { fontSize: 14, color: ACCENT }),
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
    return doc("IT current-state — legacy landscape", [
      rect("legacy", 80, 140, 140, 64, "Mainframe"),
      rect("bridge", 280, 140, 140, 64, "ESB"),
      rect("saas", 480, 140, 140, 64, "SaaS", { fill: "#dcfce7" }),
      arrow("i1", { id: "legacy", x: 80, y: 140, w: 140, h: 64 }, { id: "bridge", x: 280, y: 140, w: 140, h: 64 }, "batch"),
      arrow("i2", { id: "bridge", x: 280, y: 140, w: 140, h: 64 }, { id: "saas", x: 480, y: 140, w: 140, h: 64 }, "API"),
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
    return doc("DP integration — sources → core → consumers", [
      rect("src", 80, 160, 100, 48, "Sources"),
      rect("core", 280, 140, 120, 72, "Lakehouse", { fill: "#fef3c7", stroke: ACCENT }),
      rect("cons", 500, 160, 100, 48, "BI / ML"),
      arrow("dp1", { id: "src", x: 80, y: 160, w: 100, h: 48 }, { id: "core", x: 280, y: 140, w: 120, h: 72 }, ""),
      arrow("dp2", { id: "core", x: 280, y: 140, w: 120, h: 72 }, { id: "cons", x: 500, y: 160, w: 100, h: 48 }, ""),
    ]);
  },
  "dp-security-matrix": () => {
    return doc("DP security matrix — role × resource", [
      txt("hdr", 80, 120, "Role ↓   Dataset A   Dataset B", { fontSize: 14, color: MUTED }),
      rect("r1", 80, 160, 480, 40, "Analyst — read — read"),
      rect("r2", 80, 210, 480, 40, "Engineer — write — read"),
      rect("r3", 80, 260, 480, 40, "Admin — write — write", { fill: "#fef3c7" }),
    ]);
  },
  bar: () => {
    return doc("Bar chart — categorical comparison", [
      rect("b1", 120, 240, 48, 80, "", { fill: INK }),
      rect("b2", 220, 200, 48, 120, "", { fill: ACCENT }),
      rect("b3", 320, 220, 48, 100, "", { fill: INK }),
      txt("l1", 110, 330, "Q1", { fontSize: 13 }),
      txt("l2", 210, 330, "Q2", { fontSize: 13 }),
      txt("l3", 310, 330, "Q3", { fontSize: 13 }),
    ]);
  },
  line: () => {
    return doc("Line chart — trend over time", [
      txt("chart", 80, 200, "↗ latency down 40% YoY", { fontSize: 18 }),
      rect("axis", 80, 280, 480, 2, "", { fill: MUTED, stroke: MUTED }),
    ]);
  },
  scatter: () => {
    return doc("Scatter — distribution + correlation", [
      ellipse("p1", 140, 220, 16, 16, ""),
      ellipse("p2", 200, 180, 16, 16, ""),
      ellipse("p3", 260, 200, 16, 16, "", { fill: ACCENT, stroke: ACCENT }),
      ellipse("p4", 320, 160, 16, 16, ""),
      ellipse("p5", 380, 140, 16, 16, "", { fill: ACCENT, stroke: ACCENT }),
      txt("label", 80, 120, "Higher skill ↔ lower error rate", { fontSize: 14, color: MUTED }),
    ]);
  },
  radar: () => {
    return doc("Radar — multi-axis comparison", [
      ellipse("radar", 240, 140, 200, 200, "", { fill: PAPER, stroke: MUTED }),
      txt("axes", 280, 240, "Speed · Quality · Cost", { fontSize: 14 }),
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
