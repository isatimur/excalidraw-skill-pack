---
"@excalidraw-skill-pack/core": patch
---

docs(skill): make SKILL.md accurate across agents. Generalize the section-by-section guidance away from a Claude-Code-specific "~32,000 token" output limit (this skill runs on Cursor, Copilot, Codex, and Gemini too), and fix the render section — `excalidraw-render` is the Python CLI command; the Node renderer runs via `npx @excalidraw-skill-pack/render`.
