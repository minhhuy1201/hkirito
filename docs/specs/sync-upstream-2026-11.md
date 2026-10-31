# Spec: sync upstream updates and ship delegate mode

Status: approved

## Problem Statement

hkirito vendors skills from pstack (cursor/plugins, pinned at `9580c23`) and from mattpocock/skills (pinned at `49dd158` and `5beb35b`). Since those pins, both upstreams changed skills hkirito ships, and pstack added ideas that fit the existing routes:

- pstack rewrote `interrogate` (`ab1f702`). A finding now survives only when a run proves it, and the rubric, reviewer-prompt, lead-judgment, and code-quality references are gone. hkirito's port still sorts unproven findings into Act on, Consider, Noted, and Dismissed.
- mattpocock/skills added one line to every skill that dispatches a subagent (`7739eae`): start it with a fresh context window. hkirito's copies of `grilling`, `research`, `improve-codebase-architecture`, and `codebase-design` lack it.
- pstack's `poteto-mode` now restates the user's goal at the start of a task and carries it into subagent briefs, PR bodies, and final reports. Its Autopilot playbooks block a PR only on a problem that a run or a wrong doc line shows. `principle-explain-the-number` writes the deciding result before measuring (all `ab1f702`).
- mattpocock's `implement-spec` now uses a fresh implementer subagent per ticket (`a496f55`).

Delegate mode (`/kirito-mode --delegate`, which hands each ticket to an `implementer` subagent) exists only in the author's `~/.claude/` copy. The repo's `kirito-mode` and `feature` route do not mention it, and the repo has no `agents/implementer.md`. A teammate who clones hkirito does not get it.

## Solution

One change that re-ports `interrogate`, syncs the fresh-context line, folds the three pstack ideas and the fresh-implementer rule into the routes, and moves delegate mode into the repo. Provenance comments and `THIRD_PARTY.md` record the new upstream commits.

## User Stories

1. As the author, I want `interrogate` to keep only findings proven by a command it ran, so that a contested design is challenged by evidence, not opinion.
2. As the author, I want `interrogate`'s adversary to build repros in its own worktree, so that my working tree stays clean.
3. As the author, I want `interrogate` to report what it dropped and why, so that I can see the adversary was not silent.
4. As the author, I want every vendored skill that dispatches a subagent to say "fresh context window", so that the skills stay in step with upstream and behave the same in a harness that forks by default.
5. As the author, I want `/kirito-mode` to restate my goal in its own words at the start, so that a misunderstanding shows up before any work.
6. As the author, I want that goal statement to open each subagent brief, the PR's What & Why, and the final report, so that every reader starts from the same goal.
7. As the author, I want a `must-fix` in `review-loop` to need evidence (command output or a quoted standard or spec line), so that review rounds are not spent on unproven blockers.
8. As the author, I want the `bug` route, for a slow bug, to write the result that would change the decision before measuring, so that a measurement cannot be read to fit a conclusion.
9. As a teammate who clones hkirito, I want `--delegate` and `agents/implementer.md` in the repo, with the install steps in the README, so that I get delegate mode without copying files from the author.
10. As the author, I want each ticket in delegate mode to get a new `implementer`, never a resumed one, so that one ticket's context never leaks into the next.

## Implementation Decisions

- **`interrogate` is ported, not copied.** It uses one adversary, not upstream's arena fan-out. The adversary is a fresh `general-purpose` agent with `isolation: "worktree"` and no `model` override. It is not `reviewer`, because `agents/reviewer.md` forbids writing files and a repro needs files. The main session saves the uncommitted changes as a patch and the adversary applies the patch first. Upstream's adversary brief is kept verbatim. The main session reruns every command and keeps a finding only when the output shows a failure that breaks the intent. Output: Intent, Findings, Dropped. Fixes are never applied. The skill stays model-invocable, because the `feature` route calls it.
- **The four reference files of `interrogate` are deleted**, as upstream did.
- **The `feature` route** addresses every verified finding before tickets and shows the Dropped summary. The Act on bucket no longer exists.
- **The fresh-context line uses upstream's exact phrase.** `wayfinder` is left alone, because hkirito's adaptation has no research-subagent step.
- **The goal statement** goes in the router's Classify step and in a new rule for every route. The `pr` route opens What & Why with it. It is skipped after a fully specified one-line edit.
- **The must-fix evidence rule** lives in `review-loop`'s Severities and in its reviewer prompt. Without evidence, a finding is at most `should-fix`.
- **Delegate mode text** is ported from the installed copy, plus "never resume an earlier implementer with `SendMessage`". The repo's newer `pr` route wording stays. `agents/implementer.md` is copied as installed.
- **`CLAUDE-huykrito.md`** gains the delegate-mode exception in its Model routing rule.

## Testing Decisions

A check tests what a user of the harness sees: a skill loads, its references resolve, a route says what it should. It does not test wording.

- Every `SKILL.md` has `name` equal to its folder.
- `skills/interrogate` mentions no `references/`, and no route mentions an Act on bucket.
- No skill changed on this branch mentions `arena`, `swarm`, `poteto-mode`, `pstack-models`, `grok`, or `setup-pstack`.
- Every changed provenance comment names the same commit as `THIRD_PARTY.md`.
- `skills/statechart` is unchanged.
- The README install loop, run against a scratch `HOME`, links every skill plus `reviewer.md` and `implementer.md`.
- `interrogate`, run in a throwaway repo with a planted bug in an uncommitted change, returns that bug as a verified finding with its command and output.
- The PR stays under 2000 changed lines.

## Out of Scope

- The `statechart` compiler rewrite (`34b1b7c`, `740d2c0`, `519d36a`): about 32k changed lines, and it drops `from-chart` and `--fixed`. The matching one-line change in `create-formal-verification-skill` waits with it.
- Multi-model fan-out, `arena`, and the pstack harness tree.
- New upstream skills: `software-factory`, `chief-of-staff`, `in-your-own-words`, and the other pstack skills hkirito does not ship.
- Re-installing the author's `~/.claude/` copies, which is a machine-scope step the author runs.
