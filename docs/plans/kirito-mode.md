# Plan: hkirito - spec-driven harness with `/kirito-mode` router

## Context

The user wants a personal harness, shared with teammates via GitHub, that routes every task through a spec-driven flow. Today they rely on the superpowers plugin; they want to replace it with vendored Matt Pocock skills (`~/github-stuff/skills`, MIT, commit `49dd158`) and ported pstack skills (`~/github-stuff/plugins/pstack`, MIT, commit `101b274`), plus one router skill `/kirito-mode`.

Decisions already made in chat:
- Specs, plans, and skills live in the repo `~/personal/hkirito` (currently not a git repo).
- Borrowed skills are vendored (copied, adapted, provenance header kept).
- Superpowers plugin gets disabled.
- Pre-commit cleanup = new inline skill `tidy` (no subagent, output only `done`). Commit messages stay with `caveman:caveman-commit`.
- `review-loop` runs only when a PR is opened, not after every implementation.
- Company machine blocks Claude hooks (mods); git hooks are allowed. Enforcement therefore has 3 layers, and the skill layer must work alone.

Facts found while exploring:
- `grill-with-docs` only calls `grilling` + `domain-modeling`; `~/.claude/settings.json` has `skillOverrides: {grill-me: off, grilling: off}` and `domain-modeling` is not installed - the flow is broken today.
- `to-spec` / `to-tickets` depend on `/setup-matt-pocock-skills` and an issue tracker; `to-tickets` local mode writes `.scratch/<feature>/issues/`.
- pstack `how`/`why`/`architect`/`no-comments` use Cursor-only constructs (`poteto-agent`, `pstack-models.mdc`, grok slugs, `arena`, `comment-sicko` subagent).
- `~/.claude/settings.json` `permissions` = `{defaultMode: acceptEdits}` - no deny rules, though `~/.claude/CLAUDE.md` claims they exist.
- Bash tool sets `CLAUDECODE=1` (verified) - a git hook can gate only agent commits.
- No plugin or marketplace: teammates clone the repo and adapt it by hand, guided by `README.md` (user decision).

## Repo layout

```
hkirito/
  skills/kirito-mode/SKILL.md         # router, DoD, folded superpowers rules
  skills/kirito-mode/routes/{feature,small,bug,understand,refactor}.md
  skills/tidy/SKILL.md (+ scripts/mark.sh)
  skills/<vendored>/...
  agents/reviewer.md
  hooks/commit-gate.sh                # optional, home machine only
  hooks/settings-snippet.json         # PreToolUse entry to paste into ~/.claude/settings.json
  hooks/pre-push-review-gate.sh       # optional push gate, wired by hooks/settings-snippet-push-gate.json
  skills/pr-review/                   # PR review checklist and Self-review block
  templates/github/                   # PR template + Self-review workflow, copied per project
  githooks/pre-commit                 # layer 3, copied into a project's .git/hooks or Husky
  docs/specs/kirito-mode.md
  docs/plans/kirito-mode.md
  THIRD_PARTY.md                      # MIT notices for Matt + pstack
  README.md                           # clone, symlink, home vs company setup
```

Install = symlink each `skills/<name>` into `~/.claude/skills/` and `agents/reviewer.md` into `~/.claude/agents/`, as `README.md` shows. Skills are unnamespaced (`/tidy`, `/kirito-mode`), so existing same-name copies in `~/.claude/skills/` must be replaced by the symlinks. The hook is opt-in: nothing installs it unless the user pastes the snippet, so the company machine needs no extra step.

## Router `/kirito-mode` (routes)

First line of every run: `Route: <X> - <reason>`; user may override.

| Route | Trigger | Flow |
|---|---|---|
| feature | new behaviour or design change across modules | (`how` if area unfamiliar) -> `grill-with-docs` -> `to-spec` -> (`architect` if tickets cross module seams) -> `to-tickets` -> `tdd` per ticket -> `tidy` -> commit |
| small | 1-2 files, no interface change | `tdd` (or run-the-app check for pure UI) -> `tidy` -> commit |
| small-multi | several files or an interface change, no spec needed | `to-tickets` -> `tdd` -> `tidy` -> commit |
| bug | defect report | `diagnosing-bugs` (includes regression test) -> `tidy` -> commit |
| understand | read-only question | `how` / `why` / `explain` |
| refactor | behaviour-preserving restructure | `codebase-design` (+ `improve-codebase-architecture` for survey) -> `tdd` -> `tidy` -> commit |
| pr | user asks to open a PR | `review-loop` -> `pr-sketch` -> `gh pr create` |

Folded rules (replace superpowers): verify with a real command before claiming done; verify each review finding before acting on it. Definition of Done per route: tests green, typecheck + lint clean, spec/plan/code agree.

## Skills: vendor list and adaptations

Matt (copy, add `<!-- vendored from mattpocock/skills@49dd158, adapted -->`):
- As-is: `grilling`, `grill-with-docs`, `domain-modeling`, `tdd`, `codebase-design`, `diagnosing-bugs`, `prototype`, `improve-codebase-architecture`, `retro`, `handoff`.
- Adapted: `to-spec` writes `docs/specs/<feature>.md` (drop tracker + `ready-for-agent`); `to-tickets` writes `docs/plans/<feature>/NN-<slug>.md` (drop tracker); remove `setup-matt-pocock-skills` references.
- Skipped in v1: `wayfinder`, `triage`, `implement-spec` (tracker/subagent-heavy).

pstack (port, add provenance header):
- `unslop` as-is.
- `how`, `why`: single inline pass, optional one Explore subagent; remove model slugs / `pstack-models.mdc`.
- `teach` -> renamed `explain` (runs `how` + `why`); Matt `teach` kept as `learn`.
- `architect`: lite - ground with `how`, sketch 2 distinct shapes inline, compare on interface depth per `codebase-design`, write sketch, no `arena`.

New `tidy`: scope = staged diff; delete comments that restate code, keep why/constraint/license/public-API-doc comments (rules from `pstack/agents/comment-sicko.md` keep-list), apply `unslop` to remaining comments/docstrings; re-stage; run `scripts/mark.sh` (writes `sha256(git diff --cached)` to `$(git rev-parse --git-dir)/kirito-tidy`); print only `done`.

Own skills moved in for teammates: `review-loop`, `pr-sketch`, `agents/reviewer.md` from `~/.claude/` (the home copies become symlinks back to the repo).

## Enforcement layers

1. Skill: every route's last checklist items are `tidy` then `caveman:caveman-commit`.
2. `hooks/commit-gate.sh` PreToolUse(Bash) hook, opt-in via `hooks/settings-snippet.json` (absolute path to the clone): if command runs `git commit` and marker != current staged hash, exit 2 with "run /tidy first".
3. `githooks/pre-commit`: same check, only when `CLAUDECODE=1`; human commits pass. `README.md` shows copying it into `.git/hooks/` or calling it from Husky.

## Changes outside the repo (asked for in chat; apply only after approval of this plan)

- `~/.claude/settings.json`: disable `superpowers@claude-plugins-official`; remove `grilling`/`grill-me` overrides; add deny rules for `rm -rf`, `git push --force`, `curl * | sh`.
- `~/.claude/CLAUDE.md`: review-loop only at PR; plan-mode fallback not needed (only mods blocked); fix deny-rule sentence if needed.
- Duplicate Matt copies in `~/.claude/skills/` (`tdd`, `grilling`, `codebase-design`, ...): delete only after separate confirmation.

## Execution order

1. `git init`, branch `feat/kirito-mode-harness`; copy this plan to `docs/plans/kirito-mode.md` and write `docs/specs/kirito-mode.md`.
2. Ask user to switch to Sonnet 5.5 (model-routing rule) before implementation.
3. Vendor Matt skills into `skills/`; adapt `to-spec`/`to-tickets`.
4. Port pstack skills; write `tidy` + `mark.sh`.
5. Write `kirito-mode` + routes.
6. `hooks/` (gate script + settings snippet) and `githooks/pre-commit`.
7. README (clone, symlink, home vs company setup), THIRD_PARTY.md.
8. Global config edits, then symlink this repo's skills into `~/.claude/` on the home machine.

## Verification

- Every `SKILL.md` has valid frontmatter (`name` matches its folder, `description` present) - checked by a one-off script.
- After symlinking, `/kirito-mode`, `/tidy` and vendored skills appear in the skill list of a new session.
- Scratch repo in scratchpad: run one task per route (feature, small, bug, understand), confirm route line, spec/plan files land in `docs/`, `tidy` prints `done`.
- Hook: `git commit` without marker blocked; after `tidy` allowed; with the snippet not installed the flow still completes.
- Git hook: with `CLAUDECODE=1` and no marker -> blocked; without env -> passes.
- `grill-with-docs` runs end to end after override removal.
