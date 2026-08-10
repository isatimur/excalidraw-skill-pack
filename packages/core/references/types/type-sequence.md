# Sequence

Use sequence when message order between actors is the claim. Use active-theme `palette.md` colors consistently for actor headings, calls, returns, and errors.

## Layout
- Actors span the top in reading order; vertical lifelines establish time downward.
- Messages cross horizontally at distinct y positions. Put causal annotations as free-floating text beside the relevant message.
- Frame retries, optional branches, and failure paths instead of interleaving them with the main exchange.

## Excalidraw pattern
- Use skeleton actor containers with bound labels; lifelines are dashed `line` elements.
- Calls are horizontal arrows; returns are dashed arrows. Keep arrow `points` orthogonal.
- Put concrete request/response JSON in a dark evidence card where accuracy matters.

## Avoid
- Generic “API call” labels, diagonal message arrows, and component architecture inside lifelines.

## Budget
2–5 actors, 6–12 messages per frame. Split long protocols into phases.
