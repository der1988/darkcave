#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ "$(godot --version)" != 4.6.3.stable* ]]; then
  echo "Use Godot 4.6.3 with matching export templates." >&2
  exit 1
fi
mkdir -p web
touch web/.gdignore
godot --headless --path . --editor --import --quit
templates_dir="${XDG_DATA_HOME:-$HOME/.local/share}/godot/export_templates/4.6.3.stable"
if [[ -f "$templates_dir/web_nothreads_release.zip" ]]; then
  godot --headless --path . --export-release Web web/index.html
  printf '4.6.3\n' > web/runtime-version.txt
else
  # The committed engine is exactly the pinned version; only game data changed.
  test "$(cat web/runtime-version.txt)" = "4.6.3"
  test -s web/index.js
  test -s web/index.wasm
  godot --headless --path . --export-pack Web web/index.pck
  python3 tools/update_web_config.py
fi
