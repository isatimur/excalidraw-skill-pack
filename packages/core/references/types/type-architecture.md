# Architecture

Use architecture to argue how components cooperate across boundaries, not to inventory services. Use active-theme `palette.md` colors: neutral frames, semantic component fills, and source-colored data arrows.

## Layout
- Make the system boundary legible with frames; arrange 3–7 primary components left-to-right by request/data direction.
- Put the hero boundary in whitespace. Use free-floating boundary titles and short responsibility subtitles.
- Use rectangles only for independently deployable or stateful components; use small evidence cards for a real endpoint, event, or configuration.

## Excalidraw pattern
- Draft as `excalidraw-skeleton`; containers receive bound labels.
- Use `frame` elements for trust, deployment, or ownership zones.
- Draw arrows with explicit orthogonal `points`; solid for data, dashed governance (theme connector stroke) for control/governance.

## Avoid
- Equal-card “microservice wallpaper,” unnamed arrows, and network spaghetti.
- Mixing sequence timing into the architecture; link to a sequence diagram instead.

## Budget
5–9 primary components; one evidence artifact per critical boundary; split comprehensive systems into frames.
