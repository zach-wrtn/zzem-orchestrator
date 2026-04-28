#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

TEST_TMPDIR=$(mktemp -d)
trap 'rm -rf "$TEST_TMPDIR"' EXIT
export RECALL_STATE_DIR="$TEST_TMPDIR"

source scripts/session.sh

fail() { echo "FAIL: $1" >&2; exit 1; }
pass() { echo "PASS: $1"; }

# Test 0: session_path returns expected path
out=$(session_path)
expected="$TEST_TMPDIR/session.yaml"
[[ "$out" == "$expected" ]] || fail "session_path expected $expected, got $out"
pass "session_path returns expected path"

# Test 1: write then read round-trip
session_write "active: true
sprint_focus: test-sprint
turn_count: 1"
out=$(session_read)
echo "$out" | grep -q "sprint_focus: test-sprint" || fail "round-trip lost sprint_focus"
echo "$out" | grep -q "turn_count: 1" || fail "round-trip lost turn_count"
pass "session_write/session_read round-trip"

# Test 2: read returns empty when no file
rm -f "$RECALL_STATE_DIR/session.yaml"
out=$(session_read)
[[ -z "$out" ]] || fail "session_read should return empty for missing file, got: $out"
pass "session_read empty when no file"

echo "All session tests passed"
