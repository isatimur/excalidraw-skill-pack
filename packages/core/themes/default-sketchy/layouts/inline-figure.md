# inline-figure

A single small composite figure intended to live inside body text (a paragraph break in an article, a step in a tutorial, a chart in a slide). Use when the figure must read in ≤5 seconds.

## Structure

- Aspect ratio ~16:9 or ~3:2.
- One central object (the argument), with at most one annotation.
- No title bar — the figure is meant to be referenced by the surrounding text's "Figure N.M" callout.

## Constraints

- ≤5 elements total (not counting the optional annotation arrow).
- One color of accent (the `accent` role); everything else `ink` / `muted`.
- Must read at 50% scale (it'll be embedded small).

## Anti-patterns

- Too many shapes (use `concept-card` instead).
- A title (let the surrounding text title it).
- Multiple accent colors competing for attention.
