#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-full}"
THEME="${THEME:-default-sketchy}"

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

mkdir -p .cursor/rules
mkdir -p .cursor/excalidraw-skill-pack

ADAPTER_DIR=$(cd "$(dirname "$0")" && pwd)
PALETTE_PATH="$CORE_DIR/themes/$THEME/palette.md"
if [ ! -f "$PALETTE_PATH" ]; then
  PALETTE_PATH="$CORE_DIR/themes/default-sketchy/palette.md"
fi

if [ -d "$CORE_DIR/references" ]; then
  rm -rf .cursor/excalidraw-skill-pack/references
  cp -R "$CORE_DIR/references" .cursor/excalidraw-skill-pack/references
fi
if [ -d "$CORE_DIR/themes" ]; then
  rm -rf .cursor/excalidraw-skill-pack/themes
  cp -R "$CORE_DIR/themes" .cursor/excalidraw-skill-pack/themes
fi
cp "$CORE_DIR/SKILL.md" .cursor/excalidraw-skill-pack/SKILL.md
cp "$CORE_DIR/element-templates.md" .cursor/excalidraw-skill-pack/ 2>/dev/null || true
cp "$CORE_DIR/json-schema.md" .cursor/excalidraw-skill-pack/ 2>/dev/null || true

SKILL_BODY=$(cat "$CORE_DIR/SKILL.md") \
PALETTE_MD=$(cat "$PALETTE_PATH") \
python3 - "$ADAPTER_DIR/rules.mdc.template" > .cursor/rules/excalidraw.mdc <<'PYEOF'
import sys, pathlib, os
template = pathlib.Path(sys.argv[1]).read_text()
out = template.replace("{{SKILL_BODY}}", os.environ["SKILL_BODY"]).replace("{{PALETTE_MD}}", os.environ["PALETTE_MD"])
print(out, end="")
PYEOF

echo "Installed Cursor rule at .cursor/rules/excalidraw.mdc"
echo "Installed skill pack refs at .cursor/excalidraw-skill-pack/"

if [ "$MODE" = "full" ]; then
  MCP=.cursor/mcp.json
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
