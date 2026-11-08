#!/usr/bin/env bash
# Runs pre-push-review-gate.sh against Bash tool payloads in a throwaway repo with no
# review marker, and checks which commands it allows (exit 0) or blocks (exit 2).
# Usage: bash hooks/tests/pre-push-review-gate.test.sh
set -uo pipefail

hook="$(cd "$(dirname "$0")/.." && pwd)/pre-push-review-gate.sh"
repo="$(mktemp -d)"
trap 'rm -rf "$repo"' EXIT
git -C "$repo" init -q
git -C "$repo" -c user.name=t -c user.email=t@t commit -q --allow-empty -m init

failures=0
expect() {
  local want="$1" cmd="$2" payload got
  payload="$(CMD="$cmd" python3 -c 'import json, os; print(json.dumps({"tool_name": "Bash", "tool_input": {"command": os.environ["CMD"]}}))')"
  (cd "$repo" && printf '%s' "$payload" | bash "$hook" >/dev/null 2>&1)
  got=$?
  if [ "$got" = "$want" ]; then
    echo "ok   exit $got  $cmd"
  else
    echo "FAIL exit $got (want $want)  $cmd"
    failures=$((failures + 1))
  fi
}

# Deleting remote branches pushes no commits, so no review is needed.
expect 0 'git push origin --delete feat/x'
expect 0 'git push --delete origin feat/x feat/y'
expect 0 'git push -d origin feat/x'
expect 0 'git push origin :feat/x'
expect 0 'git push origin :feat/x :feat/y'
expect 0 'git -C /tmp/r push origin --delete feat/x'
expect 0 'git branch -d feat/x && git push origin --delete feat/x 2>&1 | tail -2; git branch -a'
expect 0 'git commit -m wip && git push origin --delete feat/x'

# Anything that can send commits stays gated.
expect 2 'git push'
expect 2 'git push origin main'
expect 2 'git push origin :feat/x main'
expect 2 'git push --delete origin'
expect 2 'git push origin :'
expect 2 'git push --mirror origin'
expect 2 'git push --all --delete origin feat/x'
expect 2 'git push origin --delete feat/x && git push origin main'
expect 2 'git commit -m wip && git push'

echo
[ "$failures" = 0 ] && echo "all passed" || { echo "$failures failed"; exit 1; }
