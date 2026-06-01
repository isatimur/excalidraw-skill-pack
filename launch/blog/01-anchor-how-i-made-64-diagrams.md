# How I made 64 diagrams for an AI book with one skill

Last winter I started writing a book about modern AI engineering, *From Copilot to Colleague*. It's 10 chapters about how the engineer's role changes when the editor itself can reason. By chapter 3 I knew I needed a lot of diagrams — flows, layered stacks, relationship maps, evidence artifacts. By chapter 5 I had 30. By the final chapter, 64.

I made all of them with the same Claude Code skill I just open-sourced as `excalidraw-skill-pack`.

## The constraint

I wanted diagrams that **argued**, not diagrams that **labeled boxes**. The difference matters. A labeled-boxes diagram is a list with arrows. An arguing diagram is a position — the shape itself carries the claim.

Rules I held myself to:

- **Isomorphism test:** if you removed all the text, could you still read the structure?
- **Evidence artifacts only:** real API names, actual JSON formats, real event names from the spec. Never "Component A" or "Event 1".
- **One accent per diagram.** Two means there are two competing arguments. Split it.

And I wanted these to be version-controlled with the manuscript — JSON in git, not binary Figma files.

## The skill

The skill is a system prompt + a renderer + a theme. The system prompt teaches the agent the methodology (isomorphism, evidence artifacts, the rules). The renderer runs Excalidraw's library headless in Chromium and exports PNG. The theme defines the colors and the typography.

When I tell Claude "diagram the post-meeting redaction pipeline", three things happen:

1. The agent reads the methodology + my active theme's palette
2. The agent drafts Excalidraw JSON
3. The renderer turns it into a PNG

No back-and-forth. No "regenerate this." No "make it look more like our brand." The brand is in the theme, the methodology is in the prompt, and the agent does the work.

## Why a "skill" and not just a prompt

A prompt is a thing you paste. A skill is a thing that lives — versioned, audited, reusable, distributed across the team. Skills carry methodology durably. Once everyone on the team uses the same skill, every diagram in every doc starts to feel like it's from the same hand.

## What I extracted

The book is the proof artifact. The skill is the public good. What you get with `excalidraw-skill-pack`:

- The full methodology in `SKILL.md` (the same one I used)
- A dual-language renderer (Node + Python)
- An MCP server with 5 tools, so any MCP-compatible agent works
- 5 themes, including `stripe-press` (the book's look)
- A theme scaffolder — write your own brand theme in 20 lines

## Install for your agent

If you use Claude Code:

```bash
npx @excalidraw-skill-pack/install claude-code
```

For Cursor, Codex, Gemini CLI — same pattern, swap the adapter name. For any MCP-compatible agent: `npx @excalidraw-skill-pack/mcp-server`.

## What this is for

If you're writing — a book, a blog, internal docs, a deck — and you want your diagrams to *argue*, this is for you. If you're shipping a product and your team wants the same visual language across every README and every onboarding doc, this is for you.

It's MIT-licensed at https://github.com/isatimur/excalidraw-skill-pack.

If you build a theme, ping me — I'll add it to the curated registry.
