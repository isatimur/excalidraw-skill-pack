# Brand-to-Theme Onboarding

On first run, establish the brand as an Excalidraw theme before drawing. This replaces a one-off style-guide scrape with reusable theme files.

## Resolve the Active Theme

The active theme is resolved in this order:

1. `--theme` flag
2. Project `.excalidraw-skill-pack.json`
3. Global `~/.excalidraw-skill-pack/config.json`
4. Bundled `default-sketchy`

Treat the resolved theme as the source of truth for colors, typography, and visual conventions.

## Gather Brand Inputs

Offer one of these sources:

1. A website URL
2. An existing skill or style guide containing design tokens
3. A local folder containing design-token files
4. A manual paste of brand colors, fonts, and style guidance
5. Proceed with `default-sketchy`

Extract available colors, fonts, contrast requirements, and the intended character of the diagrams. Do not infer a complete identity from a logo or a single screenshot.

## Map Inputs into a Theme

Map the approved inputs into the theme package:

- `theme.json`: define the theme manifest and its semantic `roles`.
- `palette.md`: document a semantic table for backgrounds, primary and secondary emphasis, neutrals, text hierarchy, status/decision colors, and evidence artifacts.
- `typography.json`: define the usable font family, sizes, weights, and text hierarchy.

Check text and shape combinations for WCAG AA contrast before proposing them. Evidence-artifact colors must also come from the theme.

## Propose, Approve, Write

1. Present the extracted tokens and their semantic role mapping as a proposed diff.
2. Get approval before writing or changing a brand theme.
3. Prefer a project-local theme when the identity belongs only to that project; otherwise scaffold a reusable package with `npx @excalidraw-skill-pack/create-theme <name>`.
4. Write the approved `theme.json`, `palette.md`, and `typography.json`, then configure the project to select the theme.

## Detect Existing Onboarding

Treat a project as already onboarded when either condition holds:

- Its `.excalidraw-skill-pack.json` selects a theme.
- Its resolved active theme has a non-default accent role.

Confirm the theme still matches the current brand before replacing it.

## Failure Modes

- **Imagery-heavy sites:** Extract only stable tokens that are actually visible; do not turn photography, gradients, or page chrome into arbitrary Excalidraw colors.
- **Paid fonts:** Do not assume the renderer can load them. Use an approved available fallback and record the limitation in typography.
- **Dark-first brands:** Preserve the brand’s dark surfaces only if text, fills, strokes, and exports remain AA-readable. A dark theme does not justify glows, low-opacity layers, or invented neon accents.
