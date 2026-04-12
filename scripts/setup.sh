#!/bin/bash
set -euo pipefail

REPOS_DIR="${REPOS_DIR:-$HOME/dev/work}"
SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

repos=("app-core-packages" "wrtn-backend" "wds-tokens")

for repo in "${repos[@]}"; do
  target="$SCRIPT_DIR/$repo"
  source="$REPOS_DIR/$repo"

  if [ -L "$target" ]; then
    echo "✓ $repo (symlink exists)"
  elif [ -d "$target" ]; then
    echo "✗ $repo — directory already exists (remove it first)"
    exit 1
  elif [ ! -d "$source" ]; then
    echo "✗ $repo — not found at $source"
    exit 1
  else
    ln -s "$source" "$target"
    echo "✓ $repo → $source"
  fi
done

echo ""
echo "Setup complete. All repositories linked."
