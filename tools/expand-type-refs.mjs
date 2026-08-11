#!/usr/bin/env node
/**
 * Expand packages/core/references/types/*.md with fixture links and deeper grammar.
 */
import { writeFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const TYPES_DIR = join(ROOT, "packages", "core", "references", "types");
const REPO = "https://github.com/isatimur/excalidraw-skill-pack/blob/main";

const META = {
  architecture: {
    title: "Architecture",
    best: "system overviews, integration maps, infra topology, trust boundaries.",
    layout: "Group by tier or trust boundary. Primary flow left→right or top→down. One accent on the integration point or primary store.",
    pattern: "Draft `excalidraw-skeleton`. Use dashed zone rectangles for VPC/trust regions. Rectangles for deployable components. Arrows with orthogonal `points` only.",
    routing: "Draw arrows before boxes when possible. Solid for data; dashed (theme connector stroke) for control. Bridge the less important arrow at crossings.",
    avoid: "Microservice wallpaper, unnamed arrows, equal-size boxes all in accent.",
    budget: "5–9 primary components; one evidence card per critical boundary.",
  },
  flowchart: {
    title: "Flowchart",
    best: "branching decisions, approval paths, error handling.",
    layout: "Single dominant direction. Ellipse for start/end, diamond for decisions, rectangle for actions.",
    pattern: "Prefer skeleton: `ellipse` trigger, `diamond` decision, `rectangle` action. Label edges with the condition that fires.",
    routing: "Orthogonal arrow paths; never diagonal through nodes.",
    avoid: "More than one decision diamond without merge; orphan branches.",
    budget: "≤7 nodes for a single decision story.",
  },
  sequence: {
    title: "Sequence",
    best: "messages over time, protocol flows, OAuth handshakes.",
    layout: "Participants as top-row boxes; time flows downward. Group related messages.",
    pattern: "Skeleton rectangles for lifelines. Free-floating text for message labels placed between participants.",
    routing: "Horizontal arrows for requests; return messages offset vertically.",
    avoid: "Mixing architecture boxes with sequence timing.",
    budget: "≤5 participants; ≤12 messages per diagram.",
  },
  state: {
    title: "State machine",
    best: "allowed modes, lifecycle, workflow status.",
    layout: "States as rectangles; transitions labeled with the event. Highlight terminal/live states with theme success fill.",
    pattern: "Skeleton rectangles + labeled arrows. No container labels on states unless the state IS a zone.",
    routing: "Prefer left→right progression for readability.",
    avoid: "States without incoming or outgoing edges unless truly terminal.",
    budget: "≤7 states.",
  },
  er: {
    title: "ER / data model",
    best: "entities, relationships, cardinality.",
    layout: "Entities as rectangles with key fields in bound labels. Relationships as labeled arrows.",
    pattern: "Skeleton rectangles; cardinality on arrow labels (`1:N`, `N:M`).",
    routing: "Minimize crossing; stack related entities.",
    avoid: "Full field lists when a table would be faster.",
    budget: "≤6 entities.",
  },
  timeline: {
    title: "Timeline",
    best: "events on an axis, roadmap milestones.",
    layout: "Horizontal axis with event markers above/below. Accent the pivotal event only.",
    pattern: "Free-floating text + ellipse or line markers on the axis.",
    routing: "Chronological left→right.",
    avoid: "Dense date tables redrawn as a diagram.",
    budget: "≤8 milestones.",
  },
  gantt: {
    title: "Gantt",
    best: "phases, parallel workstreams, delivery windows.",
    layout: "Time on X; stacked bars for phases. Offset bars to show overlap.",
    pattern: "Rectangles as bars; free-floating phase labels.",
    routing: "Align bar baselines to a shared timeline row.",
    avoid: "Sub-day precision when a calendar suffices.",
    budget: "≤6 bars.",
  },
  swimlane: {
    title: "Swimlane",
    best: "cross-functional handoffs, RACI flows.",
    layout: "Horizontal lanes per role/team. Steps flow left→right within and across lanes.",
    pattern: "Dashed zone rectangles for lanes. Steps as rectangles; handoff arrows cross lane boundaries orthogonally.",
    routing: "Enter/exit lanes at lane centerlines.",
    avoid: "More than 4 lanes (split diagrams).",
    budget: "≤6 steps per lane.",
  },
  quadrant: {
    title: "Quadrant",
    best: "two-axis positioning, prioritization matrices.",
    layout: "Axes as free-floating labels. Items as ellipses or small rectangles in quadrants.",
    pattern: "Light quadrant grid optional; accent only the hero item.",
    routing: "Label axes with what increases/decreases on each dimension.",
    avoid: "Exact numeric scores (use scatter or a table).",
    budget: "≤8 positioned items.",
  },
  loop: {
    title: "Loop / flywheel",
    best: "recurring systems, feedback loops, compound engines.",
    layout: "Hub in center (accent). Stations around the hub. Clockwise flow when possible.",
    pattern: "Central rectangle as memory/hub; outer stations as rectangles; curved or orthogonal return paths.",
    routing: "Dashed arrows for write-backs; solid for primary flow.",
    avoid: "Bidirectional arrows without semantic difference.",
    budget: "≤6 stations + hub.",
  },
  process: {
    title: "Process",
    best: "multi-step workflows, ETL stages, pipelines.",
    layout: "Strict left→right or top→down sequence of transforms.",
    pattern: "Skeleton rectangles chained by arrows.",
    routing: "One arrow per handoff; label only non-obvious transforms.",
    avoid: "Checklist steps redrawn as boxes.",
    budget: "≤7 stages.",
  },
  layers: {
    title: "Layer stack",
    best: "stacked abstractions, OSI-style tiers.",
    layout: "Wide horizontal bands, top = highest abstraction. Indent or offset for depth cue.",
    pattern: "Stacked rectangles with decreasing width optional.",
    routing: "Downward dependency arrows on the side.",
    avoid: "More than 5 layers in one figure.",
    budget: "3–5 layers.",
  },
  nested: {
    title: "Nested",
    best: "containment hierarchy, scope boundaries.",
    layout: "Outer zone contains inner zones/components. Labels on zone boundaries.",
    pattern: "Dashed zone rectangles; leaf components as solid rectangles inside.",
    routing: "No arrows unless crossing boundary matters.",
    avoid: "Deep nesting >3 levels (split views).",
    budget: "≤3 containment levels.",
  },
  medallion: {
    title: "Medallion",
    best: "bronze/silver/gold data tiers, lakehouse zones.",
    layout: "Left→right tier progression with accent on gold/curated tier.",
    pattern: "Rectangles per tier; transform arrows labeled `raw→clean→mart`.",
    routing: "Single pipeline direction.",
    avoid: "Mixing medallion with generic ETL jargon boxes.",
    budget: "3 tiers + sources/sinks.",
  },
  tree: {
    title: "Tree",
    best: "parent→child branching, taxonomies.",
    layout: "Root top-center; children fan below. Orthogonal connectors.",
    pattern: "Root rectangle; child rectangles; tree arrows without diagonal spaghetti.",
    routing: "Single parent per child.",
    avoid: "Cross-links (use relationship map type).",
    budget: "≤3 levels, ≤7 nodes visible.",
  },
  "org-chart": {
    title: "Org chart",
    best: "reporting lines, ownership, routing.",
    layout: "Top-down hierarchy. Single reporting tree per diagram.",
    pattern: "Rectangles for roles; downward arrows.",
    routing: "Center children under parent.",
    avoid: "Matrix reporting without annotation.",
    budget: "≤10 nodes.",
  },
  venn: {
    title: "Venn",
    best: "set overlap, shared capabilities.",
    layout: "2–3 overlapping ellipses max. Label overlap region explicitly.",
    pattern: "Ellipses with partial transparency via theme fills, not opacity hacks.",
    routing: "N/A",
    avoid: "More than 3 sets.",
    budget: "2–3 sets.",
  },
  pyramid: {
    title: "Pyramid / funnel",
    best: "ranked hierarchy, funnel drop-off.",
    layout: "Apex = most abstract/strategic. Widening bands downward.",
    pattern: "Stacked rectangles with decreasing width upward.",
    routing: "Top-down reading order.",
    avoid: "Equal-width bands (that's layers).",
    budget: "3–5 tiers.",
  },
  evidence: {
    title: "Evidence pipeline",
    best: "proof beside claims, API payloads, metric cards.",
    layout: "Claim box opposite evidence artifact. Arrow labeled `proves` or `shows`.",
    pattern: "Evidence as monospace-friendly text block or JSON snippet in a rectangle.",
    routing: "Evidence points at claim, not decorative placement.",
    avoid: "Placeholder lorem in evidence blocks.",
    budget: "1–3 claims per diagram.",
  },
  comparison: {
    title: "Comparison",
    best: "before/after, option A vs B, competitor contrast.",
    layout: "Two columns with matched vertical rhythm. Accent the preferred column only.",
    pattern: "Paired rectangles; column headers as free-floating titles.",
    routing: "No crossing arrows between columns unless showing migration.",
    avoid: "More than two options without a matrix/table.",
    budget: "≤5 rows per column.",
  },
  "high-level": {
    title: "High-level",
    best: "end-to-end stack on one cluster, executive overview.",
    layout: "Single zone (cluster/VPC) containing the full path left→right.",
    pattern: "Zone rectangle + 3–7 components; minimal labels.",
    routing: "One primary path; no nested detail.",
    avoid: "Low-level protocol annotations.",
    budget: "≤7 components inside zone.",
  },
  "it-state": {
    title: "IT current-state",
    best: "legacy landscape, modernization snapshots.",
    layout: "Legacy on left, target/SaaS on right; bridges in middle muted.",
    pattern: "Rectangles per system; batch/API arrows labeled.",
    routing: "Left→right time or maturity progression.",
    avoid: "Future-state detail (split diagram).",
    budget: "≤8 systems.",
  },
  "data-flow": {
    title: "Data flow",
    best: "role-scoped pipelines, analytics paths.",
    layout: "Stages left→right; role eyebrow as free-floating text above.",
    pattern: "Rectangles per stage; solid transform arrows.",
    routing: "Label stage outputs briefly.",
    avoid: "Generic cloud icons without names.",
    budget: "≤6 stages.",
  },
  "dp-integration": {
    title: "DP integration",
    best: "sources → lakehouse → consumers.",
    layout: "Three-column topology. Accent the core platform.",
    pattern: "Sources, core, consumers as rectangles; fan-in/fan-out arrows.",
    routing: "Multiple sources may converge; label integration mode.",
    avoid: "Security matrix detail here (use dp-security-matrix).",
    budget: "≤3 sources, ≤3 consumers.",
  },
  "dp-security-matrix": {
    title: "DP security matrix",
    best: "role × dataset permissions.",
    layout: "Grid as labeled rows; columns as datasets. Use table if >4×4.",
    pattern: "Wide rectangles per row or ASCII-style grid with monospace labels.",
    routing: "N/A",
    avoid: "Redrawing a spreadsheet with 20 columns.",
    budget: "≤6 roles × 4 datasets.",
  },
  bar: {
    title: "Bar chart",
    best: "categorical comparison, quarterly snapshots.",
    layout: "Baseline at bottom; bars upward. Accent the bar you want read first.",
    pattern: "Rectangles as bars; category labels below.",
    routing: "Even spacing; shared baseline.",
    avoid: "3D effects or gradient fills.",
    budget: "≤8 categories.",
  },
  line: {
    title: "Line chart",
    best: "trends over time, KPI movement.",
    layout: "Trend annotation + axis line. Prefer sparkline simplicity in diagrams.",
    pattern: "Axis as thin rectangle or line element; trend as text callout if line path is heavy.",
    routing: "Time left→right.",
    avoid: "Exact data points without source.",
    budget: "1–2 series.",
  },
  scatter: {
    title: "Scatter plot",
    best: "distribution, correlation clusters.",
    layout: "Ellipses as points; optional trend callout.",
    pattern: "Small ellipses; accent outliers only.",
    routing: "Label axes with measured dimensions.",
    avoid: "Dense point clouds (aggregate or table).",
    budget: "≤12 points.",
  },
  radar: {
    title: "Radar / spider",
    best: "multi-axis capability comparison.",
    layout: "Web/spoke grid with one polygon or labeled axes.",
    pattern: "Ellipse as boundary; axis labels outside.",
    routing: "Consistent axis order clockwise.",
    avoid: "More than 8 axes.",
    budget: "≤6 axes.",
  },
};

function render(type, m) {
  const fixture = `${REPO}/packages/shared/fixtures/types/${type}/example.excalidraw`;
  const png = `https://excalidraw-skill-pack.vercel.app/images/types/${type}.png`;
  return `# ${m.title}

**Best for:** ${m.best}

## Layout conventions
${m.layout}

## Excalidraw pattern
${m.pattern}

## Connectors & routing
${m.routing}

## Anti-patterns
${m.avoid}

## Budget
${m.budget}

## Example
- Fixture: [\`packages/shared/fixtures/types/${type}/example.excalidraw\`](${fixture})
- Rendered: [gallery PNG](${png})
`;
}

async function main() {
  for (const [type, meta] of Object.entries(META)) {
    const path = join(TYPES_DIR, `type-${type}.md`);
    await writeFile(path, render(type, meta));
    console.log(`expanded type-${type}.md`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
