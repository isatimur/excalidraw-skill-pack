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
    layout: "Group by tier or trust boundary. Primary flow left→right. One accent on the primary store. Put at least one actor outside the zone so the boundary excludes something.",
    pattern: "Draft `excalidraw-skeleton`. Dashed zone for VPC/trust; free zone label at top-left. Rectangles for deployable components. Free text for edge labels above shafts.",
    routing: "Orthogonal `points` only. Solid for data; dashed for control. Bridge the less important arrow at crossings.",
    avoid: "Microservice wallpaper, unnamed arrows, a zone that contains everything, bound labels jammed onto short shafts.",
    budget: "5–9 primary components; one evidence card per critical boundary.",
  },
  flowchart: {
    title: "Flowchart",
    best: "branching decisions, approval paths, error handling.",
    layout: "Single dominant direction. Ellipse for start/end, diamond for decisions, rectangle for actions. Side-exit the diamond then drop — never diagonal through air.",
    pattern: "Prefer skeleton: `ellipse` trigger, `diamond` decision, `rectangle` action. Free text for Yes/No beside the elbows. Dashed Fix→audit retry so reject is a loop, not a dead end.",
    routing: "Orthogonal arrow paths; never diagonal through nodes.",
    avoid: "More than one decision diamond without merge; orphan reject branches that never re-enter.",
    budget: "≤7 nodes for a single decision story.",
  },
  sequence: {
    title: "Sequence",
    best: "messages over time, protocol flows, OAuth handshakes.",
    layout: "Participants as top-row boxes; time flows downward. Group related messages.",
    pattern: "Skeleton rectangles for lifelines. Free-floating text for message labels placed ABOVE the shaft — bound labels collide at Cascadia width. A cache-miss return (dashed, accent) before the write makes the path an argument.",
    routing: "Horizontal arrows for requests; return messages offset vertically and dashed.",
    avoid: "Mixing architecture boxes with sequence timing; a four-message wallpaper with no miss/fail branch.",
    budget: "≤5 participants; ≤12 messages per diagram.",
  },
  state: {
    title: "State machine",
    best: "allowed modes, lifecycle, workflow status.",
    layout: "States as rectangles; transitions labeled with the event. Entry dot into the first state. Highlight terminal/live with theme success fill.",
    pattern: "Skeleton rectangles + free labels on transitions. Rejection is an orthogonal under-loop, not a diagonal.",
    routing: "Prefer left→right progression; ban illegal shortcuts in a caption.",
    avoid: "States without incoming or outgoing edges unless truly terminal; Draft→Live without Review.",
    budget: "≤7 states.",
  },
  er: {
    title: "ER / data model",
    best: "entities, relationships, cardinality.",
    layout: "Entities as rectangles with key fields in bound labels. Crow's-foot marks on the N side; free `1:N` labels above the shaft.",
    pattern: "Skeleton rectangles; relationship shafts as plain `line`s (hydrated arrows still grow tips that paint over feet); crow's foot + one-bar drawn as short lines on the N edge.",
    routing: "Minimize crossing; stack related entities.",
    avoid: "Full field lists when a table would be faster; default arrowheads covering crow's feet.",
    budget: "≤6 entities.",
  },
  timeline: {
    title: "Timeline",
    best: "events on an axis, roadmap milestones.",
    layout: "Horizontal axis with event markers above/below. Accent the pivotal event only. Phase brackets under the axis carry duration, not just dots.",
    pattern: "Free-floating text + ellipse or line markers on the axis; bracket spans between milestones.",
    routing: "Chronological left→right.",
    avoid: "Dense date tables redrawn as a diagram; milestones with no phase story.",
    budget: "≤8 milestones.",
  },
  gantt: {
    title: "Gantt",
    best: "phases, parallel workstreams, delivery windows.",
    layout: "Time on X; stacked bars for phases. Offset bars to show overlap. Mark today with an accent vertical rule. Owner labels left of each bar.",
    pattern: "Rectangles as bars with concrete deliverables; free-floating owner + period labels; dashed week gridlines.",
    routing: "Align bar baselines to a shared timeline row.",
    avoid: "Sub-day precision when a calendar suffices; no now-line, which shows the plan but never whether it holds.",
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
    routing: "Label axes with what increases/decreases on each dimension, and name each quadrant with the verdict it carries (`do now`, `drop`).",
    avoid: "Exact numeric scores (use scatter or a table); leaving the unflattering quadrant empty, which dodges the decision the chart exists to force.",
    budget: "≤8 positioned items.",
  },
  loop: {
    title: "Loop / flywheel",
    best: "recurring systems, feedback loops, compound engines.",
    layout: "Hub in center (accent). Four equal stations on a rectangle. Clockwise orthogonal edges.",
    pattern: "Central memory/hub; outer stations; free edge labels; dashed spokes into the hub.",
    routing: "Pure H/V arrows between stations; never a diagonal star into the hub.",
    avoid: "Bidirectional arrows without semantic difference; unlabeled flywheel edges.",
    budget: "≤6 stations + hub.",
  },
  process: {
    title: "Process",
    best: "multi-step workflows, ETL stages, pipelines.",
    layout: "Strict left→right transforms with concrete artifacts per stage. Accent the judgment stage.",
    pattern: "Skeleton rectangles chained by arrows; free handoff labels; optional DQ quarantine branch.",
    routing: "One arrow per handoff; orthogonal drop for failure paths.",
    avoid: "Checklist steps redrawn as bare verbs with no artifact.",
    budget: "≤7 stages.",
  },
  layers: {
    title: "Layer stack",
    best: "stacked abstractions, OSI-style tiers.",
    layout: "Wide horizontal bands, top = highest abstraction. Keep every band the same width; tapering them reads as a pyramid. Name modules inside each band.",
    pattern: "Equal-width stacked rectangles, one accent band for the layer under discussion.",
    routing: "Downward `depends on` arrow; dashed forbidden upward call on the other side.",
    avoid: "More than 5 layers in one figure; a stack with no direction, which claims nothing.",
    budget: "3–5 layers.",
  },
  nested: {
    title: "Nested",
    best: "containment hierarchy, scope boundaries.",
    layout: "Outer zone contains inner zones/components. Free zone labels at top-left. Put an actor outside the outer zone.",
    pattern: "Dashed zone rectangles; leaf components as solid rectangles inside. Gateway as the edge of the platform; Worker beside Service A; API→Cache hit inside the service.",
    routing: "Arrows only when crossing a boundary matters; free protocol labels above shafts; keep Gateway/API on one row for a pure horizontal route.",
    avoid: "Deep nesting >3 levels (split views); a Platform that contains the Client.",
    budget: "≤3 containment levels.",
  },
  medallion: {
    title: "Medallion",
    best: "bronze/silver/gold data tiers, lakehouse zones.",
    layout: "Left→right tier progression with accent on gold/curated tier. Name a concrete table under each tier and who owns it.",
    pattern: "Rectangles per tier; free transform labels (`dedupe + types`, `aggregate`) above shafts.",
    routing: "Single pipeline direction.",
    avoid: "Mixing medallion with generic ETL jargon boxes; bare Bronze/Silver/Gold with no contract.",
    budget: "3 tiers + ownership captions.",
  },
  tree: {
    title: "Tree",
    best: "parent→child branching, taxonomies.",
    layout: "Root top-center; children fan below on a shared rail. Orthogonal connectors. Show enough mid-nodes that depth reads as grammar.",
    pattern: "Root rectangle; mid packages on one rail; leaf forks under each; one accent leaf.",
    routing: "Single parent per child; shared H rail then V drops — never diagonal spokes.",
    avoid: "Cross-links (use relationship map type); a two-node fork that looks like an org chart.",
    budget: "≤3 levels, ≤10 nodes visible.",
  },
  "org-chart": {
    title: "Org chart",
    best: "reporting lines, ownership, routing.",
    layout: "Top-down hierarchy. Single reporting tree per diagram.",
    pattern: "Rectangles for roles; solid downward arrows for reporting, dashed for the routing the tree hides (who a team actually asks).",
    routing: "Center children under parent. Label every dashed edge with the ask.",
    avoid: "Matrix reporting without annotation; a plain tree when the point was routing.",
    budget: "≤10 nodes.",
  },
  venn: {
    title: "Venn",
    best: "set overlap, shared capabilities.",
    layout: "2–3 overlapping ellipses max. Accent lens on the overlap. Exclusive callouts outside the circles.",
    pattern: "Ellipses with theme fills; free labels in exclusive lobes; caption under the lens.",
    routing: "N/A",
    avoid: "More than 3 sets; exclusive labels parked on top of filled ellipses.",
    budget: "2–3 sets.",
  },
  pyramid: {
    title: "Pyramid / funnel",
    best: "ranked hierarchy, funnel drop-off.",
    layout: "Apex = most abstract/strategic. Widening bands downward. Side callouts pin each band to a concrete ask.",
    pattern: "Trapezoid tiers as closed `line` polygons with centred free text. Stacked rectangles read as a bar stack, not a pyramid.",
    routing: "Top-down reading order; caption what fails when inverted.",
    avoid: "Equal-width bands (that's layers); bare tier names with no argument.",
    budget: "3–5 tiers.",
  },
  evidence: {
    title: "Evidence pipeline",
    best: "proof beside claims, API payloads, metric cards.",
    layout: "Claim box opposite evidence artifact. Free `proves` label. Gate caption under the claim.",
    pattern: "Evidence as a dated monospace JSON/snippet rectangle with source line above.",
    routing: "Evidence points at claim, not decorative placement.",
    avoid: "Placeholder lorem; a single metric with no suite, RPS, or pass mark.",
    budget: "1–3 claims per diagram.",
  },
  comparison: {
    title: "Comparison",
    best: "before/after, option A vs B, competitor contrast.",
    layout: "Two columns with matched vertical rhythm. Accent the preferred column only. One row per question, asked of both columns, with the question in a left rail.",
    pattern: "Paired rectangles; column headers as free-floating titles.",
    routing: "No crossing arrows between columns unless showing migration.",
    avoid: "More than two options without a matrix/table; two columns of unrelated claims, which contrast nothing.",
    budget: "≤5 rows per column.",
  },
  "high-level": {
    title: "High-level",
    best: "end-to-end path across one cluster, executive overview.",
    layout: "The full path left→right, with the zone drawn around only what you operate. Leave the upstream hops (browser, CDN) outside it.",
    pattern: "Zone rectangle + 3–7 components; free protocol labels above shafts.",
    routing: "Primary path horizontal; fan to datastores via orthogonal elbows, never diagonal spokes.",
    avoid: "A zone that contains everything; diagonal App→DB/Redis spokes.",
    budget: "≤7 components inside zone.",
  },
  "it-state": {
    title: "IT current-state",
    best: "legacy landscape, modernization snapshots.",
    layout: "Legacy on left, target/SaaS on right; ESB/bridge in the middle as the accent finding.",
    pattern: "Fan sources into the bus on an orthogonal rail; name the choke in a caption.",
    routing: "Shared vertical rail into the ESB — no converging diagonals.",
    avoid: "Wallpaper of apps with no single finding.",
    budget: "≤6 systems.",
  },
  "data-flow": {
    title: "Data flow",
    best: "role-scoped pipelines, analytics paths.",
    layout: "Stages left→right, cut by dashed scope boxes where one role's reach ends. Accent the stages the role may not touch.",
    pattern: "Rectangles per stage; solid transform arrows; a dashed rectangle per scope with its label at the top-left edge.",
    routing: "Label stage outputs briefly, and label the arrow that crosses a scope with what changes there (`masked`).",
    avoid: "Generic cloud icons without names; naming the role in a caption instead of drawing where it stops.",
    budget: "≤6 stages.",
  },
  "dp-integration": {
    title: "DP integration",
    best: "sources → lakehouse → consumers.",
    layout: "Three-column topology. Accent the core platform.",
    pattern: "Sources, core, consumers as rectangles; fan-in/fan-out via orthogonal rails.",
    routing: "Shared vertical trunk into/out of the core — never diagonal spokes.",
    avoid: "Diagonal fan-in; security matrix detail here (use dp-security-matrix).",
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
    layout: "Baseline at bottom; bars upward. Accent the bar you want read first. Two or three muted gridlines with tick labels, plus the value above each bar.",
    pattern: "Rectangles as bars; category labels below; gridlines as thin `line` elements behind the bars.",
    routing: "Even spacing; shared baseline.",
    avoid: "3D effects or gradient fills; bars with no scale, which rank the categories but never say by how much.",
    budget: "≤8 categories.",
  },
  line: {
    title: "Line chart",
    best: "trends over time, KPI movement.",
    layout: "Axes plus two muted gridlines carrying units. Dots on each reading, and the last value called out beside the endpoint.",
    pattern: "Series as an open `line` polyline (last point must not return to the first, or it fills); axes and gridlines as thin `line` elements.",
    routing: "Time left→right.",
    avoid: "Exact data points without source; a trend with no scale, which shows the shape but not the size.",
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
