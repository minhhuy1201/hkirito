# hkirito

A spec-driven harness for Claude Code. One entry point, `/kirito-mode <task>`, classifies the task and runs the matching flow of skills. Clone it, symlink it into `~/.claude/`, and edit it to taste.

Specs and plans live in the repo: [`docs/specs/kirito-mode.md`](docs/specs/kirito-mode.md), [`docs/plans/kirito-mode.md`](docs/plans/kirito-mode.md).

## Flows

| Route | When | Flow |
|---|---|---|
| `feature` | New behaviour or a design change across modules | `grill-with-docs` -> `to-spec` -> `to-tickets` -> `tdd` -> `tidy` -> commit |
| `small` | Short, contained change | `tdd` (or run the app) -> `tidy` -> commit; `to-tickets` first when it spans several files |
| `bug` | Something is broken | `diagnosing-bugs` -> regression test -> `tidy` -> commit |
| `understand` | A question about the code | `how`, `why`, `explain` |
| `refactor` | Restructure, same behaviour | `codebase-design` -> `tdd` -> `tidy` -> commit |
| `pr` | Open a PR | `review-loop` -> `pr-sketch` -> `gh pr create` |

Specs go to `docs/specs/<feature>.md`, plans to `docs/plans/<feature>/NN-<slug>.md`. Review runs only on the `pr` route.

## Install

```bash
git clone git@github.com:minhhuy1201/hkirito.git ~/hkirito
cd ~/hkirito

mkdir -p ~/.claude/skills ~/.claude/agents
for d in skills/*/; do
  name=$(basename "$d")
  if [ -e ~/.claude/skills/$name ] && [ ! -L ~/.claude/skills/$name ]; then
    echo "skip $name: a real directory exists in ~/.claude/skills (move it aside first)"
    continue
  fi
  ln -sfn "$PWD/skills/$name" ~/.claude/skills/$name
done
ln -sfn "$PWD/agents/reviewer.md" ~/.claude/agents/reviewer.md
```

Skills are not namespaced: they appear as `/kirito-mode`, `/tidy`, `/tdd`, and so on. A skill with the same name in `~/.claude/skills/` must be moved aside first or the loop above skips it.

Start a new session and run `/kirito-mode <what you want done>`.

If you use the superpowers plugin, disable it (`enabledPlugins` in `~/.claude/settings.json`). Its session hook pushes its own workflow and competes with the router. The two rules worth keeping from it, verify before claiming done and verify each review finding, are written into `kirito-mode`.

### Adapt it

- `skills/kirito-mode/SKILL.md` is the router. `routes/*.md` hold one flow each. Change them to fit your team.
- `review-loop` and `agents/reviewer.md` assume project rules from the author's `CLAUDE.md` (branch names, Vietnamese review summary). Edit them for yours.
- `skills/grill-with-docs` needs `grilling` and `domain-modeling` enabled. Check `skillOverrides` in your settings.

## Commit gate (optional)

`tidy` strips needless comments and AI-sounding prose from the staged diff before a commit. The skill flow already runs it. Two optional gates make it harder to skip. The skill flow works without either.

### Claude hook (machines where hooks are allowed)

Paste `hooks/settings-snippet.json` into `~/.claude/settings.json`, merging it into any existing `hooks.PreToolUse`, and replace `/ABSOLUTE/PATH/TO/hkirito` with your clone path. It needs `python3` and `sha256sum`. It blocks `git commit` while the staged diff has not been through `/tidy`.

### Git hook (works where Claude hooks are blocked)

`githooks/pre-commit` applies the same check, but only when `CLAUDECODE=1`, which Claude Code sets in its shell. Human commits pass. Per project:

```bash
cp ~/hkirito/githooks/pre-commit .git/hooks/pre-commit
```

With Husky, call it from `.husky/pre-commit`: `~/hkirito/githooks/pre-commit`.

Both gates compare the hash that `skills/tidy/scripts/mark.sh` writes to `.git/kirito-tidy` with the hash of `git diff --cached`. Staging anything after `/tidy` invalidates the mark, so run `/tidy` last.

## Layout

```
skills/            kirito-mode, tidy, and the vendored and ported skills
agents/            reviewer.md
hooks/             commit-gate.sh, settings-snippet.json (optional)
githooks/          pre-commit (optional)
docs/              this repo's own spec and plan
THIRD_PARTY.md     upstream sources and licenses
```

Vendored skills carry a provenance comment naming the upstream repo and commit. See [THIRD_PARTY.md](THIRD_PARTY.md).
