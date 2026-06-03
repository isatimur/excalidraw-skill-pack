#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
TARGET="${HOME}/.gemini/extensions/excalidraw-skill-pack"

if [ -n "${ESP_CORE_DIR:-}" ] && [ -f "$ESP_CORE_DIR/SKILL.md" ]; then
  CORE_DIR="$ESP_CORE_DIR"
else
  CORE_PKG_DIR=$(node -e "console.log(require.resolve('@excalidraw-skill-pack/core/skill'))" 2>/dev/null || true)
  if [ -z "$CORE_PKG_DIR" ]; then
    echo "ERROR: cannot locate @excalidraw-skill-pack/core. Run via 'npx @excalidraw-skill-pack/install' or install core globally first." >&2
    exit 1
  fi
  CORE_DIR=$(dirname "$CORE_PKG_DIR")
fi

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
