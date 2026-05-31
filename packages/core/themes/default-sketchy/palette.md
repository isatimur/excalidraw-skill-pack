# Color Palette & Brand Style

**This is the single source of truth for all colors and brand-specific styles.** To customize diagrams for your own brand, edit this file — everything else in the skill is universal.

---

## Shape Colors (Semantic)

Colors encode meaning, not decoration. Each semantic purpose has a **fill / stroke / on-fill text** triplet. Pick the slot whose meaning matches the element; never pick a color for looks.

| Semantic Purpose | Fill | Stroke | On-fill text | Use for |
|------------------|------|--------|--------------|---------|
| Primary/Neutral | `#3b82f6` | `#1e3a5f` | `#ffffff` | The main subject; default shapes |
| Secondary | `#60a5fa` | `#1e3a5f` | `#0f2540` | Supporting elements, second-rank nodes |
| Tertiary | `#93c5fd` | `#1e3a5f` | `#1e3a5f` | Third-rank / lighter supporting elements |
| Start/Trigger | `#fed7aa` | `#c2410c` | `#7c2d12` | Entry points, inputs, sources |
| End/Success | `#a7f3d0` | `#047857` | `#065f46` | Outputs, results, the desired end state |
| Warning/Reset | `#fee2e2` | `#dc2626` | `#991b1b` | The naive/before state, problems, failure modes |
| Decision | `#fef3c7` | `#b45309` | `#92400e` | Decisions, conditions, stress-test / edge cases |
| Muted/Transient | `#fef3c7` | `#b45309` | `#92400e` | Neither good nor bad — transient, background, "churns" (pair with a slate variant for true neutral) |
| AI/LLM | `#ddd6fe` | `#6d28d9` | `#4c1d95` | The model, AI components, agent control planes |
| Inactive/Disabled | `#dbeafe` | `#1e40af` | `#1e40af` | Faded / not-yet-active state (use a dashed stroke) |
| Neutral/Background | `#cbd5e1` | `#64748b` | `#334155` | Excluded, deferred, "not applicable" categories |
| Error | `#fecaca` | `#b91c1c` | `#7f1d1d` | Hard errors, hazards |

**Rule:** Always pair a darker stroke with a lighter fill for contrast. On a saturated fill (`#3b82f6`, `#60a5fa`) use white or the darkest listed text; on a pale fill use the listed dark text.

---

## Text Colors (Hierarchy)

Use color on free-floating text to create visual hierarchy without containers.

| Level | Color | Use For |
|-------|-------|---------|
| Title | `#1e40af` | Section headings, major labels |
| Subtitle | `#3b82f6` | Subheadings, secondary labels |
| Body/Detail | `#64748b` | Descriptions, annotations, metadata |
| Faint/Caption | `#94a3b8` | De-emphasized captions, axis sub-labels |
| On light fills | `#374151` | Text inside light-colored shapes |
| On dark fills | `#ffffff` | Text inside dark-colored shapes |

---

## Evidence Artifact Colors

Used for code snippets, data examples, and other concrete evidence inside technical diagrams. Evidence artifacts are dark cards that make a diagram concrete and verifiable.

| Element | Value | Use for |
|---------|-------|---------|
| Card background | `#1e293b` | The dark rectangle behind any code/config/data sample |
| Card stroke | `#334155` | Border of the evidence card |
| Plain code text | `#e2e8f0` | Neutral code, config, command output |
| "Before / naive" code | `#fca5a5` | Code shown as the flawed/old way (red-tinted) |
| "After / engineered" code | `#86efac` | Code shown as the corrected/best-practice way (green-tinted) |
| Path / directory text | `#4ade80` | File paths, directory names, identifiers |
| JSON / data example | `#22c55e` | Structured data payloads |

---

## Markers & Badges

| Element | Fill | Stroke | Text |
|---------|------|--------|------|
| Number badge (small ellipse) | `#3b82f6` | `#1e3a5f` | `#ffffff` |
| Marker dot (10-20px ellipse) | `#3b82f6` | `#3b82f6` | — |

---

## Connectors

| Connector | Style | Use for |
|-----------|-------|---------|
| Data-flow arrow | Solid; stroke = source element's semantic stroke | The main flow between elements |
| Governance / control arrow | Dashed; stroke `#6d28d9` | A control plane acting on a layer (meta, not data) |
| Leader line | Dotted; stroke `#cbd5e1` | Connecting a label to the thing it annotates |
| Structural line (dividers, trees, timelines) | Solid; stroke `#1e3a5f` or `#64748b` | Spines, dividers, tree branches |

---

## Background

| Property | Value |
|----------|-------|
| Canvas background | `#ffffff` |
