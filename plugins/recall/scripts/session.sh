# session.sh — state file lifecycle helpers for recall:ask
# Sourced by other scripts; do NOT execute directly.
#
# Public functions:
#   session_read              → echoes state YAML to stdout (empty if no file)
#   session_write <yaml>      → writes <yaml> to state file
#   session_path              → echoes resolved state file path
#   session_active            → exits 0 if active+fresh, 1 otherwise
#   session_reset             → deletes state file
#   session_backup_corrupt    → moves state file to .corrupt-<ts> backup
#
# Env:
#   RECALL_STATE_DIR  — override state dir (default: ~/.recall)
#   RECALL_IDLE_MIN   — idle timeout minutes (default: 30)
#   RECALL_STALE_DAYS — auto-reset stale session days (default: 7)

session_path() {
  local dir="${RECALL_STATE_DIR:-$HOME/.recall}"
  echo "$dir/session.yaml"
}

session_read() {
  local f
  f=$(session_path)
  [[ -f "$f" ]] || return 0
  cat "$f"
}

session_write() {
  local yaml="$1"
  local f dir
  f=$(session_path)
  dir=$(dirname "$f")
  mkdir -p "$dir"
  printf '%s\n' "$yaml" > "$f"
}
