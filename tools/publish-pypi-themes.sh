#!/usr/bin/env bash
set -euo pipefail

# Build (and optionally publish) every theme's PyPI mirror.
# Usage: tools/publish-pypi-themes.sh [--publish]

PUBLISH=0
[ "${1:-}" = "--publish" ] && PUBLISH=1

for theme_dir in packages/themes/*/; do
  name=$(basename "$theme_dir")
  echo "=== $name ==="
  pushd "$theme_dir" > /dev/null
  uv build
  if [ "$PUBLISH" = "1" ]; then
    uv publish
  fi
  popd > /dev/null
done
