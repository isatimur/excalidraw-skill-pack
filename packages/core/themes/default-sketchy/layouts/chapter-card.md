# chapter-card

A single-page argument card. One bold title, one anchor visual (left), and 3-5 supporting beats (right). Use for chapter openers, section headers, or summary slides.

## Structure

- **Left half:** the anchor visual (a single strong shape, a small flow, or an evidence artifact).
- **Right half:** the title (top), 3-5 supporting beats (middle), and a single takeaway sentence (bottom).
- **Outer frame:** a 1.5px stroke rectangle with `roundness.type: 3` and `roughness: 1`.

## Constraints

- One headline (≤8 words). One takeaway (≤16 words). Beats are 3-5 nouns/short phrases, not sentences.
- The anchor visual must pass the Isomorphism Test: removing the text on the right, the left visual still hints at the meaning.
- Use the `ink` role for strokes and `accent` for the takeaway emphasis.

## Anti-patterns

- Two headlines.
- Body copy on the right (use beats, not paragraphs).
- A purely decorative anchor visual.
