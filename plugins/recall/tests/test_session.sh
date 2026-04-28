#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT
export RECALL_STATE_DIR="$TMPDIR"

source scripts/session.sh

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "PASS: $1"; }

# Test 1: write then read round-trip
session_write "active: true
sprint_focus: test-sprint
turn_count: 1"
out=$(session_read)
echo "$out" | grep -q "sprint_focus: test-sprint" || fail "round-trip lost sprint_focus"
pass "session_write/session_read round-trip"

# Test 2: read returns empty when no file
rm -f "$RECALL_STATE_DIR/session.yaml"
out=$(session_read)
[[ -z "$out" ]] || fail "session_read should return empty for missing file, got: $out"
pass "session_read empty when no file"

echo "All session tests passed"
