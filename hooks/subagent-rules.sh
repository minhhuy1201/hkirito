#!/usr/bin/env bash
# SubagentStart hook: inject hooks/subagent-rules.md into Explore and Plan subagents,
# which skip ~/.claude/CLAUDE.md. Other agent types already load it, so they get nothing.
#
# Wiring: hooks.SubagentStart with matcher "Explore|Plan" (see hooks/settings-snippet-subagent-rules.json).
# Output: {"hookSpecificOutput": {"hookEventName": "SubagentStart", "additionalContext": "<rules>"}}
#
# Always exits 0; a malformed payload or a missing rules file prints nothing.
set -uo pipefail

rules="$(cd "$(dirname "$0")" && pwd)/subagent-rules.md"

HOOK_INPUT="$(cat)" RULES_FILE="$rules" python3 - <<'PY' 2>/dev/null
import os, json
try:
    data = json.loads(os.environ.get("HOOK_INPUT") or "")
    if data.get("agent_type") not in ("Explore", "Plan"):
        raise SystemExit(0)
    with open(os.environ["RULES_FILE"], encoding="utf-8") as f:
        rules = f.read()
except (Exception, SystemExit):
    raise SystemExit(0)
print(json.dumps({"hookSpecificOutput": {"hookEventName": "SubagentStart", "additionalContext": rules}}))
PY
exit 0
