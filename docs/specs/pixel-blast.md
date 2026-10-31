# Spec: `pixel-blast` - a pixel-styled Blast Radius mod

Status: approved

## Problem Statement

When Claude runs a destructive shell command (`rm -rf`, `git reset --hard`, a force push, `docker system prune`, `terraform destroy`, ...), the only checkpoint is the permission prompt. That prompt shows the command text, not what the command would actually destroy. Under time pressure the user approves a command without knowing that it deletes nine files, discards two uncommitted edits, or wipes a production namespace.

The "Blast Radius" mod from the Claude Code mods guide solves this, but it is a generic demo: a plain yellow-bordered box, a fixed set of commands, and no fit with the user's taste or stack. The user wants their own version, kept in the hkirito repo, with a compact pixel look in the terminal, and covering Docker and infra commands they run day to day.

## Solution

A Claude Code mod named `pixel-blast`, living in the hkirito repo and shipped to GitHub through a normal PR (no marketplace).

When Claude calls Bash with a command in a risky class, `pixel-blast` holds the call, runs read-only dry runs to measure what the command would touch, and shows a report:

- The command in bold with a one-line summary under it.
- The affected items (files, commits, volumes, resources), each with a small `■` size bar scaled to the largest, then `…N more`.
- Two hotkey choices: `1: proceed` and `2: cancel`.

Pressing `1` lets the command run as written. Pressing `2`, pressing Esc, or the turn being interrupted refuses the call, and Claude receives a refusal that says what the command would have done.

The report opens in a side pane when the terminal is wide enough, and falls back to the band above the prompt when it is not. The `■` size bars are for the terminal only; other surfaces get the same content as plain text.

Install, for anyone who clones the repo: `claude --plugin-dir <repo>/mods/pixel-blast`, or name that folder in `CLAUDE_CODE_PLUGIN_DIRS`.

## User Stories

1. As a developer, I want `rm -rf <path>` held before it runs, so that I see the files it would delete before I agree.
2. As a developer, I want the report to list the files with their sizes, so that I notice a file I care about.
3. As a developer, I want a total file count and size, so that I can judge the scale at a glance.
4. As a developer, I want `git reset --hard` held, so that I see which uncommitted changes would be discarded.
5. As a developer, I want `git clean -f` (with any `-d` / `-x`) held, so that I see which untracked files would be deleted.
6. As a developer, I want `git push --force`, `-f`, and `--force-with-lease` held, so that I see which remote commits would be overwritten.
7. As a developer, I want database migration commands held, so that I see which migrations are pending before they apply.
8. As a developer, I want `docker system prune`, `docker volume rm`, `docker volume prune`, and `docker compose down -v` held, so that I see which volumes and how much disk would go.
9. As a developer, I want `terraform destroy` held, so that I see the resources in state that would be destroyed.
10. As a developer, I want `terraform apply` held, so that I am reminded which workspace I apply to.
11. As a developer, I want `kubectl delete` held, so that I see the objects it would delete and the context it targets.
12. As a developer, I want any mutating `kubectl` command on a production context held, so that I never change production by accident.
13. As a developer, I want every other Bash command to run untouched, so that the mod costs nothing in normal work.
14. As a developer, I want to press `1` to proceed and `2` to cancel, so that I decide with one key.
15. As a developer, I want Esc to count as cancel, so that the safe action is the easy one.
16. As a developer, I want an interrupted turn to cancel the held command, so that nothing runs after I stopped Claude.
17. As a developer, I want Claude to receive a refusal that says what the command would have done, so that Claude can explain or choose a safer path.
18. As a developer, I want the report in a side pane on a wide terminal, so that it does not cover the transcript.
19. As a developer, I want the report above the prompt on a narrow terminal, so that I still see it.
20. As a developer, I want the size bars hidden when the pane is too narrow, so that the report never wraps into a mess.
21. As a developer, I want the report to stay monochrome with no level label, so that it reads calm and the facts (items, sizes) carry the warning.
22. As a developer, I want only single-width glyphs and no emoji, so that the layout lines up in every terminal font.
23. As a developer, I want a "could not measure" line when a dry run fails, so that the hold still happens and I know the report is incomplete.
24. As a developer, I want dry runs to be read-only and to take no shell input, so that measuring never causes the damage it warns about.
25. As a developer, I want a hot reload of the mod during a hold to refuse the held command and clear the pane, so that an edit never leaves a command half-decided or a stale pane on screen.
26. As a developer on desktop or VS Code, I want the same report as plain text, so that the guard still works there.
27. As a maintainer of hkirito, I want the mod in the repo under its own folder, so that it ships and reviews like any skill.
28. As a teammate, I want install steps in the mod's README, so that I can load it from a clone without a marketplace.
29. As a developer, I want the README to say the mod is a safety net, not a permission system, so that I keep permission rules for hard blocks.

## Implementation Decisions

- **Name and place.** The mod is `pixel-blast`, in its own folder under a new `mods/` directory of the repo. It does not reuse the name `blast-radius`, which is already a skill in this repo.
- **Distribution.** GitHub only, through the hkirito PR flow. No `marketplace.json`. Loading is `--plugin-dir` or `CLAUDE_CODE_PLUGIN_DIRS`.
- **Module shape.** One hooks module, plus a type contract for `$.state`. Three hooks: `tool.call` on Bash, `ui.render` on the mod's `Pane`, and `ui.render` on `AbovePrompt`.
- **Classifier.** A pure function from the command string to a risk (`kind`, `sub`, `level`, program, parsed targets, options to repeat in dry runs, leading `VAR=value` environment) or none. It looks through `sudo`/`env`/`timeout`/`nice` and similar wrappers (skipping their flag values), shell reserved words (`then`, `do`, `{`, `!`), `eval`, and `sh -c`/`bash -e -c`. Risk kinds: `rm`, `git-reset`, `git-clean`, `git-push` (force by `--force`, `-f`, `--force-with-lease`, `--mirror`, or a `+refspec`), `migration`, `docker`, `terraform`, `kubectl`. Levels: `medium` (local, recoverable: build folders, `git clean`), `high` (data or history loss: `git reset --hard`, force push, migrations, Docker volumes), `critical` (`terraform destroy`, `kubectl` on a production context). A production context is one whose name matches `prod` case-insensitively; it is read from `--context`, `--kubeconfig`, and the command's own `KUBECONFIG`.
- **Measurer.** Per kind, read-only dry runs through `$.process.run` with an argv array (never a shell string), a short timeout, and the command's own environment. Only variables that pick a target (`KUBECONFIG` for the context read, `DOCKER_CONTEXT`, `TF_WORKSPACE`, `DATABASE_URL`, ...) are repeated in a dry run; `PATH`, `LD_*`, `GIT_CONFIG_*` and any value that needs shell expansion are not applied, and the report says so. Options and variables that point at config files or redirect the target (`docker --config/--host`, `DOCKER_HOST`, `git --git-dir/--work-tree`, `GIT_DIR`, and `git -C` outside the working directory) are not repeated either: the report says it could not measure. A kubeconfig or context that needs shell expansion is treated as an unknown context, so the call is held. A dry run is built from parsed parts and known-harmless flags, never by replaying the model's argv: it must not run model-written code (`python -c`, `kubectl --server`, `--`) and must not fetch packages (`npx --no-install`). `rm`: `find <target> -type f -exec du -k {} +` per target. `git-reset`: `git status --porcelain`. `git-clean`: `git clean -n` with the same `-d`/`-x`/`-e` options. `git-push`: `git log` of remote-tracking commits not in `HEAD` (no fetch, so the report says the remote may be stale). `migration`: the tool's own "show pending" command where it has one. `docker`: `docker system df` for `system prune`; `docker system df -v` for volume sizes; `docker compose config --format json` for the volumes `down -v` removes (external ones excluded). `terraform destroy`: `terraform state list`; `terraform apply`: `terraform workspace show` only (no `plan`, which can be slow and reach the network). `kubectl`: `config current-context` plus the same delete with `--dry-run=client -o name` and allow-listed flags only. Measuring may run the project's own read-only status command from the working directory (`showmigrations`, `rails db:migrate:status`, `npx --no-install ...`) but never a path outside it. A failed or timed-out dry run yields a "could not measure" report, never a pass. Dry runs run before the permission prompt (the hook sits above core), so a command a deny rule would refuse is still measured; pressing proceed then leads to the normal permission prompt.
- **Report.** One plain-data value: command, level, noun, a list of items (`label`, optional size in bytes), total count, total size, notes. The drawing and the deny text are both built from it.
- **Hold.** The `tool.call` hook stores the report in `$.state` (what the drawing reads), keeps the answer in the hook's own module state (a `$.state` write made from a button handler was not seen by the waiting hook in the test kit), opens the pane with focus and `closeOnEscape`, and waits in a loop of short `$.process.run(["sleep", "0.25"])` calls. That wait does not spend the hook's own budget; `$.clock.sleep` would. The loop ends on a decision or on `next.signal` aborting. The hook is a guard: it carries a `.catch` that refuses when it had not called `next`, so a crash in the mod blocks rather than lets the command through.
- **Decision.** `proceed` calls `next(e)`. `cancel`, Esc closing the pane (`ui.close` from the person), or an abort returns `{ deny }` with the report's one-line summary.
- **Placement.** `$.ui.open` places an unasked pane from 144 columns. When it answers `isPlaced: false`, the same report draws in the `AbovePrompt` band, which yields to a survey (`hasSurvey`).
- **Visual design (terminal).** Restrained: no level label and no accent colours: the default foreground, bold for the header, dim for the size bars and notes. Header: the command in bold, the summary dim under it. Item rows: label left, `■` bar scaled to the largest item, human size right (`412K`, `1.1M`). At most 8 rows, then `…N more`. Buttons drawn `plain` with hotkeys `1` and `2`. Size bars drop under 32 body columns. Single-width glyphs only.
- **Other surfaces.** Same report as plain `Text` rows and two buttons, no glyph art.
- **Design source.** `redesign-skill` principles (no generic AI patterns, deliberate spacing, restrained palette) applied to a terminal element tree; its CSS-specific rules do not apply.

## Testing Decisions

- **One seam:** the `claude plugin test` harness, driving the mod from outside the way a session does. Tests raise `$.tool.call({ tool: 'Bash', command })`, stub `process.run` and `ui.open` with test hooks beneath the mod, mount the `Pane` / `AbovePrompt` on a surface, press `1` / `2` by key, and assert on what the call resolved to (ran, or denied with a reason) and on visible text.
- A good test checks external behaviour only: which commands are held, what the report shows, what Claude receives. It does not call the classifier or measurer directly.
- Covered: a safe command passes untouched; each risk kind is held; proceed runs it; cancel denies it with the summary; a failing dry run still holds with "could not measure"; `isPlaced: false` draws in the band; a narrow pane drops the size bars; the desktop surface draws plain text.
- Plus `claude plugin validate` and `tsc -p` on the mod folder.
- Prior art: the bundled plugin-authoring example `pane.test.tsx`. No mod tests exist in this repo yet.

## Out of Scope

- A marketplace or `claude plugin install` support.
- Parsing through `$(…)`, aliases, or scripts that call `rm` - the mod reads command text only.
- Running `terraform plan`, fetching remotes, or anything that writes or reaches the network to measure.
- Configurable patterns through `userConfig` (fixed lists for now).
- Animations and sound.
- Size bars on desktop, VS Code, and mobile.

## Further Notes

- Based on the Blast Radius walkthrough in the Claude Code mods guide; the upstream code in `anthropics/claude-code-playground` is reference only.
- Requires Claude Code 2.1.287 or later; developed against 2.1.316.
- Mods are not a security boundary. The README says so and points to permission rules for hard blocks.
