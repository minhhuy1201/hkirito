---
name: kirito-mode
description: "Spec-driven router. Use for /kirito-mode <task>: classify the task (feature, small change, bug, question, refactor, PR) and run the matching flow of skills, ending in tidy and a commit."
disable-model-invocation: true
argument-hint: "<task or request>"
---

# Kirito mode

Route the task, then follow that route's file. Skills do the work; this file only decides which skills run, in what order, and when the work counts as done.

## 1. Classify

Pick one route from the task text and a quick look at the code. Print one line first: `Route: <name> - <reason>`. The user can override it in the next message.

| Route | Pick it when | Flow (details in `routes/`) |
|---|---|---|
| `feature` | New behaviour or a design change that spans modules or needs decisions | [how] -> `grill-with-docs` -> `to-spec` -> [`architect`] -> `to-tickets` -> `tdd` per ticket -> `tidy` -> commit |
| `small` | Short, contained change (UI tweak, copy, config, one function) | 1-2 files: `tdd` or a run-the-app check -> `tidy` -> commit. Several files or an interface change: `to-tickets` first |
| `bug` | Something is broken, throwing, failing, or slow | `diagnosing-bugs` (ends in a regression test) -> `tidy` -> commit |
| `understand` | The user wants to know how or why, and nothing should change | `how` / `why` / `explain` |
| `refactor` | Restructure with no behaviour change | `codebase-design` [+ `improve-codebase-architecture`] -> `tdd` -> `tidy` -> commit |
| `pr` | The user asks to open or update a PR | `review-loop` -> `pr-sketch` -> `gh pr create` |

Signals: how many files the change touches, whether an interface, schema, or public API changes, new behaviour versus wrong behaviour. A task too big and foggy for one session (greenfield project, whole subsystem) is `feature` run in slices: suggest the user run `/wayfinder` first to chart the decisions, then run each resolved slice through `feature`. `wayfinder` is user-only, so do not invoke it. If two routes fit equally, or the acceptance criteria are unclear, ask one question before routing. Do not write code while the task is unclear.

## 2. Run the route

Read `routes/<route>.md` and follow it. `small` and `refactor` have their own files; `small` also covers the multi-file case.

Where a route shows `[how]` or `[architect]`, run it only when the area is unfamiliar or the tickets cross a module seam.

## 3. Rules for every route

- **Verify before claiming done.** Run the project's test, typecheck, and lint commands and read the output. Never write "done", "fixed", or "passing" from memory. If a check cannot run, say which and why.
- **Verify each review finding** against the code before acting on it. Do not agree by reflex and do not apply a suggestion you have not checked.
- **Keep spec, plan, and code in step.** When implementation shows the spec or plan is wrong, stop and update the right file first: the spec if intended behaviour changes, the plan if only the approach changes.
- **Files, not tracker.** Specs go to `docs/specs/<feature>.md`, plans to `docs/plans/<feature>/NN-<slug>.md`. They ship in the PR.
- **Subagents sparingly.** Work inline. Use a subagent only for output that would flood the context, such as a codebase sweep or a full test log. `tidy` never uses one.
- **Review only at the PR.** Do not run `review-loop` after each change. It belongs to the `pr` route.

## 4. Finish (routes that change code)

In this order, and do not skip a step because no hook enforces it:

1. Checks green: tests, typecheck, lint.
2. Spec, plan, and code agree.
3. Stage the change, then run `tidy`. It prints `done`.
4. Check the branch with `git rev-parse --abbrev-ref HEAD`. On `main`, `master`, `develop`, or `dev`, propose a branch name `<type>/<kebab-description>` and switch before committing.
5. Commit with `caveman:caveman-commit` when available, otherwise a Conventional Commits message: `<type>(<scope>): <description>`, lowercase, imperative, at most 72 characters.

A commit gate may also block step 5 when `tidy` has not run on the staged diff (see `README.md`). The steps above work without it.
