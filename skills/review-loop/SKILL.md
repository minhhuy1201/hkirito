---
name: review-loop
description: Implement-review loop for work written in this session - a fresh `reviewer` subagent each round, ending in the `pr-review` gate (project or global) before push. Use when reviewing your own changes before pushing.
---

# Review loop

The main session implements inline; every review round dispatches a **fresh** `reviewer` subagent (new `Agent` call, no `model` override). Continuity between rounds lives in the **review log**, never in the reviewer's memory.

## Review log

A Markdown file at `<scratchpad>/review-log.md` (the session scratchpad; outside a scratchpad, a gitignored path). It is the single source of truth for loop state, so it survives context compaction. It holds:

- `## Spec` - task spec and acceptance criteria, written once before round 1 and left byte-identical afterwards.
- `## Snapshots` - one line per round: `R<n>: <tree-sha>`.
- `## Findings` - one line per finding: `[R<n>-#<id>] <severity> <axis> file:line - issue → <status>`. `<axis>` is `standards` or `spec`.

Severities: `must-fix`, `should-fix`, `nit`, `question` (the reviewer needs the author's clarification).

Axes: every finding sits on one of two axes. **Standards** asks whether the change follows the repo's documented coding standards and the smell baseline in `code-smells.md` (next to this file). **Spec** asks whether the change does what the log's `## Spec` asked. A change can pass one axis and fail the other, so report them apart and never merge or rerank across axes.

Statuses:

- `OPEN` - not yet handled.
- `FIXED` - fixed in a later round; the next reviewer verifies it.
- `ANSWERED: <answer>` - the main session's reply to a `question`; the next reviewer may raise a new finding from it.
- `WONTFIX: <reason>` - only for `should-fix` and `nit`; the main session may set it.
- `DISPUTED: <reason>` - the main session's rebuttal of a `must-fix`. The next reviewer rules on it: `ACCEPTED` turns it into `WONTFIX`, `UPHELD` stops the loop for the human.

## Snapshot

Take a snapshot of the working tree before each incremental round - it captures uncommitted and untracked files without touching the real index or making a commit:

```bash
idx="$(git rev-parse --git-path index).snap"; command cp -f "$(git rev-parse --git-path index)" "$idx" && GIT_INDEX_FILE="$idx" git add -A && GIT_INDEX_FILE="$idx" git write-tree; command rm -f "$idx"
```

Record the printed tree SHA under `## Snapshots`. An incremental round's scope is `git diff <previous-snapshot> <this-snapshot>`; round 1 uses `git diff "$(git merge-base origin/<base> HEAD)" <this-snapshot>` - the merge-base matches the gate's `<base>...HEAD`, so commits that landed on the base after branching stay out of scope (three-dot syntax rejects a tree SHA).

**Base** is the PR's real target: `gh pr view --json baseRefName -q .baseRefName` once a PR exists; before that, the base the `pr-review` skill names, confirmed with `git rev-parse --verify origin/<base>`. Ask the user when neither resolves.

## Rounds

1. **Round 1 - full review** of `<base>..<snapshot>`, using the reviewer prompt below.
2. **Middle rounds - incremental**: verify every `FIXED`, `ANSWERED`, and `DISPUTED` item, then review only the diff since the previous snapshot.
3. **Final round - the gate**, run once an incremental round returns no `must-fix` and nothing is `DISPUTED`. See below.

Between rounds the main session handles every `OPEN` item: fix it (`FIXED`), answer it (`ANSWERED`), or record `WONTFIX` / `DISPUTED` with a reason. Run tests, lint, and typecheck before the next snapshot. `should-fix`, `nit`, and `question` alone never trigger another round.

**Stop and report to the user** - log path, open `must-fix` items, the latest **Needs human review** list - at the first of:

- round 4 completes without the gate passing (the final round counts toward the 4);
- a reviewer returns `UPHELD` on a dispute.

## Final round

1. Commit all work - the Git rules in `CLAUDE.md` (protected branches, PR size, commit format) apply, and committing needs the user's go-ahead. The gate reviews `HEAD`, so uncommitted work is outside it.
2. When a `pr-review` skill exists (the repo's `.claude/skills/pr-review/SKILL.md` or the global `~/.claude/skills/pr-review/SKILL.md`), dispatch `reviewer` with: the log's `## Spec` and `## Findings`, the resolved base, and the instruction to read that skill and follow its steps 1-4 and 6 on `<base>...HEAD`, skipping step 5 (the marker). It returns that skill's `## Review Summary` and `## Self-review` block in English, plus `needs_human_review` in Vietnamese. Severity maps both ways: `must-fix` = 🔴 Blocker, `should-fix` / `nit` = 🟡 Nit, `question` = 💬 Question. The `## Self-review` block covers the whole loop: its `(fixed: <n>)` counts every `must-fix` the log marks `FIXED`, and its Findings list each of them with how it was fixed.
3. Without any `pr-review`, the final round is a full review of `<base>..HEAD` with the reviewer prompt below.

The gate **passes** on verdict Approve with zero unresolved 🔴 Blockers (or zero `must-fix`). Only then does the main session write the marker, exactly as the `pr-review` skill's step 5 shows. Blockers send the loop back to the middle rounds. A 💬 Question leaves the verdict to the reviewer: the main session records it as `ANSWERED` in the log and shows it to the user with the **Needs human review** list.

Any commit after the gate passes - even a nit fix - invalidates the marker and the `## Self-review` SHA, so the gate runs again.

Before push and `gh pr create` (both asked first, per `CLAUDE.md`), show the user the latest **Needs human review** list. The `## Self-review` block goes into the PR body verbatim, in English; Vietnamese stays in chat. Invoke `pr-sketch` while writing that body.

Run `git commit` and `git push` as separate Bash calls: a project push gate compares its marker with `HEAD` before the whole command runs, so a chained commit slips past it.

When the PR is already open, every push moves the PR head. After the gate passes on the new `HEAD` and before the push, replace the `<!-- pr-review: sha=... -->` block in the PR body with the new `## Self-review` block (`gh pr edit <n> --body-file <file>`, keeping the rest of the body). After the push, confirm with `gh pr view <n> --json body,headRefOid` that the body's sha is a prefix of `headRefOid`.

## Reviewer prompt

For round 1, the middle rounds, and a final round without any `pr-review`. Build it in this order - the fixed spec first keeps the prompt prefix stable across rounds:

```
## Task spec & acceptance criteria
<the log's ## Spec section, verbatim>

## Review log
<the log's ## Findings section, verbatim>

## This round
Round <n> of 4 - <full | incremental>.
Scope: git diff <from> <to>
Related files to read if needed: <paths>
Verify every FIXED and ANSWERED item, and rule ACCEPTED or UPHELD on every DISPUTED item.
Re-raise a WONTFIX item only with a reason the log does not already answer.
Run the project's tests, lint, and typecheck; attach the failing output to any finding it backs.

## Two axes
Review along two separate axes and tag every finding with its `axis`.

**Standards.** Find every file that documents how code is written here (`CLAUDE.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, lint and format config, docs under `docs/`). Report (a) each place the diff breaks a documented standard, citing the standard's file and rule, and (b) each smell from `<path to code-smells.md>`, naming it and quoting the hunk. Read `<path to code-smells.md>` in full first. A documented standard overrides the baseline. Baseline hits are judgement calls. Skip anything tooling enforces.

**Spec.** Compare the diff to the task spec above. Report (a) requirements that are missing or only partly done, (b) behaviour in the diff that the spec did not ask for (scope creep), and (c) requirements that look done but are wrong. Quote the spec line for each finding. With no spec section, skip this axis and say so.

## Output
JSON only:
{
  "verdicts": [{"id": "R<n>-#<id>", "verdict": "VERIFIED | NOT_FIXED | ACCEPTED | UPHELD", "reason": "..."}],
  "findings": [{"id": "R<n>-#<id>", "severity": "must-fix | should-fix | nit | question", "axis": "standards | spec", "file": "...", "line": 0, "issue": "...", "suggestion": "...", "evidence": "test/lint output or null"}],
  "needs_human_review": ["file:line - zone - question for the human"]
}
Write each needs_human_review zone and question in Vietnamese; everything else in English.
```

`NOT_FIXED` reopens the item as `OPEN`. Fill `<path to code-smells.md>` with the absolute path of that file in this skill's folder. After each round, update the log, then relay the findings to the user under `## Standards` and `## Spec` headings, never merged or reranked across axes, and relay `needs_human_review` verbatim, one line per item, as its own block after the findings.
