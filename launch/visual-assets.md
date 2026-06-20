# Visual assets spec (Product Hunt / Twitter / README)

Three assets, fully specified so production is mechanical. Each lists the **fastest path**
using material that already exists in this repo, plus exact dimensions and on-screen copy.

Anchor message across all three: **"Diagrams that argue, not boxes that label."**
Credibility tag wherever it fits: **"77 diagrams for a published book."**

Source material already on hand:
- 5 theme previews → `docs/site/images/themes/{default-sketchy,stripe-press,notion,whiteboard,dark}.png`
- Book corpus (14 production diagrams) → re-render any time:
  `npx -y @excalidraw-skill-pack/render@latest diagrams/*.excalidraw --theme default-sketchy -o rendered/`
- Fixtures for quick demos → `packages/shared/fixtures/*.excalidraw`
- Existing hero → `docs/site/images/hero.png`

---

## Asset 1 — Hero GIF (the loop)

**Purpose:** the one-glance "what is this." Tweet 1, PH gallery slot 1, README top.
**Format:** GIF or MP4, **1200×675** (16:9), ≤ 8 s, loops seamlessly, ≤ 5 MB (GIF) / silent MP4.
**Concept:** show the *agent → JSON → render → fix* loop the methodology is built on — the thing
no prompt-to-Excalidraw tool does.

Storyboard (4 beats, ~2 s each):

| Beat | On screen | Caption (lower third) |
|------|-----------|-----------------------|
| 1 | Agent chat: user types *"diagram how our eval loop works"* | `1. Ask in plain language` |
| 2 | `.excalidraw` JSON scrolling (skeleton format, short) | `2. Agent writes the structure` |
| 3 | Rendered PNG fades in — use `/tmp/bookcorpus/08-chapter4-evals.png` (the evals diagram) | `3. Render` |
| 4 | A second, tighter render swaps in (spacing fixed) | `4. View & fix — until it argues` |

**Fastest path:** screen-record a real Claude Code session generating
`packages/shared/fixtures/01-flow-pipeline.excalidraw` (or the evals book diagram), then
trim to the 4 beats in QuickTime/Kap/ScreenStudio. Add captions in CapCut or Kap.
If a live recording is fussy, assemble the 4 still frames (chat screenshot → JSON screenshot →
PNG → PNG) as a 4-slide GIF in `ffmpeg`/Gifski — looks just as good.

---

## Asset 2 — Five-theme grid (same diagram, five identities)

**Purpose:** proves the theme system — *one diagram, five brand looks*. PH gallery slot 2.
**Format:** PNG, **1600×1000**, 2×3 grid (5 panels + 1 title panel) or 5-across strip.
**The five panels already exist** — just compose them:
`docs/site/images/themes/default-sketchy.png`, `stripe-press.png`, `notion.png`,
`whiteboard.png`, `dark.png`.

Layout (2×3):

```
┌───────────────┬───────────────┬───────────────┐
│  TITLE PANEL  │ default-sketchy│  stripe-press │
│ "One diagram. │   [preview]    │   [preview]   │
│  Five themes."│                │               │
├───────────────┼───────────────┼───────────────┤
│    notion     │   whiteboard   │     dark      │
│   [preview]   │   [preview]    │   [preview]   │
└───────────────┴───────────────┴───────────────┘
```

Each panel: theme name as a small caption, 16 px padding, consistent panel size.
Title panel copy: **"One diagram. Five themes."** / sub: *"…and anyone can publish their own."*

**Fastest path:** ImageMagick montage —
```bash
cd docs/site/images/themes
magick montage default-sketchy.png stripe-press.png notion.png whiteboard.png dark.png \
  -tile 3x2 -geometry +12+12 -background white -title "One diagram. Five themes." \
  /tmp/theme-grid.png
```
(Reorder/relabel as desired; add the title panel in any editor if `-title` looks plain.)

---

## Asset 3 — Before / After (the core argument)

**Purpose:** the single most persuasive image — *labeled boxes* vs *a diagram that argues*.
PH gallery slot 3, and the hero of the comparison blog post.
**Format:** PNG, **1600×900**, side-by-side, hard divider, red ✗ / green ✓ badges.

| Left — ❌ "Displaying" | Right — ✅ "Arguing" |
|------------------------|----------------------|
| 5 identical rounded boxes in a row, generic labels ("Input", "Process", "Output", "API", "DB"), one flat arrow | A real book diagram that mirrors its concept — use `/tmp/bookcorpus/02-autoresearch-machine.png` (layered flow + control plane + evidence artifacts) |
| Caption: *"Boxes that label."* | Caption: *"Diagrams that argue."* |

Bottom strip copy: **"Same prompt. The difference is the methodology."**

**Fastest path:**
- **Right panel:** already rendered — `/tmp/bookcorpus/02-autoresearch-machine.png` (or the
  argument-spine `01-book-argument-spine.png`).
- **Left panel:** make the deliberately-bad version fast — hand-author a 5-equal-boxes
  `.excalidraw` (or ask the agent for "5 labeled boxes, no methodology") and render it:
  `npx -y @excalidraw-skill-pack/render@latest bad-example.excalidraw -o /tmp/before.png`.
- Compose side by side with the divider + badges in any editor, or:
  ```bash
  magick /tmp/before.png /tmp/bookcorpus/02-autoresearch-machine.png +append /tmp/before-after.png
  ```

---

## Checklist

- [ ] Hero GIF (1200×675, ≤8 s, loops) → tweet 1, PH slot 1, README
- [ ] Theme grid (1600×1000) → PH slot 2, themes doc
- [ ] Before/after (1600×900) → PH slot 3, comparison blog hero
- [ ] All three under PH's per-image size limits; GIF ≤ 5 MB
- [ ] Re-check captions match the live tagline ("argue, not label")
