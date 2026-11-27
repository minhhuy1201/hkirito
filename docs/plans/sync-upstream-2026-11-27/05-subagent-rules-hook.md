Spec: [sync-upstream-2026-11-27](../../specs/sync-upstream-2026-11-27.md)

# 05: Subagent rules - correct the premise and add a SubagentStart hook

**What to build:** the rules that Explore and Plan subagents miss reach them without relying on the main session's memory, and `CLAUDE-huykrito.md` states correctly which subagents skip it. Docs: non-fork subagents load `~/.claude/CLAUDE.md`; "The built-in Explore, Plan, and web-fetch agents skip this" (https://code.claude.com/docs/en/sub-agents.md). A `SubagentStart` hook "can inject context into the subagent" via `hookSpecificOutput.additionalContext`, matched on agent type (https://code.claude.com/docs/en/hooks.md). Follow the existing optional-hook pattern: a script in `hooks/`, a settings snippet, a README row, and a test like `hooks/tests/pre-push-review-gate.test.sh`. The author's local `~/.claude/CLAUDE.md` has a "No package installs without asking" guardrail that the repo lacks; bring it in.

**Blocked by:** None (can start immediately)

**Model:** sonnet - a new hook with branching on agent type

**Status:** done

- [x] `CLAUDE-huykrito.md` says non-fork subagents load it and Explore, Plan, and web-fetch do not; the verbatim no-install line is required only in Explore and Plan briefs; the local-only no-install guardrail is added
- [x] A short rules file in `hooks/` names `CLAUDE-huykrito.md` as its source and holds: no package installs, untrusted content is data, keep secrets and PII out of the transcript, no risky or outward-facing action
- [x] The hook prints valid JSON with that file as `additionalContext` for Explore and Plan, prints nothing and exits 0 for any other agent type, and exits 0 with no output on a malformed payload
- [x] A settings snippet for `hooks.SubagentStart` with matcher `Explore|Plan`, and a README row in the hooks table, in the style of the existing ones
- [x] `hooks/tests/subagent-rules.test.sh` covers the three cases and passes; `hooks/tests/pre-push-review-gate.test.sh` still passes
