# Spec: cheaper review loop

Status: approved

## Problem Statement

The review loop (`pr` route → `review-loop` → `reviewer` subagents → `pr-review` gate) burns more tokens than the work needs. Transcripts from six real sessions (hkirito and one product repo, measured from the per-message `usage` that Claude Code records) show where it goes:

- **The main session, not the reviewers, is the largest cost of the review phase.** From the first reviewer dispatch onward, the main session spent roughly 2.4 times what all reviewers together spent. It enters the review phase carrying the whole feature conversation (150-230K tokens per call) and re-reads it on every relay, fix dispatch, and marker write.
- **Idle gaps rewrite the whole context.** The main session runs on a 1-hour cache TTL, and a 1-hour cache write costs 2x base input. In one session, four returns after more than an hour of idle rewrote 200-380K of context each, close to half that session's total.
- **The gate is a second full review.** The final `pr-review` round re-reviews `<base>...HEAD` even when earlier rounds already covered it, and any commit after the gate (even a nit fix) runs it again in full. Gate rounds were roughly 40% of reviewer spend.
- **Reviewers re-run what was already run.** Each reviewer takes 7-42 model calls; many are separate one-command Bash calls, and it re-runs tests, lint, and typecheck that the main session or a verification agent had just run.
- **Review fixes in delegate mode go to a fresh implementer** that rebuilds context for a one- or two-line change.
- **Nothing stops the reviewer from being called on red checks.** `review-loop` only asks to run tests, lint, and typecheck between rounds, with no pass requirement and nothing before round 1, and it tells the reviewer to run them itself. The implementer's done condition covers typecheck only. So the most expensive model can spend a round on errors a compiler or linter would catch.
- **Recurring findings are paid for on every PR.** A class of defect the reviewer flags again and again never moves into a rule the implementer reads up front.
- **Every role runs on a fixed model regardless of the work.** In delegate mode the main session stays on Opus through implementation and review even when it only dispatches, relays, and fixes nits; implementers always run on Sonnet, even for mechanical tickets a much cheaper model could do.
- **Nothing measures any of this.** The numbers above came from an ad-hoc script.

## Solution

Ten changes, all inside the harness:

1. The `pr` route starts from a clean context: when the session already did other work, it writes a handoff into a review log stored under `.git/`, and asks the user to `/clear` and resume the `pr` route from that log.
2. At most **3 review rounds, gate included**. Every round follows the `pr-review` checklist, so a round that reviews the committed `HEAD` and finds no `must-fix` *is* the gate. No separate full re-review.
3. The reviewer prompt carries the check results (tests, lint, typecheck) and a diff stat the main session already has; the reviewer re-runs a check only when it needs evidence the given output does not provide.
4. In delegate mode, small review fixes (at most 2 files, no interface change) are made inline by the main session, except a `must-fix` on an unescalated `haiku` ticket, which escalates to Sonnet in the batch; larger ones go to one implementer for the whole batch.
5. Reviewers report findings by class: one finding per kind of defect, listing every location, so one fix pass handles all of them.
6. A token usage script reports per-session spend by main session, agent type, and each reviewer, plus cache rewrites after idle gaps.
7. A deterministic gate before every reviewer dispatch: the project's tests, lint, and typecheck must pass first. Red checks are fixed without calling the reviewer, so the reviewer spends its effort on design, edge cases, and whether the change meets the spec. The implementer's done condition widens to the same three checks.
8. A per-repo `REVIEW.md` of recurring finding classes: in the commit step before the round expected to pass, the main session proposes adding every `must-fix` class to it, or a lint rule when one can express it; the user approves each entry. Implementers and reviewers read it up front.
9. The main session runs on Sonnet 5.5 while it orchestrates: delegate-mode implementation and the whole `pr` route. Opus 5.5 stays for specs, plans, and the reviewer. Sonnet's list price is half of Opus's for every token kind, and the main session is the largest share of spend.
10. Implementer model routing with escalation: `to-tickets` tags each ticket with the model that implements it, Haiku 5.5 for mechanical tickets and Sonnet 5.5 otherwise; a Haiku ticket that fails its checks twice or gets a `must-fix` in review is re-dispatched on Sonnet.

## User Stories

1. As a developer, I want the `pr` route to run in a clean context, so that every review round does not re-read the whole feature conversation.
2. As a developer, I want the handoff written before I clear, so that clearing loses nothing the loop needs.
3. As a developer, I want the handoff stored where it survives `/clear`, session change, and context compaction, and never shows up in `git status`, so that I don't commit it by accident.
4. As a developer, I want one clear message telling me to `/clear` and the exact command to resume, so that the extra step costs me one paste.
5. As a developer who opened a fresh session just to review, I want the handoff step skipped, so that I don't clear a context that is already clean.
6. As a developer, I want resuming from the log to rebuild everything the loop needs (spec path, base, branch, ticket list, check commands, delegate on or off, round history), so that the clean session does not re-explore the repo.
7. As a developer, I want at most 3 review rounds including the gate, so that a non-converging loop stops early and comes back to me.
8. As a developer, I want a round that reviews the committed `HEAD` with zero `must-fix` to count as the gate, so that a clean first round passes in one round instead of two.
9. As a developer, I want the gate round to cover only what earlier rounds have not reviewed, plus verification of fixed items, so that the same code is not reviewed twice.
10. As a developer, I want a commit after the gate (such as a nit fix) to be re-reviewed only on its own diff, so that a one-line change does not trigger a full review.
11. As a developer, I want the `## Self-review` block and the push marker produced exactly as today, so that the PR template, the CI self-review check, and the push gate keep working.
12. As a developer, I want the loop to stop and report (log path, open `must-fix` items, latest Needs human review list) when round 3 ends without a pass, so that I decide whether the ticket was scoped wrong.
13. As a developer, I want the reviewer to get the check output I already have, so that it does not pay to run the suite again.
14. As a developer, I want the reviewer to still run a check when a finding needs evidence the given output lacks, so that `must-fix` keeps its evidence rule.
15. As a developer, I want the reviewer to batch its reads into few tool calls, so that each round makes fewer model calls.
16. As a developer in delegate mode, I want small fixes made inline, so that I don't pay for a fresh implementer to change two lines.
17. As a developer in delegate mode, I want larger fixes sent to one implementer with the finding ids, locations, and the files to read, so that it does not re-explore the repo.
18. As a developer, I want each finding to name the class of defect and list every location in the diff, so that one fix pass clears the class and the next round does not trickle out siblings.
19. As a developer, I want a reviewer to search the diff for siblings of a defect before reporting it, so that class findings are complete.
20. As a developer, I want a command that reports tokens per session by main session, agent type, and each subagent, so that I can measure the loop before and after a change.
21. As a developer, I want the report to show the main session's spend from the first reviewer dispatch onward, so that I see the review phase apart from planning.
22. As a developer, I want the report to flag cache rewrites after idle gaps, so that I see what leaving a session open costs.
23. As a developer, I want spend shown in input-equivalent units per model using the published cache multipliers, so that cache reads, cache writes, and fresh input are comparable without assuming dollar prices.
24. As a developer, I want the report to run with no install beyond Node, so that it works on any machine that runs the harness.
25. As a teammate adapting hkirito, I want the README to describe the new loop and the script, so that I can adopt them without reading the spec.
26. As a developer, I want no reviewer dispatched while tests, lint, or typecheck fail, so that the expensive model never reports a compile error.
27. As a developer, I want a check that cannot run (missing tool, no test suite) named in the `## Checks` block instead of blocking the loop, so that repos without one of the three checks still get reviewed.
28. As a developer in delegate mode, I want the implementer to report done only when tests, lint, and typecheck all pass, so that red checks are caught before they reach the main session.
29. As a developer, I want the reviewer told that checks are green and not to report anything tooling enforces, so that it spends its effort on design, edge cases, and the spec.
30. As a developer, I want recurring finding classes proposed for `REVIEW.md` or a lint rule before the round expected to pass, so that the next PR does not pay to find them again.
31. As a developer, I want to approve each `REVIEW.md` entry before it is written, so that the file holds only rules I agree with.
32. As a developer, I want implementers and reviewers to read `REVIEW.md` when it exists, so that known pitfalls are avoided up front and checked as a documented standard.
33. As a developer, I want model switches only at a cleared boundary (`/clear`, `/model`, resume command) after the ticket breakdown is approved and at the `pr` handoff, so that orchestration does not run at Opus prices and no switch re-bills a warm context uncached.
34. As a developer, I want later spec or plan work to start in a new Opus session, so that design work keeps the stronger model.
35. As a developer, I want the reviewer to stay on Opus no matter which model the main session runs, so that review quality does not drop with the cheaper orchestrator.
36. As a developer, I want each ticket to state which model implements it and why, so that I can overrule the choice when I approve the tickets.
37. As a developer, I want mechanical tickets sent to Haiku by a written rule, so that the choice is predictable rather than a judgement call each time.
38. As a developer, I want a Haiku ticket that fails twice or draws a `must-fix` re-run on Sonnet automatically, so that a cheap model never costs more than it saves.
39. As a developer, I want each escalation recorded in the ticket and the review log, so that I can see how often Haiku falls short and tune the rule.
40. As a developer, I want the usage script to show implementer spend per model, so that I can compare Haiku and Sonnet tickets on real PRs.

## Implementation Decisions

**Review log location.** The log moves from the session scratchpad to a per-branch file under the repo's git directory, resolved with `git rev-parse --git-path`, next to the existing `tidy` mark. It survives `/clear` (which starts a new session and a new scratchpad), is per worktree, and is never tracked. It gains a `## Handoff` section: spec and plan paths, base, branch, ticket list with status, check commands, whether delegate mode is on, and the last snapshot reviewed.

**Handoff step (pr route, step 0).** When the session did anything before the `pr` route, the main session writes the handoff, commits nothing new, and stops with one message: run `/clear`, then `/kirito-mode pr <log path>`. When the `pr` route is the first thing the session does, or it was started with a log path, step 0 is skipped and the loop resumes from the log.

**Round model.** At most 3 rounds, gate included. Round 1 is a full review of `<base>`..snapshot. Later rounds verify `FIXED` / `ANSWERED` / `DISPUTED` items and review only the diff since the previous reviewed snapshot. Every round's prompt includes the `pr-review` checklist (project skill when present, else global), so every round reviews against the same standard.

**Gate.** A round is the gate when its snapshot equals the committed `HEAD` tree with a clean working tree, it returns zero `must-fix`, nothing is `NOT_FIXED` or `UPHELD`, and no `DISPUTED` item is left unruled. That round also returns the `pr-review` `## Review Summary` and `## Self-review` block for `HEAD`; the main session writes the marker as today. The Self-review block's checklist ticks reflect the groups walked across all rounds. Committing before a round needs the user's go-ahead, as today; the main session commits before the round it expects to pass when the user has approved it.

**Post-gate commits.** A commit after the gate invalidates the marker, as today. The next round reviews only `git diff <gated tree> <new HEAD tree>` and counts toward the cap; when the gate already passed in round 3, the main session stops and asks the user whether to allow a fourth round.

**Stop rule.** Stop and report at the first of: round 3 ends without a pass; a reviewer returns `UPHELD`.

**Reviewer prompt.** Order stays fixed-first for caching: spec, review log, then this round. "This round" gains a `## Checks` block (each command, its exit code, and the failing tail of its output, captured by the main session before the snapshot) and the diff stat. The reviewer re-runs a check only when a finding needs evidence the block does not give, or the block predates the snapshot. The reviewer is told to batch reads and commands into as few tool calls as possible.

**Findings by class.** The output schema's finding gains a `class` (short name of the defect kind) and replaces the single `file` / `line` with a `locations` list. The reviewer searches the reviewed scope for siblings before reporting. "Do not repeat a finding already in the log" extends to the class: a new location of a logged class is added to the existing finding, not raised as a new one. The `## Findings` log line format carries the class and all locations.

**Deterministic gate.** Before every snapshot that a reviewer will see, the main session runs the project's tests, lint, and typecheck. Any failure is fixed (inline, or by the implementer under the inline-fix rule) and the checks re-run; no reviewer is dispatched until all available checks pass. A check the project lacks or that cannot run is recorded as `not run: <reason>` in `## Checks` and does not block. Fixing red checks does not consume a review round. The reviewer prompt states the checks are green and drops the instruction to run them; the reviewer skips anything tooling enforces. The `implementer` agent's done condition becomes: acceptance criteria pass and tests, lint, and typecheck are green, with their output in the hand-back.

**REVIEW.md.** A per-repo file at the repo root listing recurring finding classes, one entry per class: the class name, the rule in one line, and one short example. In the commit step before the round it expects to pass (so entries are in the `HEAD` the gate reviews and no marker exemption is needed), the main session lists each `must-fix` class from the log and proposes for each either a `REVIEW.md` entry or a lint rule when the project's linter can express it. A class that recurs although `REVIEW.md` already lists it is proposed as a lint rule, since the written rule did not stop it. The user approves each one; approved entries ship in the same PR. The reviewer's Standards axis treats `REVIEW.md` as a documented standard, and the implementer reads it with the ticket. No file is created until the first entry is approved.

**Main session model.** The main session cannot change its own model; it asks the user to switch (`/model`). The prompt cache is per model, so a mid-context switch re-bills the whole context uncached; every switch therefore happens only at a cleared phase boundary: write the handoff, stop, and tell the user to `/clear`, `/model <x>`, and run a resume command. Grill, spec, tickets, and architect work run on Opus 5.5 in one session; once the breakdown is approved the `feature` route stops with `/clear`, `/model` Sonnet 5.5, `/kirito-mode [--delegate] feature <plan dir>` (the resume entry reads the spec and tickets and starts at step 6), and the `pr` handoff message does the same with `pr <log path>`. Later spec or plan work means a new Opus session. Inline (non-delegate) implementation already runs on Sonnet and is unchanged. The `reviewer` keeps `claude-opus-5-5` pinned in its frontmatter and is dispatched with no `model` override, so the main session's model never reaches it. The repo's copy of the author's global instructions (`CLAUDE-huykrito.md`) changes its Model routing rule to match; the author syncs their live global file by hand.

**Implementer routing.** `to-tickets` adds a `Model:` line to every ticket, `haiku` or `sonnet`, with a one-line reason. A ticket is `haiku` only when all hold: it touches at most 2 files; it follows a pattern that already exists in the repo, named in the ticket; it adds no business logic, branching rule, or interface change. Anything else is `sonnet`. The user can change the line when approving tickets. In delegate mode the main session dispatches `implementer` with the `model` override taken from the ticket; the agent's frontmatter default stays Sonnet for tickets without the line. Escalation: a `haiku` ticket whose implementer hands back failing checks twice, or that draws a `must-fix` in review, is re-dispatched once on Sonnet with the previous hand-back and findings; the ticket records `Escalated: haiku → sonnet (<reason>)` and the review log notes it. Review fixes for an escalated ticket also go to Sonnet. Haiku's lower price applies to prompts up to 100K tokens and rises above that, still below Sonnet's.

**Inline fixes in delegate mode.** Between rounds, the main session fixes inline any open finding whose fix touches at most 2 files and changes no interface (exports, signatures, schemas, wire formats), whatever its severity - except a `must-fix` on a `haiku` ticket not yet escalated, which escalates to Sonnet and goes to the batch. Remaining findings go to one fresh `implementer` dispatch for the whole batch, run on Sonnet when any finding sits on an escalated, `sonnet`, or untagged ticket or a `haiku` ticket with a `must-fix`, with finding ids, classes, locations, the spec path, and the instruction to read only the listed files and what they import. Outside delegate mode nothing changes: the main session fixes everything inline.

**Usage script.** A zero-dependency Node script shipped with `review-loop`. Input: one or more session transcripts (a session `.jsonl` file or its directory); with no argument, the most recent session of the current project. It deduplicates assistant messages by message id, reads `usage` from each, classifies subagents by `agentType` from their meta file, and prints: main session total; main session from the first `reviewer` dispatch; one row per subagent (start time, type, model, calls, cache write, cache read, output, input-equivalent, first line of its prompt); sums per type and model; and each cache write over a threshold that follows an idle gap longer than the cache TTL. Input-equivalent applies the published multipliers: 5-minute cache write 1.25x, 1-hour cache write 2x, cache read 0.05x for Opus 5.5 and Sonnet 5.5, 0.025x for Fable 5.1 and Mythos 5.1, 0.1x for any other model. Units are never summed across models. It prints no dollar amounts.

**Docs.** README's flow description, the `kirito-mode` router's rules, the `review-loop` skill, the `pr` route, the feature route's delegate step, the `to-tickets` ticket template, `agents/reviewer.md`, `agents/implementer.md`, and `CLAUDE-huykrito.md` change to match. The `kirito-mode` spec's mention of the loop is updated where it states the round count.

## Testing Decisions

- A good test drives the script through its command-line interface on fixture transcripts and asserts on the printed report; it does not import internals.
- One seam: the usage script's CLI. Fixtures are small synthetic `.jsonl` files and meta files built in a temp directory by the test: a main session with a reviewer and an implementer subagent, a duplicated message id, an idle gap that triggers a rewrite, a 1-hour TTL write, and a model outside the multiplier table. Assertions cover dedupe, per-type sums, the from-first-reviewer split, the rewrite flag, multipliers per model, and that no cross-model total is printed.
- Prior art: the `statechart` scripts' tests, which use `node:test`, build fixtures in a temp dir, and spawn the script.
- The skill and agent text changes have no automated test. They are verified by running one real PR through the new loop and comparing its report from the usage script with the baseline sessions measured for this spec.

## Out of Scope

- Changing the reviewer's model or effort, and risk-based review depth.
- Haiku for the main session or the reviewer; effort as a per-ticket knob.
- Switching models automatically; the user switches the main session.
- Running implementers in parallel.
- Resuming subagents with `SendMessage`.
- Writing `REVIEW.md` entries or lint rules without the user's approval, and cross-PR tracking of finding classes beyond what `REVIEW.md` itself records.
- Logging tokens into the review log at runtime; the script is run by hand.
- Dollar cost estimates.
- Changing the `pr-review` checklist itself, the push gate hook, or the CI self-review workflow.
- The installed copies in `~/.claude/` drifting from the repo; install is by symlink per README.

## Further Notes

- Hypothesis from the baseline, not yet measured: in one session, a delegate-mode implementer waited about 15 minutes between calls twenty times, each time missing its 5-minute cache and rewriting its context. The likely cause is waiting on permission prompts. The usage script's rewrite flag will show whether this recurs; any fix is a separate change.
- No data yet shows how Haiku 5.5 performs on these repos. The routing rule is a starting point; the usage script's per-model implementer spend and the escalation records decide whether to widen or narrow it.
- Prices come from https://platform.claude.com/docs/en/about-claude/pricing: Opus 5.5 "$4 / MTok" input and "$20 / MTok" output, Sonnet 5.5 "$2 / MTok" and "$10 / MTok", Haiku 5.5 "(for prompts up to 100,000 tokens)" "$0.10 / MTok" and "$0.50 / MTok", "(for prompts over 100,000 tokens)" "$0.50 / MTok" and "$2.50 / MTok".
- Cache multipliers come from https://platform.claude.com/docs/en/build-with-claude/prompt-caching: "Cache write tokens with a 5-minute TTL are 1.25 times the base input tokens price", "Cache write tokens with a 1-hour TTL are 2 times the base input tokens price", "Cache hits and refreshes on Claude Opus 5.5 and Claude Sonnet 5.5 are priced at 0.05x the base input price".
