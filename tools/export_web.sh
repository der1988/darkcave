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
godot --headless --path . --export-release Web web/index.html
