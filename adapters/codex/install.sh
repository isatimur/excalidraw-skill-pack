#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
TARGET="${HOME}/.codex/skills/excalidraw-diagram"

CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>/dev/null || true)
if [ -z "$CORE_PKG_DIR" ]; then
  echo "Installing @excalidraw-skill-pack/core globally..."
  npm install -g @excalidraw-skill-pack/core
  CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))")
fi
CORE_DIR=$(dirname "$CORE_PKG_DIR")

mkdir -p "$TARGET/references"
cp "$CORE_DIR/SKILL.md" "$TARGET/SKILL.md"
cp -R "$CORE_DIR/themes" "$TARGET/themes"
cp "$CORE_DIR/element-templates.md" "$TARGET/references/"
cp "$CORE_DIR/json-schema.md" "$TARGET/references/"

echo "Installed Codex skill at $TARGET"

if [ "$MODE" = "full" ]; then
  MCP="${HOME}/.codex/mcp.json"
  mkdir -p "$(dirname "$MCP")"
  if [ ! -f "$MCP" ]; then echo '{ "mcpServers": {} }' > "$MCP"; fi
  node - <<EOF
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$MCP', 'utf-8'));
cfg.mcpServers = cfg.mcpServers || {};
cfg.mcpServers['excalidraw-skill-pack'] = {
  command: 'npx', args: ['@excalidraw-skill-pack/mcp-server']
};
fs.writeFileSync('$MCP', JSON.stringify(cfg, null, 2));
EOF
  echo "Registered MCP server in $MCP"
fi

echo "Done."
