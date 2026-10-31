Spec: [cheaper-review-loop](../../specs/cheaper-review-loop.md)

# 02: Deterministic gate and checks block

**What to build:** no reviewer is dispatched while the project's tests, lint, or typecheck fail. Before every snapshot a reviewer will see, the main session runs the three checks, fixes failures, and re-runs until green; a check the project lacks or cannot run is recorded as `not run: <reason>` and does not block. Fixing red checks costs no review round. The reviewer prompt gains a `## Checks` block (command, exit code, failing tail) and the diff stat, states that checks are green, and drops the instruction to run them; the reviewer re-runs a check only when a finding needs evidence the block lacks, skips anything tooling enforces, and batches reads and commands into few tool calls. The `implementer` reports done only when acceptance criteria pass and tests, lint, and typecheck are green, with their output in the hand-back.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `review-loop` requires green checks before every reviewer dispatch, including round 1
- [x] Missing or unrunnable checks are named in `## Checks` and do not block
- [x] Reviewer prompt carries `## Checks` and diff stat in the "This round" part, keeping the fixed-first order
- [x] Reviewer instructions say: do not re-run checks unless a finding needs it; batch tool calls; skip tooling-enforced issues; `must-fix` evidence rule still holds
- [x] `agents/implementer.md` done condition and hand-back cover all three checks
