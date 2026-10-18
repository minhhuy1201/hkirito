# Spec: hkirito harness and `/kirito-mode`

Status: approved

## Problem statement

The author and their teammates run Claude Code with a mix of the superpowers plugin, loose copies of Matt Pocock's skills, and personal config. Nothing routes a task to the right flow, some flows are broken (`grill-with-docs` calls skills that are switched off or missing), and pstack skills only run in Cursor. On the company machine Claude hooks are blocked, so any rule enforced only by a hook silently disappears there.

## Solution

One plain git repo, `hkirito`, that people clone and adapt by hand, with `README.md` as the guide. No plugin or marketplace. It holds:

- a router skill `/kirito-mode`, vendored and ported skills, and the `reviewer` agent, symlinked into `~/.claude/`. They work with hooks blocked.
- an optional commit-gate hook script plus a settings snippet, installed only where hooks are allowed.
- a git pre-commit hook for projects, as a hook-free backstop.

The user types `/kirito-mode <task>`. The router picks a route, prints `Route: <name> - <reason>`, and runs that route's skills in order. Every route that writes code ends with `tidy` and a `caveman:caveman-commit` commit.

## User stories

1. As a developer, I want to describe a task once and have the right flow chosen, so that I stop picking skills by hand.
2. As a developer, I want to see and override the chosen route, so that a wrong classification costs one message.
3. As a developer building a feature, I want an interview, then a spec in `docs/specs/`, then tickets in `docs/plans/`, then test-first implementation, so that the PR carries its own design record.
4. As a developer making a small change, I want to skip the spec and, for 1-2 files, skip the plan too.
5. As a developer fixing a bug, I want a reproducing feedback loop and a regression test before the fix.
6. As a developer reading unfamiliar code, I want `how`, `why`, and `explain` to answer without editing anything.
7. As a developer about to commit, I want needless comments and AI-sounding comment prose removed without a subagent and with no report beyond `done`.
8. As a developer on the company machine, I want every flow to work with Claude hooks blocked.
9. As a developer at home, I want a hook that blocks an agent commit when `tidy` has not run on the staged diff.
10. As a developer in any project, I want an optional git pre-commit hook that applies the same check to agent commits only and lets human commits through.
11. As a teammate, I want to clone one repo and follow `README.md` to get the whole flow, including `review-loop` and `reviewer`.
12. As a maintainer, I want each vendored skill to name its upstream repo and commit, so that I can diff against new upstream versions.

## Implementation decisions

- Routes: `feature`, `small`, `small-multi`, `bug`, `understand`, `refactor`, `pr`. The table in `docs/plans/kirito-mode.md` is the contract.
- Classification signals: files touched, whether an interface, schema, or public API changes, new behaviour versus wrong behaviour. Ask one question when unclear.
- `review-loop` runs only on the `pr` route.
- Superpowers is replaced. Two of its rules are folded into `/kirito-mode`: verify with a real command before claiming done, and verify each review finding before acting on it.
- Matt's `to-spec` and `to-tickets` write local files (`docs/specs/<feature>.md`, `docs/plans/<feature>/NN-<slug>.md`). There is no issue-tracker dependency.
- pstack `how`, `why`, `teach`, and `architect` are ported to run inline, with at most one Explore subagent and no Cursor model slugs. `teach` becomes `explain`; Matt's `teach` becomes `learn`.
- `tidy` marks completion by writing the hash of `git diff --cached` to `$(git rev-parse --git-dir)/kirito-tidy`. The hook and the git pre-commit hook compare that marker with the current staged hash.
- The git pre-commit hook enforces only when `CLAUDECODE=1`, which the Claude Code Bash tool sets.
- The Claude hook is opt-in: it runs only after the user pastes `hooks/settings-snippet.json` into their settings, so cloning and symlinking never adds a hook.
- The push gate (`hooks/pre-push-review-gate.sh`) is opt-in through its own snippet, `hooks/settings-snippet-push-gate.json`. The PR template and the Self-review workflow live in `templates/github/` and are copied per project. `review-loop` and the `pr` route use a `pr-review` skill from the project or from `~/.claude/skills/`.
- Skills are unnamespaced; a symlinked skill replaces any same-name copy in `~/.claude/skills/`.

## Testing decisions

- Check every `SKILL.md` frontmatter: `name` matches its folder, `description` is present.
- Exercise each route once in a throwaway git repo and check its artifacts: the route line, the spec and plan files, and `tidy` printing `done`.
- Test the commit gate with the marker missing, stale, and fresh, for both the Claude hook and the git hook, and with `CLAUDECODE` set and unset.

## Out of scope

- `wayfinder`, `triage`, `implement-spec`, and other tracker-based or subagent-heavy flows.
- pstack principle skills and playbooks.
- A team `CLAUDE.md` template.

## Further notes

Upstream sources: `mattpocock/skills@49dd158` and `cursor/plugins` (pstack) `@101b274`. Both are MIT. Notices go in `THIRD_PARTY.md`.
