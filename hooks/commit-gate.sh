#!/usr/bin/env bash
# Claude Code PreToolUse hook (matcher: Bash). Blocks `git commit` until /tidy has run on the staged diff.
# Optional: only active after hooks/settings-snippet.json is pasted into ~/.claude/settings.json.
set -uo pipefail

input=$(cat)
command=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("tool_input",{}).get("command",""))' 2>/dev/null) || exit 0
cwd=$(printf '%s' "$input" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("cwd",""))' 2>/dev/null)

printf '%s' "$command" | grep -Eq '(^|[;&|(]|&&)[[:space:]]*git[[:space:]]+(-[^ ]+[[:space:]]+)*commit([[:space:]]|$)' || exit 0

git_dir=$(git -C "${cwd:-.}" rev-parse --git-dir 2>/dev/null) || exit 0
current=$(git -C "${cwd:-.}" diff --cached | sha256sum | cut -d' ' -f1)
marked=$(cat "$(git -C "${cwd:-.}" rev-parse --absolute-git-dir)/kirito-tidy" 2>/dev/null || true)

if [ "$current" != "$marked" ]; then
  echo "Blocked: the staged diff has not been through /tidy. Run /tidy, then commit again." >&2
  exit 2
fi
