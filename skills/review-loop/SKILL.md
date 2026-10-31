---
name: review-loop
description: Implement-review loop for work written in this session - a fresh `reviewer` subagent each round, ending in the `pr-review` gate (project or global) before push. Use when reviewing your own changes before pushing.
---

# Review loop

The main session implements inline; every review round dispatches a **fresh** `reviewer` subagent (new `Agent` call, never a `model` override - that is for implementers only). Continuity between rounds lives in the **review log**, never in the reviewer's memory.

## Review log

A Markdown file per branch under the git directory, never in the scratchpad: `$(git rev-parse --git-path kirito-review/<branch with / replaced by ->.md)`, created with `mkdir -p` on its parent. Resolving through `git rev-parse --git-path` makes it per worktree and untracked, and it survives `/clear` and context compaction (a new session gets a new scratchpad, not a new git directory). Use its absolute path when handing it to the user. It is the single source of truth for loop state. It holds:

- `## Handoff` - what a fresh session needs to resume without re-exploring (see "Handoff" below).
- `## Spec` - task spec and acceptance criteria, written once before round 1 and left byte-identical afterwards.
- `## Snapshots` - one line per round: `R<n>: <tree-sha>`.
- `## Findings` - one line per finding: `[R<n>-#<id>] <severity> <axis> <class> file:line, file:line - issue → <status>`. `<axis>` is `standards` or `spec`; `<class>` is the short name of the defect kind; the locations are every place the class occurs, comma-separated.

Severities: `must-fix`, `should-fix`, `nit`, `question` (the reviewer needs the author's clarification).
A `must-fix` needs evidence - the failing output of a command the reviewer ran, or the quoted standard or spec line the diff breaks; without it the finding is at most `should-fix`.

Axes: every finding sits on one of two axes. **Standards** asks whether the change follows the repo's documented coding standards and the smell baseline in `code-smells.md` (next to this file). **Spec** asks whether the change does what the log's `## Spec` asked. A change can pass one axis and fail the other, so report them apart and never merge or rerank across axes.

Findings are by class: one finding per kind of defect, listing every location. A new location of a class already in the log is never a new finding: add it to the existing finding (same id, locations extended). The status stays as it is, except `FIXED`, which reopens as `OPEN` because the class is not fully fixed.

Statuses:

- `OPEN` - not yet handled.
- `FIXED` - fixed in a later round; the next reviewer verifies it.
- `ANSWERED: <answer>` - the main session's reply to a `question`; the next reviewer may raise a new finding from it.
- `WONTFIX: <reason>` - only for `should-fix` and `nit`; the main session may set it.
- `DISPUTED: <reason>` - the main session's rebuttal of a `must-fix`. The next reviewer rules on it: `ACCEPTED` turns it into `WONTFIX`, `UPHELD` stops the loop for the human.

## Handoff

The `## Handoff` section is written by the main session whenever the `pr` route hands the loop to a fresh session, and kept current afterwards. It lists exactly:

- spec path and plan path;
- base (resolved as in "Base" below);
- branch;
- ticket list with status, each ticket's files, `Model:` value, and `Escalated:` state (the map from a finding's location to its ticket);
- check commands: test, lint, typecheck (`not run: <reason>` for a missing one);
- delegate mode: on or off;
- last snapshot reviewed: the tree SHA of the latest `## Snapshots` line, or `none` before round 1.

The same step writes `## Spec` (the task spec and acceptance criteria, taken from the spec and tickets) if it is still empty, because a fresh session has no memory to rebuild it from. A session resuming from the log reads `## Handoff` instead of re-exploring the repo. It re-verifies the base with the rule below and takes the last snapshot as the previous snapshot of the next incremental round; with `none`, it starts at round 1.

## Fixes in delegate mode

Read `delegate mode` from the log's `## Handoff` when resuming; only `on` changes how fixes are made. Between rounds, split the `OPEN` findings that need a code fix:

- **Inline:** the main session fixes any finding whose fix touches at most 2 files and changes no interface (exports, signatures, schemas, wire formats), whatever its severity - except a `must-fix` on a `haiku` ticket not yet escalated, which always goes to the batch on Sonnet.
- **Batch:** every remaining finding goes to ONE fresh `implementer` dispatch (new `Agent` call, never `SendMessage`) for the whole batch. The prompt lists each finding's id, class, and locations, plus the spec path, and tells it to read only the listed files and what they import, and to leave tests, lint, and typecheck green per "Pre-review checks" below. Dispatch it with `model: sonnet` when any finding sits on a ticket that is escalated, has `Model: sonnet` or no `Model:` line, or is a `haiku` ticket with a `must-fix` (escalate it per the `feature` route and add the escalation note to the log); a batch of only unescalated `haiku` tickets with no `must-fix` runs with `model: haiku`.

Read the implementer's diff and run the pre-review checks yourself before the next snapshot. Answering, `WONTFIX`, and `DISPUTED` stay with the main session.

## Snapshot

Take a snapshot of the working tree before each round - it captures uncommitted and untracked files without touching the real index or making a commit:

```bash
idx="$(git rev-parse --git-path index).snap"; command cp -f "$(git rev-parse --git-path index)" "$idx" && GIT_INDEX_FILE="$idx" git add -A && GIT_INDEX_FILE="$idx" git write-tree; command rm -f "$idx"
```

Record the printed tree SHA under `## Snapshots`. An incremental round's scope is `git diff <previous-snapshot> <this-snapshot>`; round 1 uses `git diff "$(git merge-base origin/<base> HEAD)" <this-snapshot>` - the merge-base matches `<base>...HEAD`, so commits that landed on the base after branching stay out of scope (three-dot syntax rejects a tree SHA).

**Base** is the PR's real target: `gh pr view --json baseRefName -q .baseRefName` once a PR exists; before that, the base the `pr-review` skill names, confirmed with `git rev-parse --verify origin/<base>`. Ask the user when neither resolves.

## Pre-review checks

No reviewer is dispatched while the project's tests, lint, or typecheck fail. Before every snapshot a reviewer will see - round 1 included - run all three, fix failures, and re-run until green. Fixing red checks costs no review round. A check the project lacks or cannot run is recorded as `not run: <reason>` and never blocks. Capture each command, its exit code, and the failing tail of its output for the prompt's `## Checks` block.

## Rounds

At most **3 rounds, gate included**. Every round follows the `pr-review` checklist (see "pr-review checklist" below), so a round that qualifies as the gate needs no separate full re-review.

1. **Round 1 - full review** of `<merge-base>..<snapshot>`, using the reviewer prompt below.
2. **Later rounds - incremental**: verify every `FIXED`, `ANSWERED`, and `DISPUTED` item, then review only the diff since the previous reviewed snapshot.

Between rounds the main session handles every `OPEN` item: fix it (`FIXED`), answer it (`ANSWERED`), or record `WONTFIX` / `DISPUTED` with a reason. Outside delegate mode the main session fixes every item inline. Run the pre-review checks (above) before the next snapshot. `should-fix`, `nit`, and `question` alone never trigger another round.

**Commit before the round you expect to pass.** The gate reviews the committed `HEAD`, so uncommitted work is outside it. Commit all work before that round - the Git rules in `CLAUDE.md` (protected branches, PR size, commit format) apply, and committing needs the user's go-ahead. A clean round 1 on a committed `HEAD` passes in one round.

**Stop and report to the user** - log path, open `must-fix` items, the latest **Needs human review** list - at the first of:

- round 3 completes without a pass (the gate round counts toward the 3);
- a reviewer returns `UPHELD` on a dispute.

## Gate

A round is the **gate** when all of these hold:

- its snapshot equals the committed `HEAD` tree (`git rev-parse HEAD^{tree}`) with a clean working tree (`git status --porcelain` prints nothing);
- it returns zero `must-fix`;
- nothing is `NOT_FIXED` or `UPHELD`;
- no `DISPUTED` item is unruled.

The main session sets `Gate candidate: yes` in the prompt when the first condition holds. A gate-candidate round also returns the `pr-review` `## Review Summary` and `## Self-review` block for `HEAD`, in English. Only when the round then meets the other three conditions does the main session write the marker, exactly as the `pr-review` skill's step 5 shows. A verdict of Request changes, or any unresolved 🔴 Blocker, means the round is not the gate; fix, commit, and run the next round.

The `## Self-review` block covers the whole loop: its `(fixed: <n>)` counts every `must-fix` the log marks `FIXED`, and its Findings list each of them with how it was fixed. Its Checklist ticks reflect the groups walked across all rounds, not only the gate round. A 💬 Question leaves the verdict to the reviewer: the main session records it as `ANSWERED` in the log and shows it to the user with the **Needs human review** list.

Any commit after the gate - even a nit fix - invalidates the marker and the `## Self-review` SHA. The next round reviews only `git diff <gated tree> <new HEAD tree>`, takes the gated snapshot as its previous snapshot, and counts toward the 3-round cap. When the gate passed in round 3, that round would be a 4th: stop and ask the user whether to allow it.

## Recurring classes

Do this in the commit step before the round you expect to pass, so the entries sit in the committed `HEAD` that round reviews and the marker never needs an exemption. A gate round has zero `must-fix`, so every class that needs a rule is already in the log by then; a class first raised in a round that then fails is proposed before the next round. List each `must-fix` class in the log's `## Findings` and propose, per class, one of:

- a `REVIEW.md` entry at the repo root;
- a lint rule, when the project's linter can express the class.

A class that recurs although `REVIEW.md` already lists it is proposed as a lint rule - the written rule did not stop it.

Entry format (defined here only): one entry per class - the class name, the rule in one line, one short example.

The user approves EACH entry or rule before it is written; an unapproved one is dropped. No file is created until the first entry is approved. Approved entries and lint rules are committed with the rest of the work before that round, so the gate reviews them; the commit-after-gate rule in "Gate" stays unchanged.

## pr-review checklist

Resolve the `pr-review` skill once: the repo's `.claude/skills/pr-review/SKILL.md`, else the global `~/.claude/skills/pr-review/SKILL.md` (read-only reference). Its path goes into every round's prompt, with the instruction to read it and walk its checklist and severity scale over that round's scope, skipping step 5 (the marker; the main session writes it). Log each `pr-review` finding (one per class, as above) with axis `spec` when it quotes the spec, otherwise `standards`. Severity maps both ways: `must-fix` = 🔴 Blocker, `should-fix` / `nit` = 🟡 Nit, `question` = 💬 Question. A multi-location finding stays one item in that skill's output: one line per finding, with its locations comma-separated where the template shows `[file:line]` (`[a.ts:10, b.ts:42]`), and the class named in the issue text. With no `pr-review` skill, rounds use the two axes below alone and there is no marker or `## Self-review` block.

## Before push

Before push and `gh pr create` (both asked first, per `CLAUDE.md`), show the user the latest **Needs human review** list. The `## Self-review` block goes into the PR body verbatim, in English; Vietnamese stays in chat. Invoke `pr-sketch` while writing that body.

Run `git commit` and `git push` as separate Bash calls: a project push gate compares its marker with `HEAD` before the whole command runs, so a chained commit slips past it.

When the PR is already open, every push moves the PR head. After the gate passes on the new `HEAD` and before the push, replace the `<!-- pr-review: sha=... -->` block in the PR body with the new `## Self-review` block (`gh pr edit <n> --body-file <file>`, keeping the rest of the body). After the push, confirm with `gh pr view <n> --json body,headRefOid` that the body's sha is a prefix of `headRefOid`.

## Reviewer prompt

Used for every round. Build it in this order - static instructions first, then the fixed spec, then per-round data, so the prompt prefix stays stable across rounds (caching is a prefix match):

```
## Instructions
Verify every FIXED and ANSWERED item in the review log below, and rule ACCEPTED or UPHELD on every DISPUTED item.
Read the pr-review skill at the path under "## This round" and walk its checklist over that round's scope, skipping its step 5 (the marker).
If Gate candidate (under "## This round") is yes and you find zero must-fix with nothing NOT_FIXED or UPHELD, also return review_summary: that skill's ## Review Summary and ## Self-review block for HEAD <sha>, in English. Tick checklist groups you walked in this round or that the log shows earlier rounds walked.
Report one finding per class of defect. Before reporting a defect, search the whole scope for siblings of it and list every location in that one finding's `locations`. Do not repeat a finding already in the log, and that covers its class: a new location of a logged class goes in as that finding's id with its locations extended, never as a new finding.
Re-raise a WONTFIX item (any location of its class) only with a reason the log does not already answer.
Checks are green (see the Checks block at the end of this prompt). Do not re-run them unless a finding needs evidence the block lacks or the block predates the snapshot; attach that output to the finding it backs.
Batch reads and commands into as few tool calls as you can.
A must-fix needs evidence: failing output you ran, or the quoted standard or spec line it breaks. Without it, report should-fix at most.

## Two axes
Review along two separate axes and tag every finding with its `axis`.

**Standards.** Find every file that documents how code is written here (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, lint and format config, `REVIEW.md`, docs under `docs/`). Report (a) each place the diff breaks a documented standard, citing the standard's file and rule, and (b) each smell from `<path to code-smells.md>`, naming it and quoting the hunk. Read `<path to code-smells.md>` in full first. A documented standard overrides the baseline. Baseline hits are judgement calls. Skip anything tooling enforces.

**Spec.** Compare the diff to the task spec below. Report (a) requirements that are missing or only partly done, (b) behaviour in the diff that the spec did not ask for (scope creep), and (c) requirements that look done but are wrong. Quote the spec line for each finding. With no spec section, skip this axis and say so.

## Output
JSON only:
{
  "verdicts": [{"id": "R<n>-#<id>", "verdict": "VERIFIED | NOT_FIXED | ACCEPTED | UPHELD", "reason": "..."}],
  "findings": [{"id": "R<n>-#<id>", "severity": "must-fix | should-fix | nit | question", "axis": "standards | spec", "class": "<short name of the defect kind>", "locations": [{"file": "...", "line": 0}], "issue": "...", "suggestion": "...", "evidence": "test/lint output or null"}],
  "review_summary": "<pr-review ## Review Summary and ## Self-review block, only when Gate candidate is yes and the round is clean; otherwise null>",
  "needs_human_review": "<one Markdown block, in the layout agents/reviewer.md defines>"
}
Write needs_human_review in Vietnamese; everything else in English.

## Task spec & acceptance criteria
<the log's ## Spec section, verbatim>

## Review log
<the log's ## Findings section, verbatim>

## This round
Round <n> of 3 - <full | incremental>.
Gate candidate: <yes - snapshot equals the committed HEAD tree with a clean working tree | no>
Scope: git diff <from> <to>
Diff stat: <git diff --stat <from> <to>>
Related files to read if needed: <paths>
pr-review skill: <path>

## Checks
<per command: command, exit code, failing tail of output; `not run: <reason>` for a check that is missing or cannot run>
```

`NOT_FIXED` reopens the item as `OPEN`. Fill `<path to code-smells.md>` with the absolute path of that file in this skill's folder. After each round, update the log, then relay the findings to the user under `## Standards` and `## Spec` headings, never merged or reranked across axes, and relay `needs_human_review` verbatim as its own block after the findings.
