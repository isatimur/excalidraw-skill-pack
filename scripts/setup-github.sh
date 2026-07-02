#!/usr/bin/env bash
set -euo pipefail

# setup-github.sh — reproducible GitHub repo metadata for excalidraw-skill-pack.
#
# This script DOCUMENTS the one-time/occasional repo-settings steps. It is NOT
# run by CI and is intentionally not auto-executed. Read it, then run the
# sections you actually need. Requires the `gh` CLI authenticated against an
# account with admin rights on the repo.
#
# Covers:
#   1. Social Preview image (the 1280x640 card shown when the repo is shared)
#   2. Description / homepage / topics — re-asserted so metadata is reproducible
#
# Nothing here mutates package registries (npm/PyPI) — releases go through
# Changesets, see CLAUDE.md "Release flow".

REPO="isatimur/excalidraw-skill-pack"
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# ---------------------------------------------------------------------------
# 1. Social Preview image (1280x640 PNG)
# ---------------------------------------------------------------------------
# GitHub has NO API/CLI for the social-preview image — it must be uploaded by
# hand once at:
#   https://github.com/${REPO}/settings  ->  "Social preview"  ->  "Edit"
#
# Build a correctly-sized card from the existing hero as the base. hero.png is
# the canonical 800px-wide hero; pad/letterbox it onto a 1280x640 canvas so
# nothing is cropped (GitHub crops anything that isn't exactly 1280x640).
#
# Requires ImageMagick (`brew install imagemagick`). Output is written to
# docs/site/images/social-preview.png; then upload that file via the UI above.
#
#   magick "${REPO_ROOT}/docs/site/images/hero.png" \
#     -resize 1200x560\> \
#     -background "#FBF6EF" -gravity center -extent 1280x640 \
#     "${REPO_ROOT}/docs/site/images/social-preview.png"
#
# After generating, upload manually (no gh/API path exists):
#   open "https://github.com/${REPO}/settings"
#
# NOTE: the highest-impact upgrade is a purpose-built card (logo + tagline +
# one book figure) rather than a letterboxed hero. Treat the above as the
# minimum reproducible baseline.

# ---------------------------------------------------------------------------
# 2. Description / homepage / topics (reproducible via gh)
# ---------------------------------------------------------------------------
# Re-asserts the existing repo metadata so it is reproducible from source.
# Description + homepage mirror the root package.json. Topics are already set
# on the live repo; this re-applies a 10-topic set derived from the published
# package keywords. VERIFY against the live repo first — the canonical topic
# list is not otherwise checked into this repo:
#   gh repo view "${REPO}" --json repositoryTopics

DESCRIPTION="Universal skill pack: make your AI agent argue visually."
HOMEPAGE="https://excalidraw-skill-pack.vercel.app"

TOPICS=(
  excalidraw
  diagrams
  ai-agent
  claude-code
  mcp
  cursor
  visualization
  diagram-as-code
  skill
  methodology
)

TOPIC_ARGS=()
for t in "${TOPICS[@]}"; do
  TOPIC_ARGS+=("--add-topic" "$t")
done

gh repo edit "${REPO}" \
  --description "${DESCRIPTION}" \
  --homepage "${HOMEPAGE}" \
  "${TOPIC_ARGS[@]}"

echo "Done. Verify: gh repo view ${REPO} --json description,homepageUrl,repositoryTopics"
