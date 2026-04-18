#!/usr/bin/env bash
# Clone (or pull) the zzem KB and symlink its skills.
# Idempotent; safe to run on every session start.
set -euo pipefail

KB_PATH="${ZZEM_KB_PATH:-$HOME/.zzem/kb}"
KB_URL="git@github.com:zach-wrtn/knowledge-base.git"

if [ ! -d "$KB_PATH/.git" ]; then
  mkdir -p "$(dirname "$KB_PATH")"
  git clone "$KB_URL" "$KB_PATH"
else
  git -C "$KB_PATH" fetch origin main
fi

"$KB_PATH/scripts/install-skills.sh"

# Install node dependencies if missing — required by write-pattern/write-reflection
# skills which run `npm run validate:content` before commit. Idempotent: skip when
# node_modules is already present (user can `rm -rf` to force reinstall).
if [ ! -d "$KB_PATH/node_modules" ] && [ -f "$KB_PATH/package-lock.json" ]; then
  (cd "$KB_PATH" && npm ci --silent) || echo "warn: npm ci failed at $KB_PATH; write skills may fail until resolved" >&2
fi
