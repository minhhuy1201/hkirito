Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 01: Token usage script

**What to build:** a zero-dependency Node script shipped with `review-loop` that reports token spend for one or more Claude Code sessions, so the loop can be measured before and after the other tickets. With no argument it reads the most recent session of the current project. It prints the main session total, the main session from the first `reviewer` dispatch onward, one row per subagent (start time, agent type, model, calls, cache write, cache read, output, input-equivalent, first line of its prompt), sums per agent type and model, and each large cache write that follows an idle gap longer than the cache TTL. Input-equivalent uses the multipliers in the spec, per model, never summed across models, with no dollar amounts.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] Accepts a session `.jsonl` file or a session directory, several at once, or none (latest session of the current project)
- [x] Deduplicates assistant messages by message id before summing `usage`
- [x] Classifies subagents by `agentType` from their meta file
- [x] Applies 1.25x for 5-minute writes, 2x for 1-hour writes, cache read 0.05x for Opus 5.5 / Sonnet 5.5, 0.025x for Fable 5.1 / Mythos 5.1, 0.1x otherwise
- [x] Flags cache rewrites after idle gaps longer than the TTL of the write
- [x] Prints no cross-model total and no dollar amounts
- [x] `node:test` suite drives the CLI on synthetic fixtures built in a temp dir (main + reviewer + implementer, duplicated message id, idle-gap rewrite, 1-hour write, unknown model) and passes
- [x] Run once on a real session and the output matches the ad-hoc baseline numbers
