# dark palette

> Dark background, light strokes, green accent — dev tool aesthetic.

| Role | Hex | Use for |
|---|---|---|
| `ink` | `#E7E5E4` | All strokes and body text. Light warm-gray on dark ground. |
| `paper` | `#18181B` | The background. Near-black zinc — neutral, not blue or warm. |
| `accent` | `#22C55E` | Primary emphasis. Terminal green — the signal you want seen. |
| `accent_alt` | `#F472B6` | Secondary accent — pink, for contrast against green. Use only in binary comparisons. |
| `evidence_bg` | `#0A0A0A` | Evidence block background — darker than paper, creates depth for code/JSON. |
| `evidence_text` | `#E7E5E4` | Text inside evidence blocks. Same warm-gray as `ink`. |
| `muted` | `#71717A` | Subdued labels, grid lines, minor annotations. |

## Editorial rules

- The contrast is inverted from all other themes — `paper` is dark, `ink` is light. Do not mix elements.
- `accent` is terminal-green: use it for outcomes, approvals, the "yes" signal.
- `accent_alt` (pink) is rare — only for true binary contrast (e.g., pass/fail, before/after split).
- Evidence blocks are deeper-black than the paper — this creates a layered, IDE-like depth.
- Typography stays at default Virgil (fontFamily 1) — the sketchy strokes read well on dark ground.
