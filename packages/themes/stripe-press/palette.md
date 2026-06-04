# stripe-press palette

> Cream paper, ink-brown strokes, single accent — editorial restraint.

| Role | Hex | Use for |
|---|---|---|
| `ink` | `#2A2622` | All strokes. All body text. Default for everything. |
| `paper` | `#F4EDE0` | The background. Element fills that pretend to be "no fill". |
| `accent` | `#B8472A` | The argument. One per diagram. The takeaway, the conclusion, the one thing you want remembered. |
| `accent_alt` | `#3B6A8A` | When two ideas must be compared. Use sparingly. |
| `evidence_bg` | `#2A2622` | Evidence artifact backgrounds — code snippets, JSON samples. |
| `evidence_text` | `#F4EDE0` | Evidence text. |
| `muted` | `#7A6F5F` | Captions, axis labels, ancillary text. |

## Editorial rules

- One `accent` per diagram. Two = a competing argument; split into two diagrams.
- Italic is reserved for headings and takeaways (`italicPolicy: headings_and_takeaways`).
- No bright colors. The palette is restrained on purpose; it makes the accent land.
- Evidence artifacts are inverted (`ink` text on `paper`-toned bg, or `paper` text on `ink` bg). Never `accent` text inside evidence — the accent is for the visual, not the snippet.

## Proof

This palette renders the 14 diagrams in *From Copilot to Colleague* (fromcopilottocolleague.com).
