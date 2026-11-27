#!/usr/bin/env bash
# Pipes SubagentStart payloads into subagent-rules.sh and checks the output:
# valid JSON carrying the rules file for Explore and Plan, nothing for other agent
# types, and nothing (exit 0) for a malformed payload.
# Usage: bash hooks/tests/subagent-rules.test.sh
set -uo pipefail

hooks_dir="$(cd "$(dirname "$0")/.." && pwd)"
hook="$hooks_dir/subagent-rules.sh"
rules="$hooks_dir/subagent-rules.md"

failures=0
pass() { echo "ok   $1"; }
fail() { echo "FAIL $1"; failures=$((failures + 1)); }

# Sets out to the hook's stdout and run_status to its exit code.
run_hook() {
  out="$(printf '%s' "$1" | bash "$hook" 2>/dev/null)"
  run_status=$?
}

for agent in Explore Plan; do
  payload="{\"hook_event_name\": \"SubagentStart\", \"agent_type\": \"$agent\"}"
  run_hook "$payload"
  if [ "$run_status" = 0 ] && printf '%s' "$out" | RULES_FILE="$rules" python3 -c '
import json, os, sys
d = json.load(sys.stdin)["hookSpecificOutput"]
want = open(os.environ["RULES_FILE"], encoding="utf-8").read()
sys.exit(0 if d["hookEventName"] == "SubagentStart" and d["additionalContext"] == want else 1)'; then
    pass "$agent gets the rules as additionalContext"
  else
    fail "$agent gets the rules as additionalContext"
  fi
done

for agent in general-purpose reviewer web-fetch explore ""; do
  run_hook "{\"hook_event_name\": \"SubagentStart\", \"agent_type\": \"$agent\"}"
  if [ "$run_status" = 0 ] && [ -z "$out" ]; then
    pass "agent type '$agent' gets no output"
  else
    fail "agent type '$agent' gets no output (exit $run_status)"
  fi
done

for bad in '' 'not json' '{"agent_type": ' '[]' 'null'; do
  run_hook "$bad"
  if [ "$run_status" = 0 ] && [ -z "$out" ]; then
    pass "malformed payload '$bad' exits 0 with no output"
  else
    fail "malformed payload '$bad' exits 0 with no output (exit $run_status)"
  fi
done

echo
[ "$failures" = 0 ] && echo "all passed" || { echo "$failures failed"; exit 1; }
