// Single source of truth for the type specimen: one reduced glyph per diagram type,
// grouped by the question the type answers. Thumbnails of the real renders are
// illegible below ~400px, so the specimen argues with silhouette instead — the
// isomorphism test applied to our own catalogue.

const attrs = (o = {}) => {
  const cls = [o.a && "a", o.d && "d", o.f && "f", o.af && "af"].filter(Boolean).join(" ");
  return cls ? ` class="${cls}"` : "";
};

const r = (x, y, w, h, o) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${attrs(o)}/>`;
const l = (x1, y1, x2, y2, o) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${attrs(o)}/>`;
const c = (cx, cy, rad, o) => `<circle cx="${cx}" cy="${cy}" r="${rad}"${attrs(o)}/>`;
const dot = (cx, cy, o) => c(cx, cy, 2.6, { f: true, ...o });
const pg = (points, o) => `<polygon points="${points}"${attrs(o)}/>`;
const pl = (points, o) => `<polyline points="${points}"${attrs(o)}/>`;
const p = (d, o) => `<path d="${d}"${attrs(o)}/>`;

const GLYPHS = {
  architecture: [
    r(22, 8, 74, 48, { d: true }),
    r(2, 24, 16, 14),
    l(18, 31, 28, 31),
    r(28, 24, 18, 14),
    l(46, 31, 54, 31),
    l(54, 31, 54, 18),
    l(54, 18, 62, 18),
    r(62, 12, 26, 12, { a: true }),
    l(54, 31, 54, 44),
    l(54, 44, 62, 44),
    r(62, 38, 26, 12),
  ],
  // Span, not containment — one unbroken run edge to edge. Architecture already
  // owns "dashed boundary around a cluster", so the boundary here only marks
  // where the run crosses into production.
  "high-level": [
    r(2, 26, 16, 12),
    l(18, 32, 24, 32),
    r(24, 26, 16, 12),
    l(40, 32, 46, 32),
    r(45, 18, 49, 28, { d: true }),
    r(50, 26, 16, 12),
    l(66, 32, 72, 32),
    r(72, 26, 16, 12, { a: true }),
  ],
  layers: [
    r(6, 8, 62, 12),
    r(6, 26, 62, 12, { a: true }),
    r(6, 44, 62, 12),
    l(82, 10, 82, 44),
    pg("77,42 82,54 87,42", { f: true }),
  ],
  nested: [r(4, 5, 88, 54), r(17, 14, 62, 36), r(31, 23, 34, 18, { a: true })],
  er: [
    r(2, 18, 26, 22),
    r(36, 18, 26, 22),
    r(70, 18, 26, 22, { a: true }),
    l(28, 29, 36, 29),
    l(62, 29, 70, 29),
    // crow's feet on N sides
    l(36, 29, 30, 24, { a: true }),
    l(36, 29, 30, 29, { a: true }),
    l(36, 29, 30, 34, { a: true }),
    l(27, 24, 27, 34),
    l(70, 29, 64, 24, { a: true }),
    l(70, 29, 64, 29, { a: true }),
    l(70, 29, 64, 34, { a: true }),
    l(61, 24, 61, 34),
  ],
  loop: [
    r(14, 6, 22, 12),
    r(60, 6, 22, 12),
    r(60, 46, 22, 12),
    r(14, 46, 22, 12),
    r(34, 24, 28, 16, { a: true }),
    l(36, 12, 60, 12),
    l(71, 18, 71, 46),
    l(60, 52, 36, 52),
    l(25, 46, 25, 18),
    l(48, 24, 48, 18, { a: true, d: true }),
    l(48, 40, 48, 46, { a: true, d: true }),
  ],
  "it-state": [
    r(5, 10, 22, 14),
    r(5, 36, 22, 14),
    r(40, 22, 24, 16, { a: true }),
    r(72, 22, 22, 16),
    l(27, 17, 34, 17),
    l(34, 17, 34, 30),
    l(34, 30, 40, 30),
    l(27, 43, 34, 43),
    l(34, 43, 34, 30),
    l(64, 30, 72, 30),
  ],

  flowchart: [
    r(36, 3, 24, 12),
    l(48, 15, 48, 21),
    pg("48,21 62,32 48,43 34,32"),
    l(34, 32, 18, 32),
    l(18, 32, 18, 48),
    r(4, 48, 28, 12),
    l(62, 32, 78, 32),
    l(78, 32, 78, 48),
    r(64, 48, 28, 12, { a: true }),
  ],
  sequence: [
    r(2, 3, 16, 8),
    r(28, 3, 16, 8),
    r(54, 3, 16, 8, { a: true }),
    r(80, 3, 16, 8),
    l(10, 11, 10, 59, { d: true }),
    l(36, 11, 36, 59, { d: true }),
    l(62, 11, 62, 59, { d: true }),
    l(88, 11, 88, 59, { d: true }),
    l(10, 18, 34, 18),
    pg("34,15 40,18 34,21", { f: true }),
    l(36, 28, 60, 28),
    pg("60,25 66,28 60,31", { a: true, af: true }),
    l(62, 38, 38, 38, { d: true, a: true }),
    pg("38,35 32,38 38,41", { a: true, af: true }),
    l(36, 48, 86, 48),
    pg("86,45 92,48 86,51", { f: true }),
  ],
  process: [
    r(4, 18, 22, 14),
    l(26, 25, 34, 25),
    r(34, 18, 22, 14, { a: true }),
    l(56, 25, 64, 25),
    r(64, 18, 28, 14),
    l(45, 32, 45, 42),
    r(34, 42, 22, 12, { a: true }),
  ],
  // Two dashed scopes, one crossing: the cut is where a role's reach ends.
  "data-flow": [
    r(2, 16, 42, 32, { d: true }),
    r(6, 26, 15, 12, { a: true }),
    r(25, 26, 15, 12, { a: true }),
    l(21, 32, 25, 32),
    r(52, 16, 42, 32, { d: true }),
    r(56, 26, 15, 12),
    r(75, 26, 15, 12),
    l(71, 32, 75, 32),
    l(44, 32, 52, 32, { a: true }),
  ],
  swimlane: [
    l(19, 3, 19, 59),
    l(4, 13, 15, 13),
    l(4, 33, 15, 33),
    l(19, 23, 93, 23, { d: true }),
    l(19, 43, 93, 43, { d: true }),
    r(25, 7, 16, 11),
    r(48, 7, 16, 11),
    r(48, 27, 16, 11),
    r(70, 27, 16, 11, { a: true }),
    r(74, 7, 16, 11, { a: true }),
    l(56, 18, 56, 27),
    l(64, 32, 70, 32),
    l(78, 27, 78, 18),
  ],
  state: [
    c(5, 34, 3, { f: true }),
    l(8, 34, 14, 34),
    c(26, 34, 12),
    c(70, 34, 12),
    p("M37 27 Q48 12 59 27", { a: true }),
    pg("59,27 51,25 55,32", { a: true, af: true }),
    p("M59 41 Q48 56 37 41"),
    pg("37,41 45,43 41,36", { f: true }),
  ],
  tree: [
    r(38, 2, 20, 10),
    l(48, 12, 48, 18),
    l(10, 18, 86, 18),
    l(10, 18, 10, 24),
    l(48, 18, 48, 24),
    l(86, 18, 86, 24),
    r(0, 24, 20, 10),
    r(38, 24, 20, 10),
    r(76, 24, 20, 10),
    l(10, 34, 10, 40),
    l(2, 40, 18, 40),
    l(2, 40, 2, 46),
    l(18, 40, 18, 46),
    r(0, 46, 10, 10),
    r(14, 46, 10, 10),
    l(48, 34, 48, 46),
    r(38, 46, 20, 10),
    l(86, 34, 86, 40),
    l(78, 40, 94, 40),
    l(78, 40, 78, 46),
    l(94, 40, 94, 46),
    r(72, 46, 12, 10, { a: true }),
    r(88, 46, 12, 10),
  ],
  "org-chart": [
    r(38, 2, 20, 10),
    l(48, 12, 48, 18),
    l(14, 18, 82, 18),
    l(14, 18, 14, 24),
    l(82, 18, 82, 24),
    r(4, 24, 20, 10),
    r(72, 24, 20, 10),
    l(14, 34, 14, 40),
    l(82, 34, 82, 40),
    r(4, 40, 20, 10, { a: true }),
    r(72, 40, 20, 10),
    l(24, 45, 72, 45, { d: true }),
  ],
  pyramid: [
    pg("48,4 63,21 33,21", { a: true }),
    pg("32,24 64,24 72,40 24,40"),
    pg("23,43 73,43 82,59 14,59"),
  ],
  medallion: [
    dot(17, 11),
    dot(43, 11),
    dot(51, 11),
    dot(70, 11, { af: true }),
    dot(78, 11, { af: true }),
    dot(86, 11, { af: true }),
    r(5, 21, 24, 20),
    r(35, 21, 24, 20),
    r(66, 21, 24, 20, { a: true }),
    l(29, 31, 35, 31),
    l(59, 31, 66, 31),
  ],

  evidence: [
    r(4, 13, 34, 22),
    l(10, 21, 32, 21),
    l(10, 28, 26, 28),
    p("M50 9 h-6 v42 h6", { a: true }),
    l(56, 15, 90, 15),
    l(56, 24, 80, 24),
    l(56, 33, 88, 33),
    l(56, 42, 72, 42),
  ],
  comparison: [
    l(48, 3, 48, 59, { a: true }),
    l(6, 15, 38, 30),
    l(6, 30, 38, 15),
    l(6, 44, 38, 44),
    r(58, 13, 30, 8),
    r(58, 28, 30, 8),
    r(58, 43, 30, 8),
  ],
  quadrant: [
    l(6, 33, 90, 33),
    l(48, 4, 48, 60),
    dot(26, 19),
    dot(31, 47),
    dot(66, 17, { af: true }),
    dot(70, 45),
    dot(59, 24),
  ],
  venn: [
    c(37, 32, 20),
    c(59, 32, 20),
    p("M48 13.4 A20 20 0 0 0 48 50.6 A20 20 0 0 0 48 13.4", { a: true, af: true }),
  ],
  timeline: [
    l(4, 32, 92, 32),
    l(16, 28, 16, 36),
    l(36, 28, 36, 36),
    l(56, 28, 56, 36),
    l(76, 28, 76, 36),
    dot(16, 18),
    dot(36, 18),
    dot(56, 18, { af: true }),
    dot(76, 18),
    l(10, 46, 22, 46),
    l(30, 46, 42, 46),
    l(50, 46, 62, 46),
    l(70, 46, 82, 46),
  ],
  gantt: [
    l(26, 4, 26, 60, { d: true }),
    l(50, 4, 50, 60, { d: true }),
    l(74, 4, 74, 60, { d: true }),
    r(6, 11, 40, 9),
    r(28, 26, 44, 9),
    r(46, 41, 36, 9, { a: true }),
  ],

  bar: [
    l(6, 55, 92, 55),
    r(13, 31, 14, 24),
    r(33, 21, 14, 34),
    r(53, 39, 14, 16),
    r(73, 10, 14, 45, { a: true }),
  ],
  line: [
    l(8, 55, 92, 55),
    l(8, 55, 8, 6),
    pl("14,45 32,33 50,39 68,20 88,11", { a: true }),
    dot(14, 45),
    dot(32, 33),
    dot(50, 39),
    dot(68, 20),
    dot(88, 11),
  ],
  scatter: [
    l(9, 55, 92, 55),
    l(9, 55, 9, 6),
    l(16, 49, 86, 15, { a: true, d: true }),
    dot(22, 46),
    dot(31, 40),
    dot(37, 45),
    dot(46, 34),
    dot(54, 28),
    dot(63, 31),
    dot(71, 21),
    dot(80, 16),
  ],
  radar: [
    pg("48,7 69,19 69,44 48,56 27,44 27,19"),
    l(48, 7, 48, 56),
    l(27, 19, 69, 44),
    pg("48,16 61,24 57,43 47,46 35,38 38,24", { a: true, af: true }),
  ],

  "dp-integration": [
    r(3, 6, 16, 11),
    r(3, 26, 16, 11),
    r(3, 46, 16, 11),
    r(37, 21, 22, 21, { a: true }),
    r(77, 6, 16, 11),
    r(77, 26, 16, 11),
    r(77, 46, 16, 11),
    l(19, 12, 37, 27),
    l(19, 32, 37, 32),
    l(19, 51, 37, 37),
    l(59, 27, 77, 12),
    l(59, 32, 77, 32),
    l(59, 37, 77, 51),
  ],
  "dp-security-matrix": [
    r(7, 9, 82, 45),
    l(27, 9, 27, 54),
    l(48, 9, 48, 54),
    l(68, 9, 68, 54),
    l(7, 24, 89, 24),
    l(7, 39, 89, 39),
    r(27, 9, 21, 15, { a: true, af: true }),
    r(48, 39, 20, 15, { a: true, af: true }),
  ],
};

export const FAMILIES = [
  {
    id: "structure",
    question: "what contains what",
    types: [
      ["architecture", "Architecture", "components + boundaries"],
      ["high-level", "High-level", "end-to-end path"],
      ["layers", "Layers", "stacked abstractions"],
      ["nested", "Nested", "containment hierarchy"],
      ["er", "ER", "entities + cardinality"],
      ["it-state", "IT current-state", "legacy landscape", "IT state"],
    ],
  },
  {
    id: "flow",
    question: "what happens, in order",
    types: [
      ["flowchart", "Flowchart", "branching decisions"],
      ["sequence", "Sequence", "messages over time"],
      ["process", "Process", "multi-step workflow"],
      ["data-flow", "Data flow", "role-scoped pipeline"],
      ["swimlane", "Swimlane", "cross-functional flow"],
      ["state", "State", "modes + transitions"],
      ["loop", "Loop", "flywheel + hub"],
    ],
  },
  {
    id: "hierarchy",
    question: "what ranks above what",
    types: [
      ["tree", "Tree", "parent → children"],
      ["org-chart", "Org chart", "ownership + routing"],
      ["pyramid", "Pyramid", "ranked hierarchy"],
      ["medallion", "Medallion", "bronze / silver / gold"],
    ],
  },
  {
    id: "argument",
    question: "what is claimed, and why",
    types: [
      ["evidence", "Evidence", "proof beside claim"],
      ["comparison", "Comparison", "before / after"],
      ["quadrant", "Quadrant", "two-axis positioning"],
      ["venn", "Venn", "set overlap"],
    ],
  },
  {
    id: "measure",
    question: "how much, and which way",
    types: [
      ["bar", "Bar chart", "categorical comparison"],
      ["line", "Line chart", "trend over time"],
      ["scatter", "Scatter", "distribution + correlation"],
      ["radar", "Radar", "multi-axis comparison"],
    ],
  },
  {
    id: "time",
    question: "when, and for how long",
    types: [
      ["timeline", "Timeline", "events on an axis"],
      ["gantt", "Gantt", "phases on a timeline"],
    ],
  },
  {
    id: "platform",
    question: "who may touch which data",
    types: [
      ["dp-integration", "DP integration", "sources → core → consumers", "Integration"],
      ["dp-security-matrix", "DP security matrix", "role × dataset", "Security matrix"],
    ],
  },
];

export const TYPES = FAMILIES.flatMap((family) =>
  family.types.map(([slug, name, grammar]) => ({ slug, name, grammar, family: family.id })),
);

export function glyph(slug) {
  const body = GLYPHS[slug];
  if (!body) throw new Error(`no glyph for type: ${slug}`);
  return `<svg viewBox="0 0 96 64" role="img" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body.join("")}</svg>`;
}

export const GLYPH_CSS = `
.glyph svg { display: block; width: 100%; height: auto; }
.glyph .a { stroke: var(--accent); }
.glyph .d { stroke-dasharray: 4 4; }
.glyph .f { fill: currentColor; stroke: none; }
.glyph .af { fill: var(--accent); fill-opacity: 0.16; stroke: var(--accent); }
`.trim();

export const FIXTURE_URL = (slug) =>
  `https://github.com/isatimur/excalidraw-skill-pack/blob/main/packages/shared/fixtures/types/${slug}/example.excalidraw`;
