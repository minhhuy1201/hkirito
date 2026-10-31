# Plan: sync upstream updates and ship delegate mode

Spec: [sync-upstream-2026-11](../specs/sync-upstream-2026-11.md)

Status: done

Upstream commits: pstack `ab1f702` (cursor/plugins), mattpocock/skills `7739eae` and `a496f55`.

## 1. Re-port `interrogate`

Status: done

- [x] `skills/interrogate/SKILL.md` follows Frame, Fan out, Verify, Output, with one fresh `general-purpose` adversary in a worktree that applies a patch of the uncommitted changes
- [x] The adversary brief is upstream's, verbatim
- [x] The main session reruns each command; Output is Intent, Findings, Dropped; no fixes applied
- [x] `skills/interrogate/references/` is deleted
- [x] `routes/feature.md` step 4 addresses verified findings and shows the Dropped summary
- [x] Provenance comment says `pstack@ab1f702`, ported

## 2. Fresh-context line

Status: done

- [x] `grilling`, `research`, `improve-codebase-architecture`, and `codebase-design/DESIGN-IT-TWICE.md` carry upstream's phrase
- [x] Their provenance comments say `mattpocock/skills@7739eae`

## 3. Restate the goal

Status: done

- [x] `kirito-mode` Classify step states the goal, problem, and smallest change after the `Route:` line
- [x] A **Carry the goal** rule covers subagent briefs, PR What & Why, and final reports
- [x] `routes/pr.md` step 3 opens What & Why with it

## 4. Must-fix needs evidence

Status: done

- [x] `review-loop` Severities and the reviewer prompt require command output or a quoted standard or spec line for `must-fix`

## 5. Decision before measuring

Status: done

- [x] `routes/bug.md` says what to write before measuring a slow bug, and when to stop

## 6. Delegate mode in the repo

Status: done

- [x] `agents/implementer.md` exists, copied from the installed agent
- [x] `kirito-mode` has the `--delegate` argument hint, the delegate paragraph, and the implementer clause in Subagents sparingly
- [x] `routes/feature.md` step 6 splits Default and Delegate mode: a new `Agent` call per ticket, never `SendMessage` to an earlier one
- [x] README: `--delegate` note, implementer symlink in Install, Layout lists both agents
- [x] `CLAUDE-huykrito.md` Model routing names the delegate exception

## 7. Provenance and checks

Status: done

- [x] `THIRD_PARTY.md` records `ab1f702` (interrogate and ideas), `7739eae`, `a496f55`
- [x] All Testing Decisions in the spec pass
