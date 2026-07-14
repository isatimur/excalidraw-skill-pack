---
name: excalidraw-diagram
description: Create Excalidraw diagrams as `.excalidraw` JSON that make a visual argument — not just labeled boxes. Use when the user wants to draw, sketch, visualize, or diagram a system architecture, software design, workflow, flowchart, sequence, data flow, state machine, pipeline, org chart, mind map, concept map, network topology, or process — in a hand-drawn, sketchy whiteboard style. Produces valid, themeable `.excalidraw` files that render to PNG and open in Excalidraw, Obsidian, or VS Code. Triggers on phrases like "make a diagram", "draw the architecture", "visualize this", "excalidraw", "flowchart", "system design diagram", "sketch this out", or "whiteboard it".
license: MIT
metadata:
  homepage: https://excalidraw-skill-pack.vercel.app
  repository: https://github.com/isatimur/excalidraw-skill-pack
  keywords: [excalidraw, diagram, flowchart, architecture-diagram, system-design, visualization, whiteboard, sketch, diagram-as-code, mind-map]
---

# Excalidraw Diagram Creator

Generate `.excalidraw` JSON files that **argue visually**, not just display information.

**Setup:** If the user asks you to set up this skill (renderer, dependencies, etc.), use the installed adapter docs or the project README.

## Output Contract

When you create or edit a diagram:

1. Produce a valid `.excalidraw` JSON file, not a prose-only answer.
2. Use this envelope: `type`, `version`, `source`, `elements`, `appState`, and `files`.
3. If the user names an output path, write there. Otherwise use `./diagram.excalidraw`.
4. Prefer the active theme for all color, typography, element, and layout decisions.
5. Render and inspect the PNG when a renderer is available. Fix visible defects before stopping.
6. In the final response, report the `.excalidraw` path, rendered image path if created, theme used, and any validation caveats.

Do not add nonstandard Excalidraw properties such as `label`. Labels are text elements. For shape labels, bind a text element to the container with `containerId`, and keep the text element immediately after its container in `elements`.

## Customization

**All colors, typography, and layout rules live in the active theme.** Themes are standalone packages: `default-sketchy` is bundled in core; additional themes ship as `@excalidraw-skill-pack/theme-*` (npm) or `excalidraw-skill-pack-theme-*` (PyPI).

The active theme is resolved per call (`--theme` flag), per project (`.excalidraw-skill-pack.json`), or globally (`~/.excalidraw-skill-pack/config.json`). The MCP server's `generate_diagram_prompt` tool splices the active theme's `palette.md` and any requested `layouts/<template>.md` into the agent's system prompt at call time.

To author a new theme: `npx @excalidraw-skill-pack/create-theme my-brand`. See `https://excalidraw-skill-pack.vercel.app/themes/create`.

---

## Core Philosophy

**Diagrams ARGUE, not DISPLAY.**

A diagram isn't formatted text. It's a visual argument that shows relationships, causality, and flow that words alone can't express. The shape should BE the meaning.

**The Isomorphism Test**: If you removed all text, would the structure alone communicate the concept? If not, redesign.

**The Education Test**: Could someone learn something concrete from this diagram, or does it just label boxes? A good diagram teaches—it shows actual formats, real event names, concrete examples.

---

## Depth Assessment (Do This First)

Before designing, determine what level of detail this diagram needs:

### Simple/Conceptual Diagrams
Use abstract shapes when:
- Explaining a mental model or philosophy
- The audience doesn't need technical specifics
- The concept IS the abstraction (e.g., "separation of concerns")

### Comprehensive/Technical Diagrams
Use concrete examples when:
- Diagramming a real system, protocol, or architecture
- The diagram will be used to teach or explain (e.g., YouTube video)
- The audience needs to understand what things actually look like
- You're showing how multiple technologies integrate

**For technical diagrams, you MUST include evidence artifacts** (see below).

---

## Research Mandate (For Technical Diagrams)

**Before drawing anything technical, research the actual specifications.**

If you're diagramming a protocol, API, or framework:
1. Look up the actual JSON/data formats
2. Find the real event names, method names, or API endpoints
3. Understand how the pieces actually connect
4. Use real terminology, not generic placeholders

Bad: "Protocol" → "Frontend"
Good: "AG-UI streams events (RUN_STARTED, STATE_DELTA, A2UI_UPDATE)" → "CopilotKit renders via createA2UIMessageRenderer()"

**Research makes diagrams accurate AND educational.**

---

## Evidence Artifacts

Evidence artifacts are concrete examples that prove your diagram is accurate and help viewers learn. Include them in technical diagrams.

**Types of evidence artifacts** (choose what's relevant to your diagram):

| Artifact Type | When to Use | How to Render |
|---------------|-------------|---------------|
| **Code snippets** | APIs, integrations, implementation details | Dark rectangle + syntax-colored text (see color palette for evidence artifact colors) |
| **Data/JSON examples** | Data formats, schemas, payloads | Dark rectangle + colored text (see color palette) |
| **Event/step sequences** | Protocols, workflows, lifecycles | Timeline pattern (line + dots + labels) |
| **UI mockups** | Showing actual output/results | Nested rectangles mimicking real UI |
| **Real input content** | Showing what goes IN to a system | Rectangle with sample content visible |
| **API/method names** | Real function calls, endpoints | Use actual names from docs, not placeholders |

**Example**: For a diagram about a streaming protocol, you might show:
- The actual event names from the spec (not just "Event 1", "Event 2")
- A code snippet showing how to connect
- What the streamed data actually looks like

**Example**: For a diagram about a data transformation pipeline:
- Show sample input data (actual format, not "Input")
- Show sample output data (actual format, not "Output")
- Show intermediate states if relevant

The key principle: **show what things actually look like**, not just what they're called.

---

## Multi-Zoom Architecture

Comprehensive diagrams operate at multiple zoom levels simultaneously. Think of it like a map that shows both the country borders AND the street names.

### Level 1: Summary Flow
A simplified overview showing the full pipeline or process at a glance. Often placed at the top or bottom of the diagram.

*Example*: `Input → Processing → Output` or `Client → Server → Database`

### Level 2: Section Boundaries
Labeled regions that group related components. These create visual "rooms" that help viewers understand what belongs together.

*Example*: Grouping by responsibility (Backend / Frontend), by phase (Setup / Execution / Cleanup), or by team (User / System / External)

### Level 3: Detail Inside Sections
Evidence artifacts, code snippets, and concrete examples within each section. This is where the educational value lives.

*Example*: Inside a "Backend" section, you might show the actual API response format, not just a box labeled "API Response"

**For comprehensive diagrams, aim to include all three levels.** The summary gives context, the sections organize, and the details teach.

### Bad vs Good

| Bad (Displaying) | Good (Arguing) |
|------------------|----------------|
| 5 equal boxes with labels | Each concept has a shape that mirrors its behavior |
| Card grid layout | Visual structure matches conceptual structure |
| Icons decorating text | Shapes that ARE the meaning |
| Same container for everything | Distinct visual vocabulary per concept |
| Everything in a box | Free-floating text with selective containers |

### Simple vs Comprehensive (Know Which You Need)

| Simple Diagram | Comprehensive Diagram |
|----------------|----------------------|
| Generic labels: "Input" → "Process" → "Output" | Specific: shows what the input/output actually looks like |
| Named boxes: "API", "Database", "Client" | Named boxes + examples of actual requests/responses |
| "Events" or "Messages" label | Timeline with real event/message names from the spec |
| "UI" or "Dashboard" rectangle | Mockup showing actual UI elements and content |
| ~30 seconds to explain | ~2-3 minutes of teaching content |
| Viewer learns the structure | Viewer learns the structure AND the details |

**Simple diagrams** are fine for abstract concepts, quick overviews, or when the audience already knows the details. **Comprehensive diagrams** are needed for technical architectures, tutorials, educational content, or when you want the diagram itself to teach.

---

## Container vs. Free-Floating Text

**Not every piece of text needs a shape around it.** Default to free-floating text. Add containers only when they serve a purpose.

| Use a Container When... | Use Free-Floating Text When... |
|------------------------|-------------------------------|
| It's the focal point of a section | It's a label or description |
| It needs visual grouping with other elements | It's supporting detail or metadata |
| Arrows need to connect to it | It describes something nearby |
| The shape itself carries meaning (decision diamond, etc.) | Typography alone creates sufficient hierarchy |
| It represents a distinct "thing" in the system | It's a section title, subtitle, or annotation |

**Typography as hierarchy**: Use font size, weight, and color to create visual hierarchy without boxes. A 28px title doesn't need a rectangle around it.

**The container test**: For each boxed element, ask "Would this work as free-floating text?" If yes, remove the container.

---

## Design Process (Do This BEFORE Generating JSON)

### Step 0: Assess Depth Required
Before anything else, determine if this needs to be:
- **Simple/Conceptual**: Abstract shapes, labels, relationships (mental models, philosophies)
- **Comprehensive/Technical**: Concrete examples, code snippets, real data (systems, architectures, tutorials)

**If comprehensive**: Do research first. Look up actual specs, formats, event names, APIs.

### Step 1: Understand Deeply
Read the content. For each concept, ask:
- What does this concept **DO**? (not what IS it)
- What relationships exist between concepts?
- What's the core transformation or flow?
- **What would someone need to SEE to understand this?** (not just read about)

### Step 2: Map Concepts to Patterns
For each concept, find the visual pattern that mirrors its behavior:

| If the concept... | Use this pattern |
|-------------------|------------------|
| Spawns multiple outputs | **Fan-out** (radial arrows from center) |
| Combines inputs into one | **Convergence** (funnel, arrows merging) |
| Has hierarchy/nesting | **Tree** (lines + free-floating text) |
| Is a sequence of steps | **Timeline** (line + dots + free-floating labels) |
| Loops or improves continuously | **Spiral/Cycle** (arrow returning to start) |
| Is an abstract state or context | **Cloud** (overlapping ellipses) |
| Transforms input to output | **Assembly line** (before → process → after) |
| Compares two things | **Side-by-side** (parallel with contrast) |
| Separates into phases | **Gap/Break** (visual separation between sections) |

### Step 3: Ensure Variety
For multi-concept diagrams: **each major concept must use a different visual pattern**. No uniform cards or grids.

### Step 4: Sketch the Flow
Before JSON, mentally trace how the eye moves through the diagram. There should be a clear visual story.

### Step 5: Generate JSON
Only now create the Excalidraw elements. **See below for how to handle large diagrams.**

### Step 6: Render & Validate (MANDATORY)
After generating the JSON, you MUST run the render-view-fix loop until the diagram looks right. This is not optional — see the **Render & Validate** section below for the full process.

### Step 7: Report the Artifact
Return the file path and what changed. Do not paste the full JSON unless the user asked for it.

---

## Excalidraw Correctness Contract

Every generated element must be complete enough for Excalidraw and the renderer to load without repair:

- Include `id`, `type`, `x`, `y`, `width`, `height`, `angle`, `strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`, `opacity`, `seed`, `version`, `versionNonce`, `isDeleted`, `groupIds`, `boundElements`, `link`, and `locked` where applicable.
- Text elements include `text`, `originalText`, `fontSize`, `fontFamily`, `textAlign`, `verticalAlign`, `containerId`, and `lineHeight`.
- Bound shape labels use `boundElements` on the shape and `containerId` on the text. The text element follows the shape immediately.
- Arrows use `points`, `startBinding`, `endBinding`, `startArrowhead`, and `endArrowhead`. Use `focus`/`gap` bindings, not ad hoc endpoint guesses.
- Use descriptive, stable IDs such as `ingest_box`, `eval_loop_arrow`, `artifact_code_text`.
- Use unique numeric `seed` and `versionNonce` values. For multi-section diagrams, namespace seeds by section.
- Keep `opacity: 100`; use color, stroke width, scale, and spacing for hierarchy.
- Use `roughness: 0` for polished technical diagrams and `roughness: 1` only for intentionally sketchy/whiteboard diagrams.
- Keep text readable at export size. Minimum body text is 16px; prefer 18-24px for labels.

See `element-templates.md` and `json-schema.md` for copy-paste structures.

---

## Comprehensive / large diagram strategy

See [references/comprehensive-diagrams.md](references/comprehensive-diagrams.md) — consult it when building a large or comprehensive diagram section by section.

---

## Visual language (patterns, shapes, color, layout, text)

See [references/visual-language.md](references/visual-language.md) — consult it when choosing patterns, shapes, colors, and layout for a diagram.

---

## Authoring Format: Skeleton (recommended) vs Full Elements

There are two ways to write a diagram. **Default to the skeleton format** — it is dramatically less verbose and eliminates a whole class of malformed-JSON defects.

### Skeleton format (preferred)

Set `"type": "excalidraw-skeleton"` and write the *minimum* per element. The renderer hydrates it via Excalidraw's `convertToExcalidrawElements`, which auto-generates `id`, `seed`, `versionNonce`, `boundElements`, `containerId`, the bound text-label elements, and arrow point geometry.

```json
{
  "type": "excalidraw-skeleton",
  "elements": [
    { "type": "rectangle", "id": "ingest", "x": 100, "y": 100, "width": 160, "height": 80,
      "strokeColor": "#1e1e1e", "backgroundColor": "#ffffff", "roughness": 0,
      "label": { "text": "Ingest" } },
    { "type": "ellipse", "id": "store", "x": 480, "y": 110, "width": 140, "height": 80,
      "label": { "text": "Store" } },
    { "type": "arrow", "x": 270, "y": 140, "width": 200, "height": 0,
      "start": { "id": "ingest" }, "end": { "id": "store" }, "label": { "text": "writes" } }
  ]
}
```

What you still provide:
- `type`, `x`, `y`, and (for shapes) `width`/`height`.
- `label: { text }` for a bound text label — no separate text element, no `containerId` wiring.
- All style props you'd normally set (`strokeColor`, `backgroundColor`, `fillStyle`, `strokeWidth`, `strokeStyle`, `roughness`, `fontSize`, `fontFamily`, `opacity`) — pull these from the active theme exactly as before. The skeleton only removes *boilerplate*, not styling control.

**Arrow binding — the one gotcha:** a bound arrow still needs approximate geometry. Give it `x`/`y` (a point near the source) and `width`/`height` (the delta toward the target), then:
- bind to **existing** elements with `"start": { "id": "..." }` / `"end": { "id": "..." }`, or
- **auto-create** new endpoint shapes with `"start": { "type": "rectangle" }` / `"end": { "type": "ellipse" }`.
Without coordinates (`x:0, y:0`), the arrow renders detached at the origin.

**Frames** (native section boundaries): `{ "type": "frame", "name": "Backend", "children": ["id1", "id2"] }`.

### Mermaid fast-path (structured diagrams)

For **rigid, structured** diagrams — flowcharts, sequence diagrams, class diagrams — don't hand-author elements at all. Write Mermaid and let the renderer convert it:

```json
{
  "type": "mermaid",
  "definition": "flowchart LR\n  A[Client] -->|request| B(API)\n  B --> C{Auth?}\n  C -->|yes| D[(DB)]\n  C -->|no| E[Reject]"
}
```

The renderer parses it with `@excalidraw/mermaid-to-excalidraw`, hydrates to full elements, and renders in the active theme's hand-drawn style. `hydrate` works on Mermaid docs too, producing an editable `.excalidraw`.

**When to use which:**
- **Mermaid** — the structure is the whole point (a flow, a sequence, a class hierarchy) and Mermaid's auto-layout is good enough. Cheapest possible authoring.
- **Skeleton / full elements** — a *visual argument*: evidence artifacts, multi-zoom, deliberate composition, free-floating text, anything Mermaid's rigid layout can't express. This is where the methodology earns its keep.

Only flowchart/sequence/class are natively supported; other Mermaid types fall back to an image. If a Mermaid diagram comes out looking like a generic labeled grid, that's the signal to switch to the skeleton format and *argue*.

### Hydrating to an openable file

A skeleton file does **not** open directly in Excalidraw (it expects fully-qualified elements). The renderer reads skeletons fine, but to produce an editable/shareable `.excalidraw`:

```bash
excalidraw-render hydrate diagram.excalidraw -o diagram.full.excalidraw
```

Draft as a skeleton → render + iterate (fast, cheap) → hydrate to a full file for the final deliverable.

### Full-element format

Hand-write fully-qualified elements (the **Excalidraw Correctness Contract** above governs this path) only when you need control the skeleton can't express — exact `seed` reproducibility, custom multi-waypoint arrow `points`, or hand-tuned geometry. For everything else, skeleton wins.

## JSON Structure

Full-element envelope (what `hydrate` produces and what the full-element path uses):

```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://excalidraw.com",
  "elements": [...],
  "appState": {
    "viewBackgroundColor": "#ffffff",
    "gridSize": 20
  },
  "files": {}
}
```

## Element Templates

See `references/element-templates.md` for copy-paste JSON templates for each element type (text, line, dot, rectangle, arrow). Pull colors from `references/color-palette.md` based on each element's semantic purpose.

---

## Render & Validate (MANDATORY)

You cannot judge a diagram from JSON alone. After generating or editing the Excalidraw JSON, you MUST render it to PNG, view the image, and fix what you see — in a loop until it's right. This is a core part of the workflow, not a final check.

### How to Render

Use the installed renderer (any of these — whichever the environment provides):

```bash
# Node CLI (npm)
npx @excalidraw-skill-pack/render <path-to-file.excalidraw> --theme <theme>

# Python CLI (PyPI) — installs the `excalidraw-render` command
excalidraw-render <path-to-file.excalidraw> --theme <theme>
```

If you're in an MCP-enabled agent, call the `render_diagram` tool instead. All paths accept full `.excalidraw`, `excalidraw-skeleton`, and `mermaid` documents and write a PNG next to the file. Then use the **Read tool** on the PNG to actually view it.

### The Loop

After generating the initial JSON, run this cycle:

**1. Render & View** — Run the render script, then Read the PNG.

**2. Audit against your original vision** — Before looking for bugs, compare the rendered result to what you designed in Steps 1-4. Ask:
- Does the visual structure match the conceptual structure you planned?
- Does each section use the pattern you intended (fan-out, convergence, timeline, etc.)?
- Does the eye flow through the diagram in the order you designed?
- Is the visual hierarchy correct — hero elements dominant, supporting elements smaller?
- For technical diagrams: are the evidence artifacts (code snippets, data examples) readable and properly placed?

**3. Check for visual defects:**
- Text clipped by or overflowing its container
- Text or shapes overlapping other elements
- Arrows crossing through elements instead of routing around them
- Arrows landing on the wrong element or pointing into empty space
- Labels floating ambiguously (not clearly anchored to what they describe)
- Uneven spacing between elements that should be evenly spaced
- Sections with too much whitespace next to sections that are too cramped
- Text too small to read at the rendered size
- Overall composition feels lopsided or unbalanced

**4. Fix** — Edit the JSON to address everything you found. Common fixes:
- Widen containers when text is clipped
- Adjust `x`/`y` coordinates to fix spacing and alignment
- Add intermediate waypoints to arrow `points` arrays to route around elements
- Reposition labels closer to the element they describe
- Resize elements to rebalance visual weight across sections

**5. Re-render & re-view** — Run the render script again and Read the new PNG.

**6. Repeat** — Keep cycling until the diagram passes both the vision check (Step 2) and the defect check (Step 3). Typically takes 2-4 iterations. Don't stop after one pass just because there are no critical bugs — if the composition could be better, improve it.

### When to Stop

The loop is done when:
- The rendered diagram matches the conceptual design from your planning steps
- No text is clipped, overlapping, or unreadable
- Arrows route cleanly and connect to the right elements
- Spacing is consistent and the composition is balanced
- You'd be comfortable showing it to someone without caveats

### First-Time Setup
The renderer drives headless Chromium via Playwright. If a render fails because the browser isn't installed:
```bash
# Node renderer
npx playwright install chromium
# Python renderer
excalidraw-render --help   # the package installs Playwright; if missing:
python -m playwright install chromium
```

---

## Quality Checklist

### Depth & Evidence (Check First for Technical Diagrams)
1. **Research done**: Did you look up actual specs, formats, event names?
2. **Evidence artifacts**: Are there code snippets, JSON examples, or real data?
3. **Multi-zoom**: Does it have summary flow + section boundaries + detail?
4. **Concrete over abstract**: Real content shown, not just labeled boxes?
5. **Educational value**: Could someone learn something concrete from this?

### Conceptual
6. **Isomorphism**: Does each visual structure mirror its concept's behavior?
7. **Argument**: Does the diagram SHOW something text alone couldn't?
8. **Variety**: Does each major concept use a different visual pattern?
9. **No uniform containers**: Avoided card grids and equal boxes?

### Container Discipline
10. **Minimal containers**: Could any boxed element work as free-floating text instead?
11. **Lines as structure**: Are tree/timeline patterns using lines + text rather than boxes?
12. **Typography hierarchy**: Are font size and color creating visual hierarchy (reducing need for boxes)?

### Structural
13. **Connections**: Every relationship has an arrow or line
14. **Flow**: Clear visual path for the eye to follow
15. **Hierarchy**: Important elements are larger/more isolated

### Technical
16. **Text clean**: `text` contains only readable words
17. **Font**: `fontFamily: 3`
18. **Roughness**: `roughness: 0` for clean/modern (unless hand-drawn style requested)
19. **Opacity**: `opacity: 100` for all elements (no transparency)
20. **Container ratio**: <30% of text elements should be inside containers

### Visual Validation (Render Required)
21. **Rendered to PNG**: Diagram has been rendered and visually inspected
22. **No text overflow**: All text fits within its container
23. **No overlapping elements**: Shapes and text don't overlap unintentionally
24. **Even spacing**: Similar elements have consistent spacing
25. **Arrows land correctly**: Arrows connect to intended elements without crossing others
26. **Readable at export size**: Text is legible in the rendered PNG
27. **Balanced composition**: No large empty voids or overcrowded regions
