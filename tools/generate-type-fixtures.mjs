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
    const client = { id: "client", x: 40, y: 200, w: 120, h: 48 };
    const api = { id: "api", x: 260, y: 196, w: 140, h: 56 };
    const db = { id: "db", x: 520, y: 120, w: 160, h: 56 };
    const queue = { id: "queue", x: 520, y: 268, w: 160, h: 56 };
    const apiRight = api.x + api.w;
    const apiCy = api.y + api.h / 2;
    return doc("Architecture — components + boundaries", [
      zone("zone", 220, 88, 520, 280, ""),
      txt("zone-label", 236, 96, "Production VPC", { fontSize: 14, color: MUTED }),
      rect(client.id, client.x, client.y, client.w, client.h, "Client", { fill: PAPER, stroke: MUTED }),
      rect(api.id, api.x, api.y, api.w, api.h, "API"),
      rect(db.id, db.x, db.y, db.w, db.h, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
      rect(queue.id, queue.x, queue.y, queue.w, queue.h, "Queue"),
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
      txt("a0-l", 148, 178, "POST /orders", { fontSize: 13, color: MUTED }),
      txt("a1-l", 430, 140, "read/write", { fontSize: 13, color: MUTED }),
      txt("a2-l", 438, 280, "publish", { fontSize: 13, color: MUTED }),
      txt("note", 40, 280, "edge stays out", { fontSize: 12, color: MUTED }),
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
      txt("rule", 100, 450, "taste gate blocks merge until the PNG reads clean", {
        fontSize: 13,
        color: MUTED,
      }),
    ]);
  },
  sequence: () => {
    // Lifelines hang from box centres. Message labels sit ABOVE the shaft as
    // free text — bound labels land on the line and, at Cascadia width, collide.
    const cx = { client: 160, api: 400, db: 640 };
    const lifeline = (id, x) => line(id, x, 168, [[0, 0], [0, 280]], { dashed: true });
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
      txt("budget", 120, 460, "budget: 4 messages · happy path only", {
        fontSize: 13,
        color: MUTED,
      }),
    ]);
  },
  state: () => {
    const draft = { id: "draft", x: 100, y: 160, w: 140, h: 56 };
    const review = { id: "review", x: 380, y: 160, w: 140, h: 56 };
    const live = { id: "live", x: 660, y: 160, w: 140, h: 56 };
    return doc("State machine — allowed transitions", [
      ellipse("entry", 40, 172, 28, 28, "", { fill: INK, stroke: INK }),
      arrow("t0", { id: "entry", x: 40, y: 172, w: 28, h: 28 }, draft, "", {
        from: "right",
        to: "left",
      }),
      rect(draft.id, draft.x, draft.y, draft.w, draft.h, "Draft"),
      rect(review.id, review.x, review.y, review.w, review.h, "Review"),
      rect(live.id, live.x, live.y, live.w, live.h, "Live", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
      arrow("t1", draft, review, ""),
      arrow("t2", review, live, ""),
      txt("t1-l", 268, 138, "submit", { fontSize: 14, color: MUTED }),
      txt("t2-l", 548, 138, "approve", { fontSize: 14, color: MUTED }),
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
      txt("rule", 380, 340, "no Draft → Live: every ship passes Review", {
        fontSize: 13,
        color: MUTED,
      }),
    ]);
  },
  er: () => {
    const user = { id: "user", x: 80, y: 140, w: 170, h: 96 };
    const order = { id: "order", x: 370, y: 140, w: 170, h: 96 };
    const item = { id: "item", x: 660, y: 140, w: 170, h: 96 };
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
      rect(order.id, order.x, order.y, order.w, order.h, "Order\nid PK\nuser_id FK"),
      rect(item.id, item.x, item.y, item.w, item.h, "LineItem\nid PK\norder_id FK", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      shaft("r1", user, order),
      shaft("r2", order, item),
      ...foot("f1", order.x, order.y + order.h / 2),
      ...foot("f2", item.x, item.y + item.h / 2),
      txt("r1-l", 278, 118, "1:N", { fontSize: 14, color: MUTED }),
      txt("r2-l", 568, 118, "1:N", { fontSize: 14, color: MUTED }),
      txt("note", 80, 260, "one user → many orders → many line items", {
        fontSize: 13,
        color: MUTED,
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
    return doc("Timeline — events on an axis", [
      line("axis", 120, axisY, [[0, 0], [620, 0]], { stroke: INK }),
      ...[200, 280, 360, 440, 520, 600, 680].map((x, i) => tick(`tk${i}`, x)),
      ...events.flatMap((e) => [
        dot(e.id, e.x, axisY, e.accent ? 7 : 6, e.accent ? { fill: ACCENT, stroke: ACCENT } : {}),
        line(`${e.id}-stem`, e.x, axisY - 28, [[0, 0], [0, 22]], {
          strokeWidth: 1,
          stroke: e.accent ? ACCENT : MUTED,
        }),
        txt(`${e.id}-l`, e.x - (e.label.length * 4), axisY - 52, e.label, {
          fontSize: 15,
          color: e.accent ? ACCENT : INK,
        }),
        txt(`${e.id}-s`, e.x - (e.sub.length * 3.2), axisY + 18, e.sub, {
          fontSize: 12,
          color: MUTED,
        }),
      ]),
      txt("t0", 112, axisY + 40, "2024", { fontSize: 13, color: MUTED }),
      txt("t1", 710, axisY + 40, "2026", { fontSize: 13, color: MUTED }),
      line("now", 520, axisY + 48, [[0, 0], [0, 28]], { stroke: ACCENT, strokeWidth: 1 }),
      txt("now-l", 500, axisY + 78, "now", { fontSize: 12, color: ACCENT }),
      txt("story", 120, 120, "from shippable MVP to a taste gate that blocks bad diagrams", {
        fontSize: 13,
        color: MUTED,
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
      ...week("w3", 360, "W3"),
      ...week("w5", 500, "W5"),
      ...week("w7", 640, "W7"),
      txt("own1", 60, 168, "Design · Sam", { fontSize: 13, color: MUTED }),
      txt("own2", 60, 228, "Build · Eng", { fontSize: 13, color: MUTED }),
      txt("own3", 60, 288, "Ship · Ops", { fontSize: 13, color: MUTED }),
      rect("p1", 160, 160, 200, 34, "wireframes → tokens"),
      // Build runs past Ship's start — the slip is the argument, so the bars must overlap.
      rect("p2", 290, 220, 300, 34, "renderer + fixtures", { fill: "#fef3c7" }),
      rect("p3", 470, 280, 200, 34, "docs + cutover", { fill: "#dcfce7", stroke: "#15803d" }),
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
      txt("ms", 640, 320, "go-live W8", { fontSize: 13, color: "#15803d" }),
    ]);
  },
  swimlane: () => {
    // Orthogonal elbows only — a diagonal handoff through empty lane space
    // reads as a routing bug, not a cross-functional story.
    const brief = { id: "brief", x: 200, y: 140, w: 120, h: 48 };
    const spec = { id: "spec", x: 360, y: 140, w: 130, h: 48 };
    const impl = { id: "impl", x: 420, y: 270, w: 150, h: 48 };
    const signoff = { id: "signoff", x: 650, y: 140, w: 140, h: 48 };
    return doc("Swimlane — cross-functional handoffs", [
      zone("lane1", 180, 110, 660, 100, ""),
      zone("lane2", 180, 240, 660, 100, ""),
      txt("lane1-l", 60, 150, "Product", { fontSize: 14, color: MUTED }),
      txt("lane2-l", 48, 280, "Engineering", { fontSize: 14, color: MUTED }),
      rect(brief.id, brief.x, brief.y, brief.w, brief.h, "Brief"),
      rect(spec.id, spec.x, spec.y, spec.w, spec.h, "Spec"),
      rect(impl.id, impl.x, impl.y, impl.w, impl.h, "Implement"),
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
      txt("h2-l", signoff.x - 48, 252, "PR review", { fontSize: 13, color: MUTED }),
      txt("sla", 650, 280, "≤ 2 days in Eng", { fontSize: 12, color: MUTED }),
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
      txt("claim", 140, 420, "Themes ship this sprint; MCP app is a quarter bet", {
        fontSize: 13,
        color: ACCENT,
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
      txt("hub-note", 80, 380, "hub accumulates; the loop never starts from empty", {
        fontSize: 13,
        color: MUTED,
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
      txt("sla", 580, 260, "P95 < 40 min", { fontSize: 13, color: MUTED }),
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
    ]);
  },
  // Boundary labels sit at the top-left edge: a centred container label lands on
  // whatever the boundary contains.
  nested: () => {
    // Gateway is the edge of Platform; Service A nests API+Cache. Client stays out
    // so the Platform boundary excludes something — same rule as architecture VPC.
    // Align Gateway and API on one row so the route stays a pure horizontal.
    const client = { id: "client", x: 40, y: 220, w: 120, h: 44 };
    const gateway = { id: "gateway", x: 220, y: 220, w: 140, h: 44 };
    const api = { id: "api", x: 460, y: 220, w: 200, h: 44 };
    const cache = { id: "cache", x: 460, y: 276, w: 200, h: 36 };
    return doc("Nested — hierarchy by containment", [
      zone("outer", 190, 110, 520, 230, ""),
      txt("outer-l", 206, 120, "Platform", { fontSize: 14, color: MUTED }),
      zone("inner", 420, 150, 270, 180, ""),
      txt("inner-l", 436, 160, "Service A", { fontSize: 14, color: MUTED }),
      rect(client.id, client.x, client.y, client.w, client.h, "Client", {
        fill: PAPER,
        stroke: MUTED,
      }),
      rect(gateway.id, gateway.x, gateway.y, gateway.w, gateway.h, "Gateway"),
      rect(api.id, api.x, api.y, api.w, api.h, "API"),
      rect(cache.id, cache.x, cache.y, cache.w, cache.h, "Cache", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 15,
      }),
      arrow("n0", client, gateway, "", { from: "right", to: "left" }),
      arrow("n1", gateway, api, "", { from: "right", to: "left" }),
      txt("n0-l", 150, 196, "HTTPS", { fontSize: 13, color: MUTED }),
      txt("n1-l", 370, 196, "route", { fontSize: 13, color: MUTED }),
      txt("note", 40, 300, "Client stays outside Platform", { fontSize: 12, color: MUTED }),
    ]);
  },
  medallion: () => {
    // Wide gaps + free edge labels: "aggregate" is wider than a tight shaft can hold.
    // Under each tier: the concrete contract a reader can audit, not just a name.
    const bronze = { id: "bronze", x: 60, y: 140, w: 180, h: 96 };
    const silver = { id: "silver", x: 330, y: 140, w: 180, h: 96 };
    const gold = { id: "gold", x: 600, y: 140, w: 180, h: 96 };
    return doc("Medallion — bronze / silver / gold tiers", [
      rect(bronze.id, bronze.x, bronze.y, bronze.w, bronze.h, "Bronze · raw\nevents_raw"),
      rect(silver.id, silver.x, silver.y, silver.w, silver.h, "Silver · conformed\ndim_user", {
        fill: "#e2e8f0",
      }),
      rect(gold.id, gold.x, gold.y, gold.w, gold.h, "Gold · mart\nmrt_revenue", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      arrow("m1", bronze, silver, ""),
      arrow("m2", silver, gold, ""),
      txt("m1-l", 258, 118, "dedupe + types", { fontSize: 13, color: MUTED }),
      txt("m2-l", 518, 118, "aggregate", { fontSize: 13, color: MUTED }),
      txt("b-own", 60, 252, "owned by ingest", { fontSize: 12, color: MUTED }),
      txt("s-own", 330, 252, "owned by analytics eng", { fontSize: 12, color: MUTED }),
      txt("g-own", 600, 252, "owned by BI", { fontSize: 12, color: ACCENT }),
      txt("tier-note", 60, 290, "each tier is a contract: raw → conformed → mart", {
        fontSize: 13,
        color: MUTED,
      }),
    ]);
  },
  // Depth is the grammar: a two-level fork is an org chart without the routing.
  // Orthogonal rails keep every edge pure H/V.
  tree: () => {
    const root = { id: "root", x: 334, y: 100, w: 132, h: 48 };
    const left = { id: "left", x: 140, y: 220, w: 132, h: 48 };
    const right = { id: "right", x: 528, y: 220, w: 132, h: 48 };
    const a1 = { id: "a1", x: 80, y: 340, w: 120, h: 44 };
    const a2 = { id: "a2", x: 220, y: 340, w: 120, h: 44 };
    const b1 = { id: "b1", x: 528, y: 340, w: 132, h: 44 };
    const railY = 184;
    const leafRailY = 304;
    return doc("Tree — parent → children", [
      rect(root.id, root.x, root.y, root.w, root.h, "packages/"),
      rect(left.id, left.x, left.y, left.w, left.h, "core/"),
      rect(right.id, right.x, right.y, right.w, right.h, "themes/"),
      rect(a1.id, a1.x, a1.y, a1.w, a1.h, "SKILL.md", { labelSize: 15 }),
      rect(a2.id, a2.x, a2.y, a2.w, a2.h, "loader.ts", { labelSize: 15 }),
      rect(b1.id, b1.x, b1.y, b1.w, b1.h, "dark/", {
        fill: "#fef3c7",
        stroke: ACCENT,
        labelSize: 15,
      }),
      // Root drops to a shared rail, then fans to children.
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
      arrow("t5", right, b1, "", { from: "bottom", to: "top" }),
      txt("note", 80, 410, "depth is the grammar: three levels, one accent leaf", {
        fontSize: 13,
        color: MUTED,
      }),
    ]);
  },
  // Solid lines are the reporting tree; the dashed one is the routing the title
  // promises — who Product actually asks, which the tree alone never shows.
  "org-chart": () => {
    const ceo = { id: "ceo", x: 334, y: 100, w: 132, h: 48 };
    const eng = { id: "eng", x: 140, y: 220, w: 156, h: 48 };
    const prod = { id: "prod", x: 504, y: 220, w: 156, h: 48 };
    const platform = { id: "platform", x: 140, y: 340, w: 156, h: 48 };
    const railY = 184;
    return doc("Org chart — ownership + routing", [
      rect(ceo.id, ceo.x, ceo.y, ceo.w, ceo.h, "CEO"),
      rect(eng.id, eng.x, eng.y, eng.w, eng.h, "Engineering\n12 people"),
      rect(prod.id, prod.x, prod.y, prod.w, prod.h, "Product\n4 people"),
      rect(platform.id, platform.x, platform.y, platform.w, platform.h, "Platform\n3 people", {
        fill: "#fef3c7",
        stroke: ACCENT,
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
      elbow(
        "route",
        [
          [prod.x + prod.w / 2, prod.y + prod.h + 8],
          [prod.x + prod.w / 2, platform.y + platform.h / 2],
          [platform.x + platform.w + 8, platform.y + platform.h / 2],
        ],
        { dashed: true, stroke: MUTED }
      ),
      txt("route-l", 360, platform.y + platform.h / 2 + 14, "asks for capacity", {
        fontSize: 13,
        color: MUTED,
      }),
      txt("note", 360, 380, "solid = reports to · dashed = who they actually ask", {
        fontSize: 12,
        color: MUTED,
      }),
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
      txt("overlap", 344, 394, "ship it twice", { fontSize: 14, color: ACCENT }),
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
      txt("t2-l", 300, 222, "Capabilities", { fontSize: 15 }),
      txt("t1-l", 290, 306, "Infrastructure", { fontSize: 15 }),
      // Leaders pin each callout to its band — floating copy isn't a pin.
      line("ld3", apex + 78, 148, [[0, 0], [40, 0]], { stroke: ACCENT, strokeWidth: 1 }),
      txt("t3-ex", apex + 126, 140, "which bets we fund", { fontSize: 13, color: ACCENT }),
      line("ld2", apex + 164, 232, [[0, 0], [40, 0]], { stroke: MUTED, strokeWidth: 1 }),
      txt("t2-ex", apex + 212, 224, "what we can ship", { fontSize: 13, color: MUTED }),
      line("ld1", apex + 250, 316, [[0, 0], [40, 0]], { stroke: MUTED, strokeWidth: 1 }),
      txt("t1-ex", apex + 298, 308, "what everything sits on", { fontSize: 13, color: MUTED }),
      txt("invert", 80, 390, "invert it and strategy floats with nothing under it", {
        fontSize: 13,
        color: MUTED,
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
    ];
    const cellW = 250;
    return doc("Comparison — before / after contrast", [
      txt("h-before", 250, 118, "Static export", { fontSize: 16, color: MUTED }),
      txt("h-after", 540, 118, "Editable source", { fontSize: 16, color: "#15803d" }),
      line("h-rule", 100, 146, [[0, 0], [700, 0]], { strokeWidth: 1, stroke: GRID }),
      ...rows.flatMap((row, i) => {
        const y = 160 + i * 68;
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
      txt("verdict", 250, 440, "editable wins on every question that matters after day one", {
        fontSize: 13,
        color: "#15803d",
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
    const appRight = app.x + app.w;
    const appCy = app.y + app.h / 2;
    return doc("High-level — end-to-end on one cluster", [
      zone("cluster", 420, 120, 412, 232, ""),
      txt("cluster-l", 436, 130, "Production cluster", { fontSize: 14, color: MUTED }),
      rect(browser.id, browser.x, browser.y, browser.w, browser.h, "Browser", { fill: PAPER, stroke: MUTED }),
      rect(cdn.id, cdn.x, cdn.y, cdn.w, cdn.h, "CDN", { fill: PAPER, stroke: MUTED }),
      rect(app.id, app.x, app.y, app.w, app.h, "App"),
      rect(db.id, db.x, db.y, db.w, db.h, "Postgres", { fill: "#fef3c7", stroke: ACCENT }),
      rect(cache.id, cache.x, cache.y, cache.w, cache.h, "Redis"),
      arrow("hl1", browser, cdn, "", { from: "right", to: "left" }),
      arrow("hl2", cdn, app, "", { from: "right", to: "left" }),
      elbow("hl3", [
        [appRight + 8, appCy],
        [appRight + 40, appCy],
        [appRight + 40, db.y + db.h / 2],
        [db.x - 8, db.y + db.h / 2],
      ]),
      elbow("hl4", [
        [appRight + 8, appCy],
        [appRight + 40, appCy],
        [appRight + 40, cache.y + cache.h / 2],
        [cache.x - 8, cache.y + cache.h / 2],
      ]),
      txt("hl1-l", 168, 186, "HTTPS", { fontSize: 13, color: MUTED }),
      txt("hl2-l", 348, 186, "edge cache", { fontSize: 13, color: MUTED }),
      txt("hl3-l", 600, 148, "SQL", { fontSize: 13, color: MUTED }),
      txt("hl4-l", 600, 268, "GET", { fontSize: 13, color: MUTED }),
      txt("note", 60, 280, "origin stays inside; edge stays out", { fontSize: 13, color: MUTED }),
    ]);
  },
  "it-state": () => {
    const mainframe = { id: "mainframe", x: 80, y: 130, w: 150, h: 64 };
    const as400 = { id: "as400", x: 80, y: 240, w: 150, h: 64 };
    const esb = { id: "esb", x: 440, y: 185, w: 150, h: 64 };
    const saas = { id: "saas", x: 780, y: 185, w: 150, h: 64 };
    const railX = 320;
    const esbCy = esb.y + esb.h / 2;
    return doc("IT current-state — legacy landscape", [
      rect(mainframe.id, mainframe.x, mainframe.y, mainframe.w, mainframe.h, "Mainframe\nCOBOL jobs"),
      rect(as400.id, as400.x, as400.y, as400.w, as400.h, "AS/400\ninventory"),
      // Everything funnels through one bus: that is the finding, so it carries the accent.
      rect(esb.id, esb.x, esb.y, esb.w, esb.h, "ESB\nsingle throat", {
        fill: "#fed7aa",
        stroke: ACCENT,
      }),
      rect(saas.id, saas.x, saas.y, saas.w, saas.h, "SaaS CRM", {
        fill: "#dcfce7",
        stroke: "#15803d",
      }),
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
      arrow("i3", esb, saas, "", { from: "right", to: "left" }),
      txt("i1-l", 250, 140, "nightly batch", { fontSize: 13, color: MUTED }),
      txt("i2-l", 250, 268, "flat file", { fontSize: 13, color: MUTED }),
      txt("i3-l", 630, 164, "REST", { fontSize: 13, color: MUTED }),
      txt("find", 80, 330, "finding: every modernization path still hits the ESB", {
        fontSize: 13,
        color: ACCENT,
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
      txt("cut", 380, 320, "the cut is the argument: who may see raw PII", {
        fontSize: 13,
        color: ACCENT,
      }),
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
    const railIn = 280;
    const railOut = 540;
    const coreCy = core.y + core.h / 2;
    return doc("DP integration — sources → core → consumers", [
      ...sources.map((s) => rect(s.id, s.x, s.y, s.w, s.h, s.label)),
      rect(core.id, core.x, core.y, core.w, core.h, "Lakehouse\nDelta + Unity", {
        fill: "#fef3c7",
        stroke: ACCENT,
      }),
      ...consumers.map((c) => rect(c.id, c.x, c.y, c.w, c.h, c.label)),
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
      txt("in-l", 250, 100, "CDC / batch", { fontSize: 12, color: MUTED }),
      txt("out-l", 520, 112, "SQL / features", { fontSize: 12, color: MUTED }),
      txt("core-note", 330, 290, "one write path; many readers", { fontSize: 13, color: ACCENT }),
    ]);
  },
  "dp-security-matrix": () => {
    const cell = (id, x, y, label, write) =>
      rect(id, x, y, 130, 44, label, write ? { fill: "#fed7aa", stroke: ACCENT } : { fill: PAPER, stroke: MUTED });
    return doc("DP security matrix — role × resource", [
      txt("h1", 300, 128, "orders_pii", { fontSize: 14, color: MUTED }),
      txt("h2", 470, 128, "agg_revenue", { fontSize: 14, color: MUTED }),
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
      txt("leg", 100, 350, "orange = write · white = read-only", { fontSize: 13, color: MUTED }),
      txt("claim", 300, 350, "Analyst never touches PII write path", { fontSize: 13, color: ACCENT }),
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
      txt("yoy", 180, baseline + 40, "+30% YoY · theme pack launch in Q4", { fontSize: 13, color: MUTED }),
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
      // SLA threshold: the chart's claim is crossing under, not just falling.
      line("sla", 140, y(200), [[0, 0], [480, 0]], { stroke: ACCENT, dashed: true, strokeWidth: 1 }),
      txt("sla-l", 630, y(200) - 8, "SLA 200ms", { fontSize: 12, color: ACCENT }),
      poly("series", readings.map((_, i) => at(i)), { stroke: ACCENT, open: true }),
      ...readings.map((_, i) => {
        const [px, py] = at(i);
        return dot(`s${i}`, px, py, 5, { fill: ACCENT, stroke: ACCENT });
      }),
      txt("callout", 634, y(142) - 10, "142ms", { fontSize: 15, color: ACCENT }),
      txt("note", 160, baseline + 40, "crossed under SLA after the index rewrite", {
        fontSize: 13,
        color: MUTED,
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
      ...tick("t50", 270, "50"),
      ...tick("t100", 200, "100"),
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
      txt("callout", 500, 260, "fewer errors\nwith practice", { fontSize: 13, color: ACCENT }),
      txt("n", 140, baseline + 40, "n = 48 sessions · same cohort", { fontSize: 12, color: MUTED }),
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
      txt("key-note", 520, 280, "0–120 per axis", { fontSize: 12, color: MUTED }),
      txt("find", 520, 320, "Reach + Taste up; Cost traded down", {
        fontSize: 13,
        color: ACCENT,
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
