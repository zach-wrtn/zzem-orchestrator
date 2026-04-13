#!/bin/bash
#
# Sync source repositories before sprint starts.
#
# Safely fetches and pulls base branches. Does not mutate working tree if
# the repo is dirty or on a different branch — reports state instead.
#
# Usage:
#   ./scripts/sync-repos.sh                  # sync all repos with defaults
#   ./scripts/sync-repos.sh --config <path>  # read base branches from sprint-config.yaml
#
# Exit codes:
#   0 — all repos clean and synced (or reported)
#   1 — missing dependency or setup error

set -euo pipefail

ORCHESTRATOR_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG_PATH=""

while [ $# -gt 0 ]; do
  case "$1" in
    --config)
      CONFIG_PATH="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1"
      exit 1
      ;;
  esac
done

# Default base branches (fallback if no config provided)
DEFAULT_BACKEND_BASE="apple"
DEFAULT_APP_BASE="meme-release-1.2.2"
DEFAULT_TOKENS_BASE="main"

# Parse sprint-config.yaml if provided (simple grep-based parse for base fields)
if [ -n "$CONFIG_PATH" ] && [ -f "$CONFIG_PATH" ]; then
  BACKEND_BASE=$(awk '/^[[:space:]]*backend:/,/^[[:space:]]*[a-z]+:/' "$CONFIG_PATH" | grep -E '^\s+base:' | head -1 | sed -E 's/.*base:[[:space:]]*"?([^"]+)"?.*/\1/' || echo "$DEFAULT_BACKEND_BASE")
  APP_BASE=$(awk '/^[[:space:]]*app:/,/^[[:space:]]*[a-z]+:/' "$CONFIG_PATH" | grep -E '^\s+base:' | head -1 | sed -E 's/.*base:[[:space:]]*"?([^"]+)"?.*/\1/' || echo "$DEFAULT_APP_BASE")
  TOKENS_BASE=$(awk '/^[[:space:]]*tokens:/,/^[[:space:]]*[a-z]+:/' "$CONFIG_PATH" | grep -E '^\s+base:' | head -1 | sed -E 's/.*base:[[:space:]]*"?([^"]+)"?.*/\1/' || echo "$DEFAULT_TOKENS_BASE")
else
  BACKEND_BASE="$DEFAULT_BACKEND_BASE"
  APP_BASE="$DEFAULT_APP_BASE"
  TOKENS_BASE="$DEFAULT_TOKENS_BASE"
fi

HAS_WARNING=0

sync_repo() {
  local name="$1"
  local base="$2"
  local path="$ORCHESTRATOR_DIR/$name"

  if [ ! -d "$path" ]; then
    printf "  ✗ %-22s %-22s not found (run ./scripts/setup.sh)\n" "$name" "$base"
    HAS_WARNING=1
    return
  fi

  # Fetch quietly
  if ! git -C "$path" fetch origin "$base" --quiet 2>/dev/null; then
    printf "  ✗ %-22s %-22s fetch failed (check network/auth)\n" "$name" "$base"
    HAS_WARNING=1
    return
  fi

  local current_branch
  current_branch=$(git -C "$path" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "detached")

  local is_dirty=0
  if [ -n "$(git -C "$path" status --porcelain 2>/dev/null)" ]; then
    is_dirty=1
  fi

  # Count commits behind origin/base
  local behind
  behind=$(git -C "$path" rev-list --count "HEAD..origin/$base" 2>/dev/null || echo "?")

  if [ "$current_branch" != "$base" ]; then
    printf "  ⚠ %-22s %-22s on '%s' (behind %s) — not on base, skipped\n" "$name" "$base" "$current_branch" "$behind"
    HAS_WARNING=1
    return
  fi

  if [ "$is_dirty" = "1" ]; then
    printf "  ⚠ %-22s %-22s dirty working tree (behind %s) — skipped\n" "$name" "$base" "$behind"
    HAS_WARNING=1
    return
  fi

  if [ "$behind" = "0" ]; then
    printf "  ✓ %-22s %-22s already up to date\n" "$name" "$base"
    return
  fi

  if ! git -C "$path" pull origin "$base" --ff-only --quiet 2>/dev/null; then
    printf "  ⚠ %-22s %-22s pull failed (may need manual resolution)\n" "$name" "$base"
    HAS_WARNING=1
    return
  fi

  printf "  ✓ %-22s %-22s pulled (%s new commits)\n" "$name" "$base" "$behind"
}

echo "Syncing source repositories..."
echo ""
sync_repo "wrtn-backend" "$BACKEND_BASE"
sync_repo "app-core-packages" "$APP_BASE"
sync_repo "wds-tokens" "$TOKENS_BASE"
echo ""

if [ "$HAS_WARNING" = "1" ]; then
  echo "⚠ Some repos skipped. Resolve manually or re-run with --skip-sync to proceed."
  exit 0
fi

echo "All repositories synced."
exit 0
