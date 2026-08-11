# Brand-to-Theme Onboarding

On first run, establish the brand as an **Excalidraw theme package** before drawing. Unlike a one-off `style-guide.md`, themes are publishable, swappable, and shared across agents.

## Resolve the active theme

1. `--theme` flag
2. Project `.excalidraw-skill-pack.json`
3. Global `~/.excalidraw-skill-pack/config.json`
4. Bundled `default-sketchy`

Treat the resolved theme as the source of truth for colors, typography, and visual conventions.

## Gather brand inputs

Offer one of these sources:

1. **Website URL** — fetch homepage HTML/CSS
2. **Existing skill or style guide** with design tokens
3. **Local folder** of design-token files (JSON, CSS variables, Tailwind config)
4. **Manual paste** of brand colors, fonts, and guidance
5. Proceed with `default-sketchy`

Extract colors, fonts, contrast requirements, and diagram character. Do not infer a complete identity from a logo alone.

## URL onboarding flow (≈60 seconds)

```
You:     "onboard excalidraw to https://yoursite.com"
Agent:   → fetch the homepage
         → extract dominant palette + font stack
         → map detected values to semantic roles:
             paper, ink, muted, accent, link, evidence
         → check WCAG AA contrast for text on paper
         → show a proposed diff (theme.json + palette.md + typography.json)
         → on approval, write theme files + set .excalidraw-skill-pack.json
You:     "yes, apply it"
```

### What gets extracted

| Detected from site | Becomes |
|---|---|
| `<body>` background | `paper` |
| Primary text color | `ink` |
| Secondary / caption text | `muted` |
| Cards or containers | `paper-2` |
| CTA / link / heading accent | `accent` |
| Monospace in code blocks | evidence / code artifact role |

## Skill / folder onboarding

- **From skill:** read bundled `palette.md`, `typography.json`, or equivalent tokens; map roles into theme manifest.
- **From folder:** load `tokens.json`, `tailwind.config.js`, or CSS custom properties; propose semantic mapping table before write.

## Map inputs into a theme package

- `theme.json`: manifest + semantic `roles`
- `palette.md`: backgrounds, emphasis, neutrals, text hierarchy, status colors, evidence artifacts
- `typography.json`: font families, sizes, weights

Check text and shape combinations for **WCAG AA** before proposing. Evidence-artifact colors must come from the theme.

## Propose, approve, write

1. Present extracted tokens + semantic role mapping as a proposed diff.
2. Get approval before writing or replacing a brand theme.
3. Project-local theme when identity is repo-specific; otherwise `npx @excalidraw-skill-pack/create-theme <name>` for a publishable package.
4. Write approved files and point `.excalidraw-skill-pack.json` at the theme.

## Detect existing onboarding

Onboarded when either holds:

- `.excalidraw-skill-pack.json` selects a non-default theme
- Resolved theme has a non-default accent role

Confirm the theme still matches current brand before replacing.

## Failure modes

- **Imagery-heavy sites:** extract only stable CSS tokens; do not sample photography into diagram colors.
- **Paid fonts:** record fallback in `typography.json`; renderer may not load licensed faces.
- **Dark-first brands:** preserve dark surfaces only if AA-readable without glow or low-opacity hacks.
