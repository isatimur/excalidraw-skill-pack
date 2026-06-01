#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
TARGET="${HOME}/.gemini/extensions/excalidraw-skill-pack"

CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))" 2>/dev/null || true)
if [ -z "$CORE_PKG_DIR" ]; then
  echo "Installing @excalidraw-skill-pack/core globally..."
  npm install -g @excalidraw-skill-pack/core
  CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/package.json'))")
fi
CORE_DIR=$(dirname "$CORE_PKG_DIR")

mkdir -p "$TARGET"
ADAPTER_DIR=$(cd "$(dirname "$0")" && pwd)
sed -e "s|{{CORE_DIR}}|$CORE_DIR|g" "$ADAPTER_DIR/extension.json.template" > "$TARGET/extension.json"

if [ "$MODE" = "lite" ]; then
  node - <<EOF
const fs = require('fs');
const cfg = JSON.parse(fs.readFileSync('$TARGET/extension.json', 'utf-8'));
delete cfg.mcpServers;
fs.writeFileSync('$TARGET/extension.json', JSON.stringify(cfg, null, 2));
EOF
fi

echo "Installed Gemini CLI extension at $TARGET"
echo "Done."
